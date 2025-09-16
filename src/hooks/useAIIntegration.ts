import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AIRequest {
  id: string;
  request_type: 'analysis' | 'prediction' | 'automation' | 'chat';
  provider: 'openai' | 'claude' | 'fallback';
  model?: string;
  prompt: string;
  response?: string;
  status: 'pending' | 'completed' | 'failed' | 'timeout';
  confidence_score?: number;
  fallback_used: boolean;
  created_at: string;
  completed_at?: string;
}

interface AIRequestOptions {
  provider?: 'openai' | 'claude';
  model?: string;
  maxRetries?: number;
  timeout?: number;
  fallbackToRules?: boolean;
}

export const useAIIntegration = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<AIRequest | null>(null);

  const makeAIRequest = useCallback(async (
    requestType: AIRequest['request_type'],
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<{ success: boolean; response?: string; requestId?: string; fallbackUsed?: boolean }> => {
    setIsProcessing(true);
    
    try {
      // Create AI request record
      const { data: requestData, error: requestError } = await supabase
        .from('ai_requests')
        .insert({
          request_type: requestType,
          provider: options.provider || 'openai',
          model: options.model,
          prompt,
          max_retries: options.maxRetries || 3
        })
        .select()
        .single();

      if (requestError) throw requestError;
      
      setCurrentRequest(requestData);

      // Try primary AI provider
      let result = await tryAIProvider(requestData.id, prompt, options);
      
      // If failed and fallback enabled, try rule-based system
      if (!result.success && options.fallbackToRules) {
        result = await tryFallbackSystem(requestData.id, requestType, prompt);
      }

      // Update request status
      await supabase
        .from('ai_requests')
        .update({
          status: result.success ? 'completed' : 'failed',
          response: result.response,
          fallback_used: result.fallbackUsed || false,
          completed_at: new Date().toISOString(),
          confidence_score: result.confidence
        })
        .eq('id', requestData.id);

      if (result.success) {
        toast({
          title: "AI Request Completed",
          description: result.fallbackUsed ? "Used fallback system" : "AI response generated successfully",
        });
      } else {
        toast({
          title: "AI Request Failed",
          description: "All systems failed. Please try again later.",
          variant: "destructive",
        });
      }

      return {
        success: result.success,
        response: result.response,
        requestId: requestData.id,
        fallbackUsed: result.fallbackUsed
      };

    } catch (error) {
      console.error('AI request error:', error);
      toast({
        title: "AI Integration Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
      setCurrentRequest(null);
    }
  }, [toast]);

  const tryAIProvider = async (
    requestId: string,
    prompt: string,
    options: AIRequestOptions
  ): Promise<{ success: boolean; response?: string; confidence?: number; fallbackUsed?: boolean }> => {
    try {
      const startTime = Date.now();
      
      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          prompt,
          provider: options.provider || 'openai',
          model: options.model,
          requestId
        }
      });

      const latency = Date.now() - startTime;

      if (error) throw error;

      // Update request with performance metrics
      await supabase
        .from('ai_requests')
        .update({
          latency_ms: latency,
          tokens_used: data.tokens_used || 0,
          cost: data.cost || 0
        })
        .eq('id', requestId);

      return {
        success: true,
        response: data.response,
        confidence: data.confidence_score,
        fallbackUsed: false
      };

    } catch (error) {
      console.error('AI provider error:', error);
      
      // Log error for monitoring
      await supabase
        .from('ai_requests')
        .update({
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_code: 'PROVIDER_FAILURE'
        })
        .eq('id', requestId);

      return { success: false, fallbackUsed: false };
    }
  };

  const tryFallbackSystem = async (
    requestId: string,
    requestType: AIRequest['request_type'],
    prompt: string
  ): Promise<{ success: boolean; response?: string; confidence?: number; fallbackUsed: boolean }> => {
    try {
      let fallbackResponse = '';
      
      // Simple rule-based fallbacks based on request type
      switch (requestType) {
        case 'analysis':
          fallbackResponse = generateAnalysisFallback(prompt);
          break;
        case 'prediction':
          fallbackResponse = generatePredictionFallback(prompt);
          break;
        case 'automation':
          fallbackResponse = generateAutomationFallback(prompt);
          break;
        case 'chat':
          fallbackResponse = generateChatFallback(prompt);
          break;
        default:
          fallbackResponse = "I'm unable to process this request right now. Please try again later or contact support.";
      }

      // Update request with fallback info
      await supabase
        .from('ai_requests')
        .update({
          provider: 'fallback',
          fallback_reason: 'Primary AI provider failed'
        })
        .eq('id', requestId);

      return {
        success: true,
        response: fallbackResponse,
        confidence: 0.6, // Lower confidence for rule-based responses
        fallbackUsed: true
      };

    } catch (error) {
      console.error('Fallback system error:', error);
      return { success: false, fallbackUsed: true };
    }
  };

  const generateAnalysisFallback = (prompt: string): string => {
    if (prompt.toLowerCase().includes('revenue') || prompt.toLowerCase().includes('sales')) {
      return "Based on general business analysis principles, I recommend reviewing your sales trends, customer acquisition costs, and revenue growth patterns. Consider seasonal factors and market conditions for a comprehensive analysis.";
    }
    if (prompt.toLowerCase().includes('performance') || prompt.toLowerCase().includes('metric')) {
      return "To analyze performance metrics effectively, focus on key performance indicators (KPIs) relevant to your business goals. Track trends over time and compare against industry benchmarks.";
    }
    return "For data analysis, I recommend examining trends, patterns, and anomalies in your dataset. Consider using statistical methods and visualization tools to gain insights.";
  };

  const generatePredictionFallback = (prompt: string): string => {
    return "Based on historical patterns and general forecasting principles, I recommend using moving averages and trend analysis. Consider seasonal factors and external market conditions that may impact future outcomes.";
  };

  const generateAutomationFallback = (prompt: string): string => {
    return "For automation workflows, I suggest breaking down the process into clear steps, identifying decision points, and implementing error handling. Start with simple automations and gradually increase complexity.";
  };

  const generateChatFallback = (prompt: string): string => {
    return "I'm currently experiencing technical difficulties with my AI systems. For immediate assistance, please check our help documentation or contact our support team.";
  };

  const getRequestHistory = useCallback(async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('ai_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching request history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch request history",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const getProviderStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_requests')
        .select('provider, status, fallback_used, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = data.reduce((acc, request) => {
        const provider = request.provider;
        if (!acc[provider]) {
          acc[provider] = { total: 0, success: 0, failed: 0, fallback: 0 };
        }
        acc[provider].total++;
        if (request.status === 'completed') acc[provider].success++;
        if (request.status === 'failed') acc[provider].failed++;
        if (request.fallback_used) acc[provider].fallback++;
        return acc;
      }, {} as Record<string, any>);

      return stats;
    } catch (error) {
      console.error('Error fetching provider stats:', error);
      return {};
    }
  }, []);

  return {
    makeAIRequest,
    getRequestHistory,
    getProviderStats,
    isProcessing,
    currentRequest
  };
};