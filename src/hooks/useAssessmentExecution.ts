import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Assessment, AssessmentQuestion, AssessmentResponse, AssessmentTemplate } from '@/types/database';

interface AssessmentSession {
  assessment: Assessment;
  template: AssessmentTemplate;
  questions: AssessmentQuestion[];
  responses: AssessmentResponse[];
  currentQuestion: AssessmentQuestion | null;
  isComplete: boolean;
  progress: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
}

export const useAssessmentExecution = (assessmentId: string) => {
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const pendingResponsesRef = useRef<Map<string, any>>(new Map());
  const maxRecoveryAttempts = 3;

  // Load assessment session
  const loadSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setNetworkError(false);

      // Load assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Load template
      const { data: template, error: templateError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', assessment.template_id)
        .single();

      if (templateError) throw templateError;

      // Load questions
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', assessment.template_id)
        .order('question_number');

      if (questionsError) throw questionsError;

      // Load existing responses
      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      // Calculate progress
      const totalQuestions = questions?.length || 0;
      const answeredQuestions = responses?.length || 0;
      const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      // Find current question
      const currentQuestionIndex = Math.min(assessment.current_question - 1, totalQuestions - 1);
      const currentQuestion = questions?.[currentQuestionIndex] || null;

      setSession({
        assessment,
        template,
        questions: questions || [],
        responses: responses || [],
        currentQuestion,
        isComplete: assessment.status === 'completed',
        progress
      });

      setRecoveryAttempts(0);

    } catch (error) {
      console.error('Failed to load assessment session:', error);
      setNetworkError(true);
      
      if (recoveryAttempts < maxRecoveryAttempts) {
        setTimeout(() => {
          setRecoveryAttempts(prev => prev + 1);
          loadSession();
        }, 1000 * Math.pow(2, recoveryAttempts)); // Exponential backoff
      } else {
        toast({
          title: "Session Load Failed",
          description: "Unable to load assessment. Please refresh the page.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [assessmentId, recoveryAttempts]);

  // Validate response based on question rules
  const validateResponse = useCallback((
    question: AssessmentQuestion,
    responseValue: any
  ): ValidationResult => {
    const errors: string[] = [];
    let score = 0;

    // Required field validation
    if (question.required && (responseValue === null || responseValue === undefined || responseValue === '')) {
      errors.push('This field is required');
      return { isValid: false, errors, score: 0 };
    }

    // Skip validation if not required and empty
    if (!question.required && (responseValue === null || responseValue === undefined || responseValue === '')) {
      return { isValid: true, errors: [], score: 0 };
    }

    // Type-specific validation
    switch (question.question_type) {
      case 'text':
        if (typeof responseValue !== 'string') {
          errors.push('Response must be text');
          break;
        }
        
        const rules = question.validation_rules || {};
        if (rules.min_length && responseValue.length < rules.min_length) {
          errors.push(`Minimum length is ${rules.min_length} characters`);
        }
        if (rules.max_length && responseValue.length > rules.max_length) {
          errors.push(`Maximum length is ${rules.max_length} characters`);
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(responseValue)) {
          errors.push('Invalid format');
        }
        
        score = errors.length === 0 ? question.max_points : 0;
        break;

      case 'number':
        const numValue = parseFloat(responseValue);
        if (isNaN(numValue)) {
          errors.push('Response must be a number');
          break;
        }
        
        const numRules = question.validation_rules || {};
        if (numRules.min_value !== undefined && numValue < numRules.min_value) {
          errors.push(`Minimum value is ${numRules.min_value}`);
        }
        if (numRules.max_value !== undefined && numValue > numRules.max_value) {
          errors.push(`Maximum value is ${numRules.max_value}`);
        }
        
        score = errors.length === 0 ? question.max_points : 0;
        break;

      case 'boolean':
        if (typeof responseValue !== 'boolean') {
          errors.push('Please select yes or no');
          break;
        }
        score = question.max_points;
        break;

      case 'single_choice':
        const validOptions = question.options.map(opt => opt.value);
        if (!validOptions.includes(responseValue)) {
          errors.push('Please select a valid option');
          break;
        }
        
        // Calculate score based on option value
        const selectedOption = question.options.find(opt => opt.value === responseValue);
        score = selectedOption ? (selectedOption.value * question.max_points) / Math.max(...question.options.map(opt => opt.value)) : 0;
        break;

      case 'multiple_choice':
        if (!Array.isArray(responseValue)) {
          errors.push('Invalid selection');
          break;
        }
        
        const validMultiOptions = question.options.map(opt => opt.value);
        const invalidSelections = responseValue.filter(val => !validMultiOptions.includes(val));
        if (invalidSelections.length > 0) {
          errors.push('Some selections are invalid');
          break;
        }
        
        // Calculate score based on correct selections
        const maxSelections = question.options.length;
        const selectedCount = responseValue.length;
        score = (selectedCount / maxSelections) * question.max_points;
        break;

      case 'scale':
        const scaleValue = parseInt(responseValue);
        const scaleOptions = question.options.map(opt => opt.value);
        if (!scaleOptions.includes(scaleValue)) {
          errors.push('Please select a valid scale value');
          break;
        }
        
        const maxScale = Math.max(...scaleOptions);
        score = (scaleValue / maxScale) * question.max_points;
        break;

      default:
        score = question.max_points;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: errors.length === 0 ? score : 0
    };
  }, []);

  // Save response with auto-retry
  const saveResponse = useCallback(async (
    questionId: string,
    responseValue: any,
    isAutoSave: boolean = false
  ): Promise<boolean> => {
    if (!session) return false;

    try {
      setIsSaving(true);
      setNetworkError(false);

      const question = session.questions.find(q => q.id === questionId);
      if (!question) throw new Error('Question not found');

      // Validate response
      const validation = validateResponse(question, responseValue);

      const responseData = {
        tenant_id: 'demo-tenant-id', // Would use actual tenant_id from auth
        assessment_id: assessmentId,
        question_id: questionId,
        response_value: typeof responseValue === 'object' ? JSON.stringify(responseValue) : String(responseValue),
        response_data: {
          originalValue: responseValue,
          validationResult: {
            isValid: validation.isValid,
            errors: validation.errors,
            score: validation.score
          }
        } as any,
        score: validation.score,
        auto_saved: isAutoSave,
        validation_status: validation.isValid ? 'valid' : 'invalid',
        validation_errors: validation.errors as any
      };

      // Check if response already exists
      const existingResponse = session.responses.find(r => r.question_id === questionId);

      let savedResponse;
      if (existingResponse) {
        const { data, error } = await supabase
          .from('assessment_responses')
          .update(responseData)
          .eq('id', existingResponse.id)
          .select()
          .single();

        if (error) throw error;
        savedResponse = data;
      } else {
        const { data, error } = await supabase
          .from('assessment_responses')
          .insert(responseData)
          .select()
          .single();

        if (error) throw error;
        savedResponse = data;
      }

      // Update session
      setSession(prev => {
        if (!prev) return prev;

        const newResponses = existingResponse
          ? prev.responses.map(r => r.id === existingResponse.id ? savedResponse : r)
          : [...prev.responses, savedResponse];

        const totalQuestions = prev.questions.length;
        const answeredQuestions = newResponses.length;
        const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

        return {
          ...prev,
          responses: newResponses,
          progress
        };
      });

      // Remove from pending responses
      pendingResponsesRef.current.delete(questionId);
      setLastSaveTime(new Date());

      if (!isAutoSave && !validation.isValid) {
        toast({
          title: "Validation Issues",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
      }

      return true;

    } catch (error) {
      console.error('Failed to save response:', error);
      setNetworkError(true);

      // Add to pending responses for retry
      pendingResponsesRef.current.set(questionId, responseValue);

      if (!isAutoSave) {
        toast({
          title: "Save Failed",
          description: "Response will be saved when connection is restored.",
          variant: "destructive",
        });
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  }, [session, assessmentId, validateResponse]);

  // Auto-save functionality
  const startAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = setInterval(async () => {
      if (pendingResponsesRef.current.size > 0) {
        console.log('Auto-saving pending responses...');
        
        for (const [questionId, responseValue] of pendingResponsesRef.current) {
          await saveResponse(questionId, responseValue, true);
        }
      }
    }, 30000); // Auto-save every 30 seconds
  }, [saveResponse]);

  // Navigate to next question
  const nextQuestion = useCallback(async (): Promise<void> => {
    if (!session || !session.currentQuestion) return;

    const currentIndex = session.questions.findIndex(q => q.id === session.currentQuestion?.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < session.questions.length) {
      const nextQuestion = session.questions[nextIndex];
      
      // Update assessment current question
      await supabase
        .from('assessments')
        .update({ 
          current_question: nextQuestion.question_number,
          last_saved_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      setSession(prev => prev ? {
        ...prev,
        currentQuestion: nextQuestion,
        assessment: {
          ...prev.assessment,
          current_question: nextQuestion.question_number
        }
      } : prev);
    }
  }, [session, assessmentId]);

  // Go to previous question
  const previousQuestion = useCallback(async (): Promise<void> => {
    if (!session || !session.currentQuestion) return;

    const currentIndex = session.questions.findIndex(q => q.id === session.currentQuestion?.id);
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      const prevQuestion = session.questions[prevIndex];
      
      // Update assessment current question
      await supabase
        .from('assessments')
        .update({ 
          current_question: prevQuestion.question_number,
          last_saved_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      setSession(prev => prev ? {
        ...prev,
        currentQuestion: prevQuestion,
        assessment: {
          ...prev.assessment,
          current_question: prevQuestion.question_number
        }
      } : prev);
    }
  }, [session, assessmentId]);

  // Complete assessment
  const completeAssessment = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      // Calculate final scores
      const totalScore = session.responses.reduce((sum, response) => sum + response.score, 0);
      const maxPossibleScore = session.questions.reduce((sum, question) => sum + question.max_points, 0);
      const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      // Update assessment status
      await supabase
        .from('assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          percentage_score: percentageScore
        })
        .eq('id', assessmentId);

      setSession(prev => prev ? {
        ...prev,
        isComplete: true,
        assessment: {
          ...prev.assessment,
          status: 'completed',
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          percentage_score: percentageScore
        }
      } : prev);

      toast({
        title: "Assessment Completed",
        description: `Final score: ${percentageScore.toFixed(1)}%`,
      });

      return true;

    } catch (error) {
      console.error('Failed to complete assessment:', error);
      toast({
        title: "Completion Failed",
        description: "Failed to complete assessment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [session, assessmentId]);

  // Initialize and cleanup
  useEffect(() => {
    loadSession();
    startAutoSave();

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [loadSession, startAutoSave]);

  // Recovery mechanism for network issues
  useEffect(() => {
    const handleOnline = () => {
      if (networkError) {
        console.log('Network restored, attempting recovery...');
        loadSession();
      }
    };

    const handleOffline = () => {
      setNetworkError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [networkError, loadSession]);

  return {
    session,
    isLoading,
    isSaving,
    networkError,
    lastSaveTime,
    saveResponse,
    nextQuestion,
    previousQuestion,
    completeAssessment,
    reloadSession: loadSession
  };
};