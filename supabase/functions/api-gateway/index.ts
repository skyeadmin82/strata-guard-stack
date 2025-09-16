import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface RateLimitState {
  [key: string]: {
    requests: number;
    windowStart: number;
  };
}

const rateLimitCache: RateLimitState = {};

async function validateRequest(req: Request, endpoint: any): Promise<{ valid: boolean; error?: string; userId?: string }> {
  // Extract auth token
  const authHeader = req.headers.get('authorization');
  const apiKeyHeader = req.headers.get('x-api-key');
  
  let userId: string | undefined;
  
  // Check authentication requirements
  if (endpoint.auth_required) {
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' };
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { valid: false, error: 'Invalid authentication token' };
    }
    
    userId = user.id;
    
    // Check user role if required
    if (endpoint.allowed_roles && endpoint.allowed_roles.length > 0) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();
        
      if (!userProfile || !endpoint.allowed_roles.includes(userProfile.role)) {
        return { valid: false, error: 'Insufficient permissions' };
      }
    }
  }
  
  // Check API key requirements
  if (endpoint.api_key_required && !apiKeyHeader) {
    return { valid: false, error: 'API key required' };
  }
  
  if (apiKeyHeader) {
    const { data: apiKey } = await supabase
      .from('api_access_tokens')
      .select('*')
      .eq('token_hash', apiKeyHeader)
      .eq('is_active', true)
      .single();
      
    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }
    
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return { valid: false, error: 'API key expired' };
    }
  }
  
  return { valid: true, userId };
}

async function checkRateLimit(clientId: string, endpoint: any): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowSize = 60000; // 1 minute
  
  // Initialize or reset rate limit state
  if (!rateLimitCache[clientId] || now - rateLimitCache[clientId].windowStart > windowSize) {
    rateLimitCache[clientId] = {
      requests: 0,
      windowStart: now
    };
  }
  
  const state = rateLimitCache[clientId];
  const limit = endpoint.rate_limit_per_minute || 60;
  
  if (state.requests >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  state.requests++;
  return { allowed: true, remaining: limit - state.requests };
}

async function validateRequestBody(body: any, schema: any): Promise<{ valid: boolean; errors?: string[] }> {
  if (!schema || Object.keys(schema).length === 0) {
    return { valid: true };
  }
  
  const errors: string[] = [];
  
  // Basic schema validation (extend as needed)
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in body)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  if (schema.properties) {
    for (const [field, rules] of Object.entries(schema.properties as any)) {
      if (field in body) {
        const value = body[field];
        const fieldRules = rules as any;
        
        if (fieldRules.type && typeof value !== fieldRules.type) {
          errors.push(`Field ${field} must be of type ${fieldRules.type}`);
        }
        
        if (fieldRules.minLength && typeof value === 'string' && value.length < fieldRules.minLength) {
          errors.push(`Field ${field} must be at least ${fieldRules.minLength} characters`);
        }
        
        if (fieldRules.maxLength && typeof value === 'string' && value.length > fieldRules.maxLength) {
          errors.push(`Field ${field} must be at most ${fieldRules.maxLength} characters`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

async function logRequest(req: Request, endpoint: any, response: Response, userId?: string, duration?: number) {
  try {
    const body = req.method !== 'GET' ? await req.clone().json().catch(() => null) : null;
    
    await supabase.from('api_request_logs').insert({
      tenant_id: endpoint.tenant_id,
      endpoint_id: endpoint.id,
      method: req.method,
      path: new URL(req.url).pathname,
      query_params: Object.fromEntries(new URL(req.url).searchParams),
      headers: Object.fromEntries(req.headers.entries()),
      body,
      status_code: response.status,
      response_timestamp: new Date().toISOString(),
      duration_ms: duration,
      client_ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
      user_id: userId,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    console.log(`API Gateway: ${method} ${path}`);
    
    // Find matching endpoint
    const { data: endpoint, error: endpointError } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('path', path)
      .eq('method', method)
      .eq('is_active', true)
      .single();
    
    if (endpointError || !endpoint) {
      const response = new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
      return response;
    }
    
    // Check if endpoint is deprecated
    if (endpoint.deprecated) {
      const response = new Response(
        JSON.stringify({ 
          error: 'Endpoint deprecated',
          replacement: endpoint.replacement_endpoint,
          deprecation_date: endpoint.deprecation_date
        }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
      await logRequest(req, endpoint, response, undefined, Date.now() - startTime);
      return response;
    }
    
    // Validate request
    const validation = await validateRequest(req, endpoint);
    if (!validation.valid) {
      const response = new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
      await logRequest(req, endpoint, response, validation.userId, Date.now() - startTime);
      return response;
    }
    
    // Check rate limits
    const clientId = validation.userId || req.headers.get('cf-connecting-ip') || 'anonymous';
    const rateLimit = await checkRateLimit(clientId, endpoint);
    
    if (!rateLimit.allowed) {
      const response = new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': endpoint.rate_limit_per_minute.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + 60).toString()
          } 
        }
      );
      await logRequest(req, endpoint, response, validation.userId, Date.now() - startTime);
      return response;
    }
    
    // Validate request body if needed
    if (req.method !== 'GET' && endpoint.validation_enabled) {
      const body = await req.json().catch(() => ({}));
      const bodyValidation = await validateRequestBody(body, endpoint.request_schema);
      
      if (!bodyValidation.valid) {
        const response = new Response(
          JSON.stringify({ error: 'Validation failed', details: bodyValidation.errors }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
        await logRequest(req, endpoint, response, validation.userId, Date.now() - startTime);
        return response;
      }
    }
    
    // Proxy request to actual implementation
    // For now, return success - in real implementation, you'd route to specific handlers
    const response = new Response(
      JSON.stringify({ 
        message: 'API Gateway - Request processed successfully',
        endpoint: endpoint.path,
        method: endpoint.method,
        version: endpoint.version,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString()
        } 
      }
    );
    
    await logRequest(req, endpoint, response, validation.userId, Date.now() - startTime);
    return response;
    
  } catch (error) {
    console.error('API Gateway Error:', error);
    const response = new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    return response;
  }
});