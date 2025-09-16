import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Assessment, AssessmentOpportunity, AssessmentTemplate, AssessmentResponse } from '@/types/database';

interface OpportunityRule {
  type: string;
  title: string;
  description: string;
  threshold: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedValue?: number;
  conditions: Record<string, any>;
}

interface GenerationResult {
  opportunities: AssessmentOpportunity[];
  errors: string[];
  duplicatesPreveneted: number;
}

export const useOpportunityGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const evaluateThreshold = useCallback((
    responses: AssessmentResponse[],
    rule: OpportunityRule,
    template: AssessmentTemplate
  ): { meets: boolean; score: number; details: Record<string, any> } => {
    try {
      const scoringRules = template.scoring_rules || {};
      let score = 0;
      let maxScore = 0;
      const details: Record<string, any> = {};

      // Calculate section-based scores if defined
      if (scoringRules.sections && rule.conditions.section) {
        const sectionName = rule.conditions.section;
        const sectionQuestions = responses.filter(r => 
          r.response_data?.section === sectionName
        );

        score = sectionQuestions.reduce((sum, r) => sum + r.score, 0);
        maxScore = scoringRules.sections[sectionName] || 100;
        
        details.sectionScore = score;
        details.sectionMaxScore = maxScore;
        details.sectionName = sectionName;
      } else {
        // Use total score
        score = responses.reduce((sum, r) => sum + r.score, 0);
        maxScore = template.max_score || 100;
        
        details.totalScore = score;
        details.totalMaxScore = maxScore;
      }

      // Calculate percentage
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      details.percentage = percentage;

      // Determine if threshold is met (typically low scores indicate opportunities)
      const meets = percentage < rule.threshold;

      return { meets, score: percentage, details };

    } catch (error) {
      console.error('Threshold evaluation error:', error);
      return { meets: false, score: 0, details: { error: error.message } };
    }
  }, []);

  const calculatePriority = useCallback((
    rule: OpportunityRule,
    score: number,
    assessment: Assessment
  ): 'low' | 'medium' | 'high' | 'critical' => {
    try {
      // Base priority from rule
      let priority = rule.priority;

      // Adjust based on score deviation from threshold
      const deviation = rule.threshold - score;

      if (deviation > 30) {
        // Very low score - upgrade priority
        if (priority === 'low') priority = 'medium';
        else if (priority === 'medium') priority = 'high';
        else if (priority === 'high') priority = 'critical';
      } else if (deviation < 10) {
        // Score is close to threshold - downgrade priority
        if (priority === 'critical') priority = 'high';
        else if (priority === 'high') priority = 'medium';
        else if (priority === 'medium') priority = 'low';
      }

      // Consider client value/size if available in assessment data
      if (assessment.session_data?.clientValue === 'enterprise') {
        if (priority === 'low') priority = 'medium';
        else if (priority === 'medium') priority = 'high';
      }

      return priority;

    } catch (error) {
      console.error('Priority calculation error:', error);
      return rule.priority;
    }
  }, []);

  const preventDuplicates = useCallback(async (
    clientId: string,
    opportunityType: string,
    assessmentId: string
  ): Promise<boolean> => {
    try {
      // Check for existing opportunities of the same type for this client
      const { data: existing, error } = await supabase
        .from('assessment_opportunities')
        .select('id, status, created_at')
        .eq('client_id', clientId)
        .eq('opportunity_type', opportunityType)
        .in('status', ['identified', 'qualified', 'proposal_sent'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (existing && existing.length > 0) {
        const existingOpportunity = existing[0];
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(existingOpportunity.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Prevent duplicates if created within last 30 days
        if (daysSinceCreated < 30) {
          return true; // Duplicate prevented
        }
      }

      return false; // Not a duplicate

    } catch (error) {
      console.error('Duplicate prevention error:', error);
      return false; // Allow creation on error
    }
  }, []);

  const generateOpportunities = useCallback(async (
    assessmentId: string
  ): Promise<GenerationResult> => {
    setIsGenerating(true);

    try {
      // Load assessment data
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Load template with threshold rules
      const { data: template, error: templateError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', assessment.template_id)
        .single();

      if (templateError) throw templateError;

      // Load responses
      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      if (!responses || responses.length === 0) {
        return { opportunities: [], errors: ['No responses found'], duplicatesPreveneted: 0 };
      }

      // Extract opportunity rules from template
      const thresholdRules = template.threshold_rules || {};
      const opportunityRules: OpportunityRule[] = [];

      if (thresholdRules.opportunities) {
        Object.entries(thresholdRules.opportunities).forEach(([key, rule]: [string, any]) => {
          opportunityRules.push({
            type: key,
            title: rule.title || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: rule.description || `Opportunity identified: ${key}`,
            threshold: rule.threshold || 70,
            priority: rule.priority || 'medium',
            estimatedValue: rule.estimatedValue,
            conditions: rule.conditions || {}
          });
        });
      }

      const opportunities: AssessmentOpportunity[] = [];
      const errors: string[] = [];
      let duplicatesPreveneted = 0;

      // Generate opportunities based on rules
      for (const rule of opportunityRules) {
        try {
          // Evaluate threshold
          const evaluation = evaluateThreshold(responses, rule, template);

          if (evaluation.meets) {
            // Check for duplicates
            const isDuplicate = await preventDuplicates(
              assessment.client_id,
              rule.type,
              assessmentId
            );

            if (isDuplicate) {
              duplicatesPreveneted++;
              continue;
            }

            // Calculate priority
            const priority = calculatePriority(rule, evaluation.score, assessment);

            // Create opportunity
            const opportunityData = {
              assessment_id: assessmentId,
              client_id: assessment.client_id,
              opportunity_type: rule.type,
              title: rule.title,
              description: rule.description,
              priority,
              status: 'identified' as const,
              estimated_value: rule.estimatedValue,
              currency: 'USD',
              threshold_data: {
                threshold: rule.threshold,
                actualScore: evaluation.score,
                evaluationDetails: evaluation.details
              },
              detection_rules: {
                rule: rule,
                conditions: rule.conditions,
                evaluationResult: evaluation
              }
            };

            const { data: newOpportunity, error: createError } = await supabase
              .from('assessment_opportunities')
              .insert(opportunityData)
              .select()
              .single();

            if (createError) {
              errors.push(`Failed to create opportunity "${rule.title}": ${createError.message}`);
              continue;
            }

            opportunities.push(newOpportunity);

          }
        } catch (error) {
          errors.push(`Error processing rule "${rule.title}": ${error.message}`);
        }
      }

      // Log generation results
      if (opportunities.length > 0) {
        console.log(`Generated ${opportunities.length} opportunities for assessment ${assessmentId}`);
      }

      if (duplicatesPreveneted > 0) {
        console.log(`Prevented ${duplicatesPreveneted} duplicate opportunities`);
      }

      if (errors.length > 0) {
        console.error('Opportunity generation errors:', errors);
      }

      return { opportunities, errors, duplicatesPreveneted };

    } catch (error) {
      console.error('Opportunity generation failed:', error);
      return {
        opportunities: [],
        errors: [`Generation failed: ${error.message}`],
        duplicatesPreveneted: 0
      };
    } finally {
      setIsGenerating(false);
    }
  }, [evaluateThreshold, calculatePriority, preventDuplicates]);

  const assignOpportunity = useCallback(async (
    opportunityId: string,
    assignedTo: string,
    dueDate?: string
  ): Promise<boolean> => {
    setIsAssigning(true);

    try {
      const updateData: any = {
        assigned_to: assignedTo,
        status: 'qualified',
        updated_at: new Date().toISOString()
      };

      if (dueDate) {
        updateData.due_date = dueDate;
      }

      const { error } = await supabase
        .from('assessment_opportunities')
        .update(updateData)
        .eq('id', opportunityId);

      if (error) throw error;

      toast({
        title: "Opportunity Assigned",
        description: "Opportunity has been assigned successfully.",
      });

      return true;

    } catch (error) {
      console.error('Assignment failed:', error);
      
      // Log assignment error
      await supabase
        .from('assessment_error_logs')
        .insert({
          assessment_id: null,
          error_type: 'assignment_failed',
          error_message: `Failed to assign opportunity ${opportunityId}: ${error.message}`,
          error_details: { opportunityId, assignedTo, dueDate },
          context: { action: 'assign_opportunity' },
          severity: 'error'
        });

      toast({
        title: "Assignment Failed",
        description: "Failed to assign opportunity. Please try again.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsAssigning(false);
    }
  }, []);

  const scheduleFollowUp = useCallback(async (
    opportunityId: string,
    followUpDate: string,
    automationRules?: Record<string, any>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assessment_opportunities')
        .update({
          follow_up_date: followUpDate,
          automation_errors: [] // Clear previous errors
        })
        .eq('id', opportunityId);

      if (error) throw error;

      // Here you would integrate with your automation system
      // For now, we'll just log the scheduled follow-up
      console.log(`Follow-up scheduled for opportunity ${opportunityId} on ${followUpDate}`);

      if (automationRules) {
        console.log('Automation rules:', automationRules);
      }

      toast({
        title: "Follow-up Scheduled",
        description: `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}`,
      });

      return true;

    } catch (error) {
      console.error('Follow-up scheduling failed:', error);
      
      // Log automation error
      await supabase
        .from('assessment_opportunities')
        .update({
          automation_errors: [
            {
              type: 'followup_schedule_failed',
              message: error.message,
              timestamp: new Date().toISOString(),
              context: { followUpDate, automationRules }
            }
          ]
        })
        .eq('id', opportunityId);

      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule follow-up. Please try again.",
        variant: "destructive",
      });

      return false;
    }
  }, []);

  const updateOpportunityStatus = useCallback(async (
    opportunityId: string,
    status: 'identified' | 'qualified' | 'proposal_sent' | 'won' | 'lost' | 'cancelled',
    notes?: string
  ): Promise<boolean> => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.description = notes;
      }

      const { error } = await supabase
        .from('assessment_opportunities')
        .update(updateData)
        .eq('id', opportunityId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Opportunity status changed to ${status.replace('_', ' ')}`,
      });

      return true;

    } catch (error) {
      console.error('Status update failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update opportunity status. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  return {
    generateOpportunities,
    assignOpportunity,
    scheduleFollowUp,
    updateOpportunityStatus,
    isGenerating,
    isAssigning
  };
};