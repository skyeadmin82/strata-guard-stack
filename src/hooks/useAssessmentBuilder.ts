import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AssessmentTemplate, AssessmentQuestion, FormValidationError } from '@/types/database';

interface QuestionValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
  warnings: string[];
}

interface TemplateValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
  warnings: string[];
  totalScore: number;
}

export const useAssessmentBuilder = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateQuestion = useCallback((question: Partial<AssessmentQuestion>): QuestionValidationResult => {
    const errors: FormValidationError[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!question.question_text?.trim()) {
      errors.push({ field: 'question_text', message: 'Question text is required' });
    }

    if (!question.question_type) {
      errors.push({ field: 'question_type', message: 'Question type is required' });
    }

    if (question.question_number === undefined || question.question_number < 1) {
      errors.push({ field: 'question_number', message: 'Valid question number is required' });
    }

    // Question type specific validation
    if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
      if (!question.options || question.options.length < 2) {
        errors.push({ field: 'options', message: 'At least 2 options are required for choice questions' });
      }

      // Validate options format
      if (question.options) {
        question.options.forEach((option, index) => {
          if (!option.label?.trim()) {
            errors.push({ field: `options.${index}.label`, message: `Option ${index + 1} label is required` });
          }
          if (option.value === undefined || option.value === null) {
            errors.push({ field: `options.${index}.value`, message: `Option ${index + 1} value is required` });
          }
        });
      }
    }

    if (question.question_type === 'scale') {
      if (!question.options || question.options.length === 0) {
        errors.push({ field: 'options', message: 'Scale questions require scale options' });
      }
    }

    // Scoring validation
    if (question.max_points !== undefined && question.max_points <= 0) {
      errors.push({ field: 'max_points', message: 'Max points must be greater than 0' });
    }

    if (question.scoring_weight !== undefined && question.scoring_weight <= 0) {
      errors.push({ field: 'scoring_weight', message: 'Scoring weight must be greater than 0' });
    }

    // Conditional logic validation
    if (question.conditional_logic && Object.keys(question.conditional_logic).length > 0) {
      try {
        const logic = question.conditional_logic;
        if (logic.depends_on && !logic.condition) {
          warnings.push('Question has dependency but no condition specified');
        }
      } catch (error) {
        errors.push({ field: 'conditional_logic', message: 'Invalid conditional logic format' });
      }
    }

    // Validation rules validation
    if (question.validation_rules && Object.keys(question.validation_rules).length > 0) {
      try {
        const rules = question.validation_rules;
        if (rules.min_length && rules.max_length && rules.min_length > rules.max_length) {
          errors.push({ field: 'validation_rules', message: 'Min length cannot be greater than max length' });
        }
        if (rules.min_value && rules.max_value && rules.min_value > rules.max_value) {
          errors.push({ field: 'validation_rules', message: 'Min value cannot be greater than max value' });
        }
      } catch (error) {
        errors.push({ field: 'validation_rules', message: 'Invalid validation rules format' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  const validateTemplate = useCallback(async (
    template: Partial<AssessmentTemplate>,
    questions: AssessmentQuestion[]
  ): Promise<TemplateValidationResult> => {
    setIsValidating(true);

    try {
      const errors: FormValidationError[] = [];
      const warnings: string[] = [];

      // Template validation
      if (!template.name?.trim()) {
        errors.push({ field: 'name', message: 'Template name is required' });
      }

      if (!template.category?.trim()) {
        errors.push({ field: 'category', message: 'Category is required' });
      }

      if (template.estimated_duration !== undefined && template.estimated_duration <= 0) {
        errors.push({ field: 'estimated_duration', message: 'Estimated duration must be positive' });
      }

      // Questions validation
      if (questions.length === 0) {
        errors.push({ field: 'questions', message: 'At least one question is required' });
      }

      let totalScore = 0;
      const questionNumbers = new Set<number>();

      questions.forEach((question, index) => {
        const questionValidation = validateQuestion(question);
        
        // Add validation errors with question context
        questionValidation.errors.forEach(error => {
          errors.push({
            field: `questions.${index}.${error.field}`,
            message: `Question ${question.question_number}: ${error.message}`
          });
        });

        // Add warnings
        questionValidation.warnings.forEach(warning => {
          warnings.push(`Question ${question.question_number}: ${warning}`);
        });

        // Check for duplicate question numbers
        if (questionNumbers.has(question.question_number)) {
          errors.push({
            field: `questions.${index}.question_number`,
            message: `Duplicate question number: ${question.question_number}`
          });
        }
        questionNumbers.add(question.question_number);

        // Calculate total score
        totalScore += question.max_points * question.scoring_weight;
      });

      // Scoring rules validation
      if (template.scoring_rules) {
        try {
          const rules = template.scoring_rules;
          if (rules.total_possible && rules.total_possible !== totalScore) {
            warnings.push(`Calculated total score (${totalScore}) differs from specified total (${rules.total_possible})`);
          }
        } catch (error) {
          errors.push({ field: 'scoring_rules', message: 'Invalid scoring rules format' });
        }
      }

      // Threshold rules validation
      if (template.threshold_rules) {
        try {
          const thresholds = template.threshold_rules;
          if (thresholds.opportunities) {
            Object.entries(thresholds.opportunities).forEach(([key, rule]: [string, any]) => {
              if (rule.threshold > totalScore) {
                warnings.push(`Opportunity threshold for "${key}" (${rule.threshold}) exceeds total possible score (${totalScore})`);
              }
            });
          }
        } catch (error) {
          errors.push({ field: 'threshold_rules', message: 'Invalid threshold rules format' });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        totalScore
      };

    } catch (error) {
      console.error('Template validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed - please try again' }],
        warnings: [],
        totalScore: 0
      };
    } finally {
      setIsValidating(false);
    }
  }, [validateQuestion]);

  const saveTemplate = useCallback(async (
    template: Partial<AssessmentTemplate>,
    questions: AssessmentQuestion[]
  ): Promise<{ success: boolean; templateId?: string }> => {
    setIsSaving(true);

    try {
      // Validate first
      const validation = await validateTemplate(template, questions);
      
      if (!validation.isValid) {
        toast({
          title: "Validation Failed",
          description: `Found ${validation.errors.length} errors. Please fix them before saving.`,
          variant: "destructive",
        });
        return { success: false };
      }

      // Save template
      const { data: savedTemplate, error: templateError } = await supabase
        .from('assessment_templates')
        .insert({
          tenant_id: 'demo-tenant-id', // Would use actual tenant_id from auth
          name: template.name || 'Untitled Template',
          description: template.description,
          category: template.category,
          version: template.version || 1,
          status: template.status || 'draft',
          max_score: validation.totalScore,
          scoring_rules: {
            ...template.scoring_rules,
            total_possible: validation.totalScore
          } as any,
          threshold_rules: template.threshold_rules as any,
          conditional_logic: template.conditional_logic as any,
          validation_rules: template.validation_rules as any,
          estimated_duration: template.estimated_duration,
          passing_score: template.passing_score,
          is_active: template.is_active ?? true,
          created_by: template.created_by
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Save questions
      const questionsWithTemplateId = questions.map(q => ({
        tenant_id: 'demo-tenant-id',
        template_id: savedTemplate.id,
        section: q.section,
        question_number: q.question_number,
        question_type: q.question_type,
        question_text: q.question_text,
        description: q.description,
        options: q.options as any,
        validation_rules: q.validation_rules as any,
        scoring_weight: q.scoring_weight,
        max_points: q.max_points,
        required: q.required,
        conditional_logic: q.conditional_logic as any,
        help_text: q.help_text
      }));

      const { error: questionsError } = await supabase
        .from('assessment_questions')
        .insert(questionsWithTemplateId);

      if (questionsError) {
        // Rollback template if questions failed
        await supabase.from('assessment_templates').delete().eq('id', savedTemplate.id);
        throw questionsError;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast({
          title: "Template Saved with Warnings",
          description: `${validation.warnings.length} warnings found. Check console for details.`,
        });
        console.warn('Template warnings:', validation.warnings);
      } else {
        toast({
          title: "Template Saved",
          description: "Assessment template saved successfully.",
        });
      }

      return { success: true, templateId: savedTemplate.id };

    } catch (error) {
      console.error('Template save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save assessment template. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [validateTemplate]);

  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<AssessmentTemplate>,
    questions: AssessmentQuestion[]
  ): Promise<{ success: boolean }> => {
    setIsSaving(true);

    try {
      // Validate updates
      const validation = await validateTemplate(updates, questions);
      
      if (!validation.isValid) {
        toast({
          title: "Validation Failed",
          description: `Found ${validation.errors.length} errors. Please fix them before updating.`,
          variant: "destructive",
        });
        return { success: false };
      }

      // Update template
      const { error: templateError } = await supabase
        .from('assessment_templates')
        .update({
          ...updates,
          max_score: validation.totalScore,
          version: updates.version || 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (templateError) throw templateError;

      // Delete existing questions
      await supabase
        .from('assessment_questions')
        .delete()
        .eq('template_id', templateId);

      // Insert updated questions
      const questionsWithTemplateId = questions.map(q => ({
        ...q,
        template_id: templateId
      }));

      const { error: questionsError } = await supabase
        .from('assessment_questions')
        .insert(questionsWithTemplateId);

      if (questionsError) throw questionsError;

      toast({
        title: "Template Updated",
        description: "Assessment template updated successfully.",
      });

      return { success: true };

    } catch (error) {
      console.error('Template update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update assessment template. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [validateTemplate]);

  const duplicateTemplate = useCallback(async (
    templateId: string,
    newName: string
  ): Promise<{ success: boolean; newTemplateId?: string }> => {
    setIsSaving(true);

    try {
      // Fetch original template and questions
      const { data: originalTemplate, error: templateError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      const { data: originalQuestions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', templateId)
        .order('question_number');

      if (questionsError) throw questionsError;

      // Create new template
      const newTemplate = {
        ...originalTemplate,
        name: newName,
        status: 'draft' as const,
        version: 1,
        created_at: undefined,
        updated_at: undefined,
        id: undefined
      };

      const result = await saveTemplate(newTemplate, originalQuestions || []);

      if (result.success) {
        toast({
          title: "Template Duplicated",
          description: `Template duplicated as "${newName}".`,
        });
      }

      return result;

    } catch (error) {
      console.error('Template duplication error:', error);
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate assessment template. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [saveTemplate]);

  return {
    validateQuestion,
    validateTemplate,
    saveTemplate,
    updateTemplate,
    duplicateTemplate,
    isValidating,
    isSaving
  };
};