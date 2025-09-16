import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  FileText, 
  Settings,
  HelpCircle,
  GripVertical
} from 'lucide-react';

interface Question {
  id?: string;
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'scale' | 'boolean';
  section: string;
  options?: Array<{ label: string; value: number }>;
  max_points: number;
  required: boolean;
  help_text?: string;
}

interface AssessmentTemplate {
  id?: string;
  name: string;
  description?: string;
  category: string;
  estimated_duration?: number;
  max_score: number;
  passing_score: number;
  status: 'draft' | 'active' | 'archived';
  questions: Question[];
}

interface AssessmentTemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: AssessmentTemplate;
  onSaved?: () => void;
}

export const AssessmentTemplateBuilder: React.FC<AssessmentTemplateBuilderProps> = ({
  open,
  onOpenChange,
  template,
  onSaved
}) => {
  const [formData, setFormData] = useState<AssessmentTemplate>({
    name: '',
    description: '',
    category: '',
    estimated_duration: 30,
    max_score: 100,
    passing_score: 70,
    status: 'draft',
    questions: []
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        estimated_duration: 30,
        max_score: 100,
        passing_score: 70,
        status: 'draft',
        questions: []
      });
    }
  }, [template, open]);

  const addQuestion = () => {
    const newQuestion: Question = {
      question_number: formData.questions.length + 1,
      question_text: '',
      question_type: 'multiple_choice',
      section: 'General',
      options: [
        { label: 'Excellent', value: 5 },
        { label: 'Good', value: 4 },
        { label: 'Fair', value: 3 },
        { label: 'Poor', value: 2 },
        { label: 'None', value: 1 }
      ],
      max_points: 5,
      required: true,
      help_text: ''
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({
        ...q,
        question_number: i + 1
      }))
    }));
  };

  const addOption = (questionIndex: number) => {
    const question = formData.questions[questionIndex];
    const newOption = { label: '', value: 1 };
    
    updateQuestion(questionIndex, {
      options: [...(question.options || []), newOption]
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<{ label: string; value: number }>) => {
    const question = formData.questions[questionIndex];
    const updatedOptions = question.options?.map((opt, i) => 
      i === optionIndex ? { ...opt, ...updates } : opt
    ) || [];
    
    updateQuestion(questionIndex, { options: updatedOptions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions[questionIndex];
    const updatedOptions = question.options?.filter((_, i) => i !== optionIndex) || [];
    
    updateQuestion(questionIndex, { options: updatedOptions });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Get current user and tenant
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

      // Calculate max score from questions
      const calculatedMaxScore = formData.questions.reduce((sum, q) => sum + q.max_points, 0);

      // Save template
      const templateData = {
        tenant_id: userProfile.tenant_id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        estimated_duration: formData.estimated_duration,
        max_score: calculatedMaxScore,
        passing_score: formData.passing_score,
        status: formData.status,
        created_by: user.id,
        scoring_rules: {
          sections: formData.questions.reduce((acc, q) => {
            acc[q.section] = (acc[q.section] || 0) + q.max_points;
            return acc;
          }, {} as Record<string, number>),
          total_possible: calculatedMaxScore
        },
        threshold_rules: {
          opportunities: {
            improvement_needed: {
              threshold: formData.passing_score,
              priority: 'medium',
              title: 'General Improvement Opportunity',
              description: 'Areas identified for improvement based on assessment results'
            }
          }
        }
      };

      let templateId: string;

      if (template?.id) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('assessment_templates')
          .update(templateData)
          .eq('id', template.id);

        if (updateError) throw updateError;
        templateId = template.id;

        // Delete existing questions
        await supabase
          .from('assessment_questions')
          .delete()
          .eq('template_id', template.id);
      } else {
        // Create new template
        const { data: newTemplate, error: insertError } = await supabase
          .from('assessment_templates')
          .insert(templateData)
          .select()
          .single();

        if (insertError) throw insertError;
        templateId = newTemplate.id;
      }

      // Save questions
      const questionsData = formData.questions.map(q => ({
        tenant_id: userProfile.tenant_id,
        template_id: templateId,
        question_number: q.question_number,
        section: q.section,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        max_points: q.max_points,
        required: q.required,
        scoring_weight: 1,
        help_text: q.help_text
      }));

      const { error: questionsError } = await supabase
        .from('assessment_questions')
        .insert(questionsData);

      if (questionsError) throw questionsError;

      toast({
        title: 'Template Saved',
        description: `Assessment template "${formData.name}" has been saved successfully.`,
      });

      onOpenChange(false);
      if (onSaved) onSaved();

    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assessment template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const sections = Array.from(new Set(formData.questions.map(q => q.section))).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {template ? 'Edit Assessment Template' : 'Create Assessment Template'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="questions">Questions ({formData.questions.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., IT Security Assessment"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Security, Infrastructure"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this assessment evaluates..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      estimated_duration: parseInt(e.target.value) || 30 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="passing_score">Passing Score</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      passing_score: parseInt(e.target.value) || 70 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: 'draft' | 'active' | 'archived') => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sections.length > 0 && (
                <div>
                  <Label>Sections ({sections.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sections.map(section => (
                      <Badge key={section} variant="outline">
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Questions</h3>
                <Button onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {formData.questions.map((question, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Question {question.question_number}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Section</Label>
                        <Input
                          value={question.section}
                          onChange={(e) => updateQuestion(index, { section: e.target.value })}
                          placeholder="e.g., Security, Hardware"
                        />
                      </div>
                      <div>
                        <Label>Question Type</Label>
                        <Select 
                          value={question.question_type}
                          onValueChange={(value: any) => updateQuestion(index, { question_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="scale">Scale</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Question Text *</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                        placeholder="Enter your question..."
                      />
                    </div>

                    {question.question_type === 'multiple_choice' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Answer Options</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addOption(index)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 mb-2">
                            <Input
                              value={option.label}
                              onChange={(e) => updateOption(index, optIndex, { label: e.target.value })}
                              placeholder="Option text"
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={option.value}
                              onChange={(e) => updateOption(index, optIndex, { value: parseInt(e.target.value) || 0 })}
                              placeholder="Points"
                              className="w-20"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index, optIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Max Points</Label>
                        <Input
                          type="number"
                          value={question.max_points}
                          onChange={(e) => updateQuestion(index, { max_points: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                        />
                        <Label htmlFor={`required-${index}`}>Required</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Help Text</Label>
                      <Input
                        value={question.help_text}
                        onChange={(e) => updateQuestion(index, { help_text: e.target.value })}
                        placeholder="Optional help text for the question"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              {formData.questions.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No questions added yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your assessment by adding questions
                  </p>
                  <Button onClick={addQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Question
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scoring Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Calculated Max Score</Label>
                    <div className="text-2xl font-bold">
                      {formData.questions.reduce((sum, q) => sum + q.max_points, 0)} points
                    </div>
                  </div>
                  
                  <div>
                    <Label>Questions by Section</Label>
                    <div className="mt-2 space-y-2">
                      {sections.map(section => {
                        const sectionQuestions = formData.questions.filter(q => q.section === section);
                        const sectionPoints = sectionQuestions.reduce((sum, q) => sum + q.max_points, 0);
                        return (
                          <div key={section} className="flex justify-between items-center">
                            <span>{section}</span>
                            <Badge variant="outline">
                              {sectionQuestions.length} questions, {sectionPoints} points
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !formData.name || formData.questions.length === 0}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};