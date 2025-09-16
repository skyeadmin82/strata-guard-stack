import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { createHmac } from "node:crypto";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// QuickBooks OAuth configuration
const QB_CLIENT_ID = Deno.env.get('QUICKBOOKS_CLIENT_ID');
const QB_CLIENT_SECRET = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
const QB_REDIRECT_URI = Deno.env.get('QUICKBOOKS_REDIRECT_URI');
const QB_DISCOVERY_DOCUMENT = 'https://appcenter.intuit.com/.well-known/op/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface QuickBooksTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
  scope: string;
}

async function exchangeCodeForTokens(code: string, state: string): Promise<QuickBooksTokens> {
  const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: QB_REDIRECT_URI!,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

async function refreshAccessToken(refreshToken: string): Promise<QuickBooksTokens> {
  const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

async function makeQuickBooksRequest(endpoint: string, accessToken: string, companyId: string, method = 'GET', body?: any) {
  const baseUrl = 'https://sandbox-quickbooks.api.intuit.com';
  const url = `${baseUrl}/v3/company/${companyId}/${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
  };
  
  if (method !== 'GET' && body) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks API error: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

async function syncCustomers(connectionId: string) {
  console.log(`Starting customer sync for connection: ${connectionId}`);
  
  // Get connection details
  const { data: connection } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('id', connectionId)
    .single();
    
  if (!connection) {
    throw new Error('Connection not found');
  }
  
  const credentials = connection.credentials as any;
  const companyId = credentials.company_id;
  let accessToken = credentials.access_token;
  
  try {
    // Get customers from QuickBooks
    const qbResponse = await makeQuickBooksRequest('customers', accessToken, companyId);
    const customers = qbResponse.QueryResponse?.Customer || [];
    
    console.log(`Found ${customers.length} customers in QuickBooks`);
    
    // Sync to local database
    for (const qbCustomer of customers) {
      try {
        // Check if customer already exists
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('tenant_id', connection.tenant_id)
          .eq('external_id', qbCustomer.Id)
          .single();
        
        const clientData = {
          tenant_id: connection.tenant_id,
          name: qbCustomer.Name,
          email: qbCustomer.PrimaryEmailAddr?.Address,
          phone: qbCustomer.PrimaryPhone?.FreeFormNumber,
          external_id: qbCustomer.Id,
          external_data: qbCustomer,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        };
        
        if (existingClient) {
          // Update existing client
          await supabase
            .from('clients')
            .update(clientData)
            .eq('id', existingClient.id);
        } else {
          // Create new client
          await supabase
            .from('clients')
            .insert(clientData);
        }
      } catch (error) {
        console.error(`Error syncing customer ${qbCustomer.Id}:`, error);
      }
    }
    
    return { success: true, synced: customers.length };
    
  } catch (error) {
    // If token expired, try to refresh
    if (error.message.includes('401')) {
      try {
        const newTokens = await refreshAccessToken(credentials.refresh_token);
        
        // Update connection with new tokens
        await supabase
          .from('integration_connections')
          .update({
            credentials: {
              ...credentials,
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
            },
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          })
          .eq('id', connectionId);
        
        // Retry sync with new token
        return await syncCustomers(connectionId);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        throw refreshError;
      }
    }
    throw error;
  }
}

async function performHealthCheck(connectionId: string) {
  try {
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
      
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    const credentials = connection.credentials as any;
    const companyId = credentials.company_id;
    const accessToken = credentials.access_token;
    
    // Make a simple API call to check connection health
    await makeQuickBooksRequest('companyinfo', accessToken, companyId);
    
    // Update connection status
    await supabase
      .from('integration_connections')
      .update({
        connection_status: 'healthy',
        last_health_check: new Date().toISOString(),
        consecutive_failures: 0,
        health_check_errors: [],
      })
      .eq('id', connectionId);
    
    return { healthy: true };
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Update connection status
    await supabase
      .from('integration_connections')
      .update({
        connection_status: 'unhealthy',
        last_health_check: new Date().toISOString(),
        consecutive_failures: (connection?.consecutive_failures || 0) + 1,
        health_check_errors: [{ 
          timestamp: new Date().toISOString(), 
          error: error.message 
        }],
      })
      .eq('id', connectionId);
    
    return { healthy: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    console.log(`QuickBooks Integration: ${method} ${path}`);
    
    // OAuth callback handler
    if (path === '/oauth/callback' && method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const companyId = url.searchParams.get('realmId');
      
      if (!code || !state || !companyId) {
        return new Response(
          JSON.stringify({ error: 'Missing required OAuth parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      try {
        const tokens = await exchangeCodeForTokens(code, state);
        
        // Update the connection with the tokens
        const { error } = await supabase
          .from('integration_connections')
          .update({
            auth_status: 'connected',
            credentials: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              company_id: companyId,
            },
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            connection_status: 'healthy',
          })
          .eq('oauth_state', state);
        
        if (error) {
          throw error;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'QuickBooks connection established successfully' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to complete OAuth flow' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Sync endpoint
    if (path === '/sync' && method === 'POST') {
      const { connectionId, syncType = 'customers' } = await req.json();
      
      if (!connectionId) {
        return new Response(
          JSON.stringify({ error: 'Connection ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      try {
        let result;
        
        switch (syncType) {
          case 'customers':
            result = await syncCustomers(connectionId);
            break;
          default:
            throw new Error(`Unsupported sync type: ${syncType}`);
        }
        
        return new Response(
          JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (error) {
        console.error('Sync error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Health check endpoint
    if (path === '/health' && method === 'POST') {
      const { connectionId } = await req.json();
      
      if (!connectionId) {
        return new Response(
          JSON.stringify({ error: 'Connection ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      try {
        const result = await performHealthCheck(connectionId);
        
        return new Response(
          JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (error) {
        console.error('Health check error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('QuickBooks Integration Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});