import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AssessmentExecutionInterface } from '@/components/Assessments/AssessmentExecutionInterface';
import { 
  ArrowLeft, 
  Building2, 
  FileText,
  Clock,
  Target
} from 'lucide-react';
import { format } from 'date-fns';

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'number' | 'boolean' | 'scale';
  section: string;
  options?: Array<{ label: string; value: number; description?: string }>;
  max_points: number;
  required: boolean;
  help_text?: string;
  validation_rules?: any;
}

interface Assessment {
  id: string;
  client_id: string;
  template_id: string;
  status: string;
  current_question: number;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export const AssessmentExecutionPage = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [clientName, setClientName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentData();
    }
  }, [assessmentId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);

      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Load client name
      const { data: clientData } = await supabase
        .from('clients')
        .select('name')
        .eq('id', assessmentData.client_id)
        .single();

      // Load template and questions
      const { data: templateData } = await supabase
        .from('assessment_templates')
        .select('name')
        .eq('id', assessmentData.template_id)
        .single();

      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', assessmentData.template_id)
        .order('question_number');

      if (questionsError) throw questionsError;

      // Type-safe conversion of questions
      const typedQuestions: Question[] = (questionsData || []).map(q => ({
        id: q.id,
        question_number: q.question_number,
        question_text: q.question_text,
        question_type: q.question_type as 'multiple_choice' | 'text' | 'number' | 'boolean' | 'scale',
        section: q.section || 'General',
        options: Array.isArray(q.options) ? q.options as Array<{ label: string; value: number; description?: string }> : undefined,
        max_points: q.max_points || 1,
        required: q.required || false,
        help_text: q.help_text || undefined,
        validation_rules: q.validation_rules || undefined
      }));

      // Load existing responses
      const { data: responsesData } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);

      // Convert responses to lookup object
      const responsesLookup: Record<string, any> = {};
      responsesData?.forEach(response => {
        responsesLookup[response.question_id] = {
          value: response.response_value,
          score: response.score
        };
      });

      setAssessment(assessmentData);
      setQuestions(typedQuestions);
      setResponses(responsesLookup);
      setClientName(clientData?.name || 'Unknown Client');
      setTemplateName(templateData?.name || 'Assessment');
      setCurrentQuestionIndex(Math.max(0, (assessmentData.current_question || 1) - 1));

    } catch (error) {
      console.error('Error loading assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment data',
        variant: 'destructive',
      });
      navigate('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const saveResponse = async (questionId: string, value: any, score: number) => {
    try {
      setSaving(true);

      // Get current user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Failed to get user profile');
      }

      // First, try to update existing response
      const { data: existingResponse } = await supabase
        .from('assessment_responses')
        .select('id')
        .eq('assessment_id', assessmentId!)
        .eq('question_id', questionId)
        .maybeSingle();

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('assessment_responses')
          .update({
            response_value: value.toString(),
            score: score,
            response_data: { selectedValue: value }
          })
          .eq('id', existingResponse.id);

        if (error) throw error;
      } else {
        // Insert new response
        const { error } = await supabase
          .from('assessment_responses')
          .insert({
            tenant_id: userProfile.tenant_id,
            assessment_id: assessmentId!,
            question_id: questionId,
            response_value: value.toString(),
            score: score,
            response_data: { selectedValue: value }
          });

        if (error) throw error;
      }

      // Update local state
      setResponses(prev => ({
        ...prev,
        [questionId]: { value, score }
      }));

      // Update assessment progress
      const completedQuestions = Object.keys(responses).length + 1;
      const currentQuestion = Math.max(currentQuestionIndex + 1, completedQuestions);
      
      await supabase
        .from('assessments')
        .update({
          current_question: currentQuestion,
          last_saved_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any, score: number) => {
    saveResponse(questionId, value, score);
  };

  const handleNavigate = (direction: 'next' | 'previous') => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'previous' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Listen for custom navigation events
  useEffect(() => {
    const handleNavigateToQuestion = (event: any) => {
      const targetIndex = event.detail;
      if (targetIndex >= 0 && targetIndex < questions.length) {
        setCurrentQuestionIndex(targetIndex);
      }
    };

    window.addEventListener('navigate-to-question', handleNavigateToQuestion);
    return () => window.removeEventListener('navigate-to-question', handleNavigateToQuestion);
  }, [questions.length]);

  const completeAssessment = async () => {
    try {
      setCompleting(true);

      // Calculate total score
      const totalScore = Object.values(responses).reduce((sum: number, response: any) => sum + (response.score || 0), 0);
      const maxScore = questions.reduce((sum, q) => sum + q.max_points, 0);
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      const { error } = await supabase
        .from('assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_score: totalScore,
          max_possible_score: maxScore,
          percentage_score: percentage
        })
        .eq('id', assessmentId);

      if (error) throw error;

      toast({
        title: 'Assessment Completed',
        description: `Assessment completed with a score of ${percentage.toFixed(1)}%`,
      });

      navigate('/assessments');

    } catch (error) {
      console.error('Error completing assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete assessment',
        variant: 'destructive',
      });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
          <p className="text-muted-foreground mb-4">The assessment could not be loaded.</p>
          <Button onClick={() => navigate('/assessments')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedQuestions = Object.keys(responses).length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsAnswered = completedQuestions === questions.length;
  const canNavigateNext = currentQuestionIndex < questions.length - 1;
  const canNavigatePrevious = currentQuestionIndex > 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/assessments')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Assessment Execution</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {clientName}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {templateName}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Started {format(new Date(assessment?.started_at || assessment?.created_at || new Date()), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={assessment?.status === 'completed' ? 'default' : 'secondary'}>
              {assessment?.status?.replace('_', ' ').toUpperCase()}
            </Badge>
            {assessment?.status === 'completed' && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Target className="w-3 h-3 mr-1" />
                {assessment.percentage_score?.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Assessment Execution Interface */}
        <AssessmentExecutionInterface
          questions={questions}
          responses={responses}
          currentQuestionIndex={currentQuestionIndex}
          onResponseChange={handleResponseChange}
          onNavigate={handleNavigate}
          onComplete={completeAssessment}
          saving={saving}
          completing={completing}
          canNavigateNext={canNavigateNext}
          canNavigatePrevious={canNavigatePrevious}
          isLastQuestion={isLastQuestion}
          allQuestionsAnswered={allQuestionsAnswered}
        />

        {/* Assessment Summary */}
        {completedQuestions > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{completedQuestions}</p>
                  <p className="text-sm text-muted-foreground">Questions Answered</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Object.values(responses).reduce((sum: number, r: any) => sum + (r.score || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {questions.reduce((sum, q) => sum + q.max_points, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Max Possible</p>
                </div>
              </div>
              
              {assessment?.status === 'completed' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-center">
                    <h3 className="font-semibold text-green-800 mb-2">Assessment Completed!</h3>
                    <p className="text-green-700">
                      Final Score: <span className="font-bold">{assessment.percentage_score?.toFixed(1)}%</span>
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Completed on {format(new Date(assessment.completed_at!), 'MMMM dd, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};