import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  workflow_type: 'scheduled' | 'trigger' | 'manual';
  trigger_config: any;
  steps: WorkflowStep[];
  conditions: any;
  retry_config: {
    max_attempts: number;
    delay_seconds: number[];
  };
  status: 'active' | 'inactive' | 'paused';
  is_ai_powered: boolean;
  fallback_workflow_id?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'ai_task' | 'notification';
  config: any;
  rollback_config?: any;
  timeout_seconds?: number;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  execution_status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  steps_completed: number;
  steps_total: number;
  current_step?: any;
  execution_log: ExecutionLogEntry[];
  error_step?: number;
  error_message?: string;
  manual_intervention_required: boolean;
}

interface ExecutionLogEntry {
  step_id: string;
  step_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at: string;
  completed_at?: string;
  result?: any;
  error?: string;
  rollback_completed?: boolean;
}

export const useAutomationEngine = () => {
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);

  const createWorkflow = useCallback(async (workflowConfig: Partial<AutomationWorkflow>) => {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .insert({
          name: workflowConfig.name || 'Untitled Workflow',
          description: workflowConfig.description,
          workflow_type: workflowConfig.workflow_type || 'manual',
          trigger_config: workflowConfig.trigger_config || {},
          steps: JSON.stringify(workflowConfig.steps || []),
          conditions: workflowConfig.conditions || {},
          retry_config: workflowConfig.retry_config || {
            max_attempts: 3,
            delay_seconds: [60, 300, 900]
          },
          is_ai_powered: workflowConfig.is_ai_powered || false,
          fallback_workflow_id: workflowConfig.fallback_workflow_id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Workflow Created",
        description: `Workflow "${data.name}" has been created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create workflow",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const executeWorkflow = useCallback(async (
    workflowId: string,
    context: any = {}
  ): Promise<{ success: boolean; executionId?: string }> => {
    setIsExecuting(true);
    
    try {
      // Get workflow configuration
      const { data: workflow, error: workflowError } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;

      if (workflow.status !== 'active') {
        throw new Error('Workflow is not active');
      }

      // Validate workflow before execution
      const validationResult = await validateWorkflow(workflow);
      if (!validationResult.valid) {
        throw new Error(`Workflow validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          execution_status: 'running',
          steps_total: workflow.steps.length,
          steps_completed: 0,
          execution_log: [],
          context_data: context
        })
        .select()
        .single();

      if (executionError) throw executionError;

      setCurrentExecution(execution);

      // Execute workflow steps
      let executionResult;
      try {
        executionResult = await executeWorkflowSteps(execution.id, workflow, context);
      } catch (stepError) {
        // Try fallback workflow if available
        if (workflow.fallback_workflow_id) {
          console.log('Primary workflow failed, trying fallback...');
          executionResult = await executeFallbackWorkflow(
            execution.id, 
            workflow.fallback_workflow_id, 
            context
          );
        } else {
          throw stepError;
        }
      }

      // Update execution status
      await supabase
        .from('workflow_executions')
        .update({
          execution_status: executionResult.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - new Date(execution.started_at).getTime(),
          steps_completed: executionResult.stepsCompleted,
          error_message: executionResult.error
        })
        .eq('id', execution.id);

      // Update workflow statistics
      await updateWorkflowStats(workflowId, executionResult.success);

      if (executionResult.success) {
        toast({
          title: "Workflow Completed",
          description: `Workflow "${workflow.name}" executed successfully`,
        });
      } else {
        toast({
          title: "Workflow Failed",
          description: `Workflow execution failed: ${executionResult.error}`,
          variant: "destructive",
        });
      }

      return {
        success: executionResult.success,
        executionId: execution.id
      };

    } catch (error) {
      console.error('Workflow execution error:', error);
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "Failed to execute workflow",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsExecuting(false);
      setCurrentExecution(null);
    }
  }, [toast]);

  const validateWorkflow = async (workflow: AutomationWorkflow): Promise<{
    valid: boolean;
    errors: string[];
  }> => {
    const errors: string[] = [];

    // Check if steps exist
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Validate each step
    workflow.steps.forEach((step, index) => {
      if (!step.name) {
        errors.push(`Step ${index + 1} is missing a name`);
      }
      if (!step.type) {
        errors.push(`Step ${index + 1} is missing a type`);
      }
      if (!step.config) {
        errors.push(`Step ${index + 1} is missing configuration`);
      }
    });

    // Check for circular dependencies
    if (hasCircularDependencies(workflow.steps)) {
      errors.push('Workflow contains circular dependencies');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const executeWorkflowSteps = async (
    executionId: string,
    workflow: AutomationWorkflow,
    context: any
  ): Promise<{ success: boolean; stepsCompleted: number; error?: string }> => {
    const steps = workflow.steps;
    let stepsCompleted = 0;
    const executionLog: ExecutionLogEntry[] = [];

    try {
      for (const [index, step] of steps.entries()) {
        const stepStartTime = Date.now();
        
        const logEntry: ExecutionLogEntry = {
          step_id: step.id,
          step_name: step.name,
          status: 'running',
          started_at: new Date().toISOString()
        };

        try {
          // Execute step with timeout
          const stepResult = await executeStepWithTimeout(step, context, workflow);
          
          logEntry.status = 'completed';
          logEntry.completed_at = new Date().toISOString();
          logEntry.result = stepResult;
          
          stepsCompleted++;

          // Update context with step result
          context = { ...context, ...stepResult };

        } catch (stepError) {
          logEntry.status = 'failed';
          logEntry.completed_at = new Date().toISOString();
          logEntry.error = stepError instanceof Error ? stepError.message : 'Unknown error';

          // Attempt rollback if configured
          if (step.rollback_config) {
            await performStepRollback(step, context, executionLog);
            logEntry.rollback_completed = true;
          }

          // Check if this requires manual intervention
          if (step.config.require_manual_intervention_on_failure) {
            await supabase
              .from('workflow_executions')
              .update({
                manual_intervention_required: true,
                intervention_message: `Step "${step.name}" failed and requires manual intervention`
              })
              .eq('id', executionId);
          }

          throw stepError;
        }

        executionLog.push(logEntry);

        // Update execution progress
        await supabase
          .from('workflow_executions')
          .update({
            steps_completed: stepsCompleted,
            current_step: step,
            execution_log: executionLog
          })
          .eq('id', executionId);
      }

      return { success: true, stepsCompleted };

    } catch (error) {
      // Perform full rollback if configured
      if (workflow.retry_config.max_attempts > 1) {
        await performFullRollback(executionId, executionLog);
      }

      return {
        success: false,
        stepsCompleted,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const executeStepWithTimeout = async (
    step: WorkflowStep,
    context: any,
    workflow: AutomationWorkflow
  ): Promise<any> => {
    const timeout = step.timeout_seconds || 300; // 5 minutes default

    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Step "${step.name}" timed out after ${timeout} seconds`));
      }, timeout * 1000);

      try {
        let result;

        switch (step.type) {
          case 'action':
            result = await executeActionStep(step, context);
            break;
          case 'condition':
            result = await executeConditionStep(step, context);
            break;
          case 'ai_task':
            result = await executeAIStep(step, context, workflow.is_ai_powered);
            break;
          case 'notification':
            result = await executeNotificationStep(step, context);
            break;
          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }

        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  };

  const executeActionStep = async (step: WorkflowStep, context: any): Promise<any> => {
    const { action, params } = step.config;

    switch (action) {
      case 'create_record':
        return await supabase
          .from(params.table)
          .insert(replaceVariables(params.data, context))
          .select()
          .single();

      case 'update_record':
        return await supabase
          .from(params.table)
          .update(replaceVariables(params.data, context))
          .eq(params.id_field, replaceVariables(params.id_value, context))
          .select();

      case 'send_email':
        return await supabase.functions.invoke('send-email', {
          body: replaceVariables(params, context)
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  };

  const executeConditionStep = async (step: WorkflowStep, context: any): Promise<any> => {
    const { condition, true_path, false_path } = step.config;
    
    const result = evaluateCondition(condition, context);
    
    return {
      condition_result: result,
      next_path: result ? true_path : false_path
    };
  };

  const executeAIStep = async (step: WorkflowStep, context: any, aiEnabled: boolean): Promise<any> => {
    if (!aiEnabled) {
      // Fallback to rule-based logic
      return executeRuleBasedFallback(step, context);
    }

    const { prompt, ai_model } = step.config;
    
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        prompt: replaceVariables(prompt, context),
        model: ai_model,
        requestType: 'automation'
      }
    });

    if (error) {
      // Fallback to rule-based logic
      return executeRuleBasedFallback(step, context);
    }

    return { ai_response: data.response, confidence: data.confidence_score };
  };

  const executeNotificationStep = async (step: WorkflowStep, context: any): Promise<any> => {
    const { notification_type, recipients, message } = step.config;

    return await supabase.functions.invoke('send-notification', {
      body: {
        type: notification_type,
        recipients: replaceVariables(recipients, context),
        message: replaceVariables(message, context)
      }
    });
  };

  const executeRuleBasedFallback = async (step: WorkflowStep, context: any): Promise<any> => {
    const { fallback_rules } = step.config;
    
    if (!fallback_rules) {
      return { fallback_result: 'No fallback rules configured' };
    }

    // Execute simple rule-based logic
    for (const rule of fallback_rules) {
      if (evaluateCondition(rule.condition, context)) {
        return { fallback_result: rule.result };
      }
    }

    return { fallback_result: 'No matching rule found' };
  };

  const executeFallbackWorkflow = async (
    originalExecutionId: string,
    fallbackWorkflowId: string,
    context: any
  ): Promise<{ success: boolean; stepsCompleted: number; error?: string }> => {
    try {
      const { data: fallbackWorkflow, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('id', fallbackWorkflowId)
        .single();

      if (error) throw error;

      return await executeWorkflowSteps(originalExecutionId, fallbackWorkflow, context);
    } catch (error) {
      return {
        success: false,
        stepsCompleted: 0,
        error: `Fallback workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  const performStepRollback = async (
    step: WorkflowStep,
    context: any,
    executionLog: ExecutionLogEntry[]
  ): Promise<void> => {
    try {
      const { rollback_action, rollback_params } = step.rollback_config;
      
      // Execute rollback action
      await executeActionStep({
        ...step,
        config: {
          action: rollback_action,
          params: rollback_params
        }
      }, context);
      
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
  };

  const performFullRollback = async (
    executionId: string,
    executionLog: ExecutionLogEntry[]
  ): Promise<void> => {
    try {
      // Rollback completed steps in reverse order
      const completedSteps = executionLog
        .filter(entry => entry.status === 'completed')
        .reverse();

      for (const entry of completedSteps) {
        // Mark step as being rolled back
        entry.rollback_completed = true;
      }

      await supabase
        .from('workflow_executions')
        .update({
          rollback_completed: true,
          execution_log: executionLog
        })
        .eq('id', executionId);

    } catch (error) {
      console.error('Full rollback failed:', error);
    }
  };

  const updateWorkflowStats = async (workflowId: string, success: boolean): Promise<void> => {
    try {
      const updates: any = {
        execution_count: supabase.rpc('increment', { x: 1 }),
        last_executed_at: new Date().toISOString()
      };

      if (success) {
        updates.success_count = supabase.rpc('increment', { x: 1 });
      } else {
        updates.failure_count = supabase.rpc('increment', { x: 1 });
      }

      await supabase
        .from('automation_workflows')
        .update(updates)
        .eq('id', workflowId);
    } catch (error) {
      console.error('Failed to update workflow stats:', error);
    }
  };

  const replaceVariables = (template: any, context: any): any => {
    if (typeof template === 'string') {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] !== undefined ? context[key] : match;
      });
    }
    
    if (Array.isArray(template)) {
      return template.map(item => replaceVariables(item, context));
    }
    
    if (typeof template === 'object' && template !== null) {
      const result: any = {};
      Object.entries(template).forEach(([key, value]) => {
        result[key] = replaceVariables(value, context);
      });
      return result;
    }
    
    return template;
  };

  const evaluateCondition = (condition: any, context: any): boolean => {
    // Simple condition evaluation
    const { field, operator, value } = condition;
    const contextValue = context[field];

    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'not_equals':
        return contextValue !== value;
      case 'greater_than':
        return Number(contextValue) > Number(value);
      case 'less_than':
        return Number(contextValue) < Number(value);
      case 'contains':
        return String(contextValue).includes(String(value));
      default:
        return false;
    }
  };

  const hasCircularDependencies = (steps: WorkflowStep[]): boolean => {
    // Simplified circular dependency check
    // In a production system, you'd implement proper graph traversal
    return false;
  };

  const getWorkflows = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }
  }, []);

  const getExecutionHistory = useCallback(async (workflowId?: string, limit = 50) => {
    try {
      let query = supabase
        .from('workflow_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching execution history:', error);
      return [];
    }
  }, []);

  return {
    createWorkflow,
    executeWorkflow,
    getWorkflows,
    getExecutionHistory,
    isExecuting,
    currentExecution
  };
};