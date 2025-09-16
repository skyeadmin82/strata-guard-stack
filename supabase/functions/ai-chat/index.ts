import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, provider = 'openai', model, requestId, requestType = 'chat' } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const startTime = Date.now();
    let response, tokens_used = 0, cost = 0, confidence_score = 0.8;

    // Try primary AI provider
    try {
      if (provider === 'openai') {
        const result = await callOpenAI(prompt, model, requestType);
        response = result.response;
        tokens_used = result.tokens_used;
        cost = result.cost;
        confidence_score = result.confidence_score || 0.8;
      } else if (provider === 'claude') {
        const result = await callClaude(prompt, model, requestType);
        response = result.response;
        tokens_used = result.tokens_used;
        cost = result.cost;
        confidence_score = result.confidence_score || 0.8;
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (aiError) {
      console.error(`${provider} API failed:`, aiError);
      
      // Try fallback provider
      try {
        if (provider === 'openai') {
          console.log('Trying Claude as fallback...');
          const result = await callClaude(prompt, model, requestType);
          response = result.response;
          tokens_used = result.tokens_used;
          cost = result.cost;
          confidence_score = 0.7; // Lower confidence for fallback
          
          // Update request to indicate fallback was used
          if (requestId) {
            await updateRequestFallback(requestId, 'claude', 'OpenAI failed');
          }
        } else {
          console.log('Trying OpenAI as fallback...');
          const result = await callOpenAI(prompt, model, requestType);
          response = result.response;
          tokens_used = result.tokens_used;
          cost = result.cost;
          confidence_score = 0.7;
          
          if (requestId) {
            await updateRequestFallback(requestId, 'openai', 'Claude failed');
          }
        }
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError);
        throw new Error('All AI providers failed');
      }
    }

    const latency = Date.now() - startTime;

    // Log performance metrics if requestId provided
    if (requestId) {
      await logPerformanceMetrics(requestId, {
        latency_ms: latency,
        tokens_used,
        cost,
        confidence_score
      });
    }

    return new Response(
      JSON.stringify({
        response,
        tokens_used,
        cost,
        confidence_score,
        latency_ms: latency,
        provider_used: provider
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI chat error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallback_available: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function callOpenAI(prompt: string, model?: string, requestType?: string) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Select model based on request type and user preference
  const selectedModel = model || getDefaultOpenAIModel(requestType);
  
  const systemPrompt = getSystemPrompt(requestType);

  const requestBody: any = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  };

  // Handle different model parameter requirements
  if (selectedModel.startsWith('gpt-5') || selectedModel.startsWith('o3') || selectedModel.startsWith('o4')) {
    // Newer models use max_completion_tokens and don't support temperature
    requestBody.max_completion_tokens = 2000;
  } else {
    // Legacy models use max_tokens and support temperature
    requestBody.max_tokens = 2000;
    requestBody.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const tokens = data.usage?.total_tokens || 0;
  
  // Estimate cost based on model and tokens
  const cost = estimateOpenAICost(selectedModel, tokens);
  
  // Calculate confidence based on model and response quality
  const confidence = calculateConfidenceScore(content, selectedModel);

  return {
    response: content,
    tokens_used: tokens,
    cost,
    confidence_score: confidence
  };
}

async function callClaude(prompt: string, model?: string, requestType?: string) {
  const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const selectedModel = model || 'claude-3-sonnet-20240229';
  const systemPrompt = getSystemPrompt(requestType);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLAUDE_API_KEY}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  const tokens = data.usage?.input_tokens + data.usage?.output_tokens || 0;
  
  const cost = estimateClaudeCost(selectedModel, tokens);
  const confidence = calculateConfidenceScore(content, selectedModel);

  return {
    response: content,
    tokens_used: tokens,
    cost,
    confidence_score: confidence
  };
}

function getDefaultOpenAIModel(requestType?: string): string {
  switch (requestType) {
    case 'analysis':
      return 'gpt-5-2025-08-07'; // Best for complex analysis
    case 'prediction':
      return 'o3-2025-04-16'; // Best for reasoning and predictions
    case 'automation':
      return 'gpt-5-mini-2025-08-07'; // Fast and efficient for automation
    case 'chat':
    default:
      return 'gpt-5-mini-2025-08-07'; // Default fast model
  }
}

function getSystemPrompt(requestType?: string): string {
  switch (requestType) {
    case 'analysis':
      return 'You are an expert data analyst. Provide detailed, accurate analysis with actionable insights. Focus on trends, patterns, and recommendations based on the data provided.';
    case 'prediction':
      return 'You are a predictive analytics expert. Analyze patterns and provide forecasts with confidence intervals. Explain your reasoning and highlight key factors that influence predictions.';
    case 'automation':
      return 'You are an automation specialist. Provide clear, step-by-step instructions for automating processes. Focus on efficiency, error handling, and best practices.';
    case 'chat':
    default:
      return 'You are a helpful AI assistant focused on business intelligence and automation. Provide clear, concise, and actionable responses.';
  }
}

function estimateOpenAICost(model: string, tokens: number): number {
  // Pricing estimates per 1K tokens (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-5-2025-08-07': { input: 0.01, output: 0.03 },
    'gpt-5-mini-2025-08-07': { input: 0.0001, output: 0.0004 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
  };

  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
  // Assume roughly equal input/output split
  return (tokens / 1000) * (modelPricing.input + modelPricing.output) / 2;
}

function estimateClaudeCost(model: string, tokens: number): number {
  // Claude pricing estimates per 1K tokens
  const pricing: Record<string, number> = {
    'claude-3-opus-20240229': 0.015,
    'claude-3-sonnet-20240229': 0.003,
    'claude-3-haiku-20240307': 0.00025
  };

  const rate = pricing[model] || pricing['claude-3-sonnet-20240229'];
  return (tokens / 1000) * rate;
}

function calculateConfidenceScore(response: string, model: string): number {
  let baseConfidence = 0.8;

  // Adjust based on model capability
  if (model.startsWith('gpt-5') || model.includes('opus')) {
    baseConfidence = 0.9;
  } else if (model.includes('mini') || model.includes('haiku')) {
    baseConfidence = 0.7;
  }

  // Adjust based on response quality indicators
  if (response.length < 50) {
    baseConfidence *= 0.8; // Very short responses may be less reliable
  }

  if (response.includes('I don\'t know') || response.includes('uncertain')) {
    baseConfidence *= 0.6; // Model expressing uncertainty
  }

  if (response.includes('based on the data') || response.includes('analysis shows')) {
    baseConfidence *= 1.1; // Evidence-based responses
  }

  return Math.min(Math.max(baseConfidence, 0.1), 1.0);
}

async function updateRequestFallback(requestId: string, fallbackProvider: string, reason: string) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('ai_requests')
      .update({
        provider: fallbackProvider,
        fallback_used: true,
        fallback_reason: reason
      })
      .eq('id', requestId);
  } catch (error) {
    console.error('Failed to update request fallback status:', error);
  }
}

async function logPerformanceMetrics(requestId: string, metrics: any) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('ai_requests')
      .update(metrics)
      .eq('id', requestId);
  } catch (error) {
    console.error('Failed to log performance metrics:', error);
  }
}