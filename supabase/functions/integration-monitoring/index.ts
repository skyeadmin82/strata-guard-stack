import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function performHealthChecks() {
  console.log('Starting health checks for all connections');
  
  // Get all active connections
  const { data: connections, error } = await supabase
    .from('integration_connections')
    .select(`
      *,
      integration_providers (
        provider_type,
        name
      )
    `)
    .eq('auth_status', 'connected')
    .eq('sync_enabled', true);
  
  if (error) {
    console.error('Failed to fetch connections:', error);
    return { error: error.message };
  }
  
  const results = [];
  
  for (const connection of connections || []) {
    try {
      console.log(`Health check for ${connection.name} (${connection.integration_providers?.provider_type})`);
      
      let healthResult;
      
      // Perform provider-specific health check
      switch (connection.integration_providers?.provider_type) {
        case 'quickbooks':
          healthResult = await performQuickBooksHealthCheck(connection);
          break;
        default:
          healthResult = await performGenericHealthCheck(connection);
          break;
      }
      
      results.push({
        connection_id: connection.id,
        connection_name: connection.name,
        provider_type: connection.integration_providers?.provider_type,
        ...healthResult
      });
      
    } catch (error) {
      console.error(`Health check failed for connection ${connection.id}:`, error);
      results.push({
        connection_id: connection.id,
        connection_name: connection.name,
        provider_type: connection.integration_providers?.provider_type,
        healthy: false,
        error: error.message
      });
    }
  }
  
  return { results, total: connections?.length || 0 };
}

async function performQuickBooksHealthCheck(connection: any) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/quickbooks-integration/health`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ connectionId: connection.id }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Health check failed');
    }
    
    return result;
  } catch (error) {
    console.error(`QuickBooks health check failed for ${connection.id}:`, error);
    return { healthy: false, error: error.message };
  }
}

async function performGenericHealthCheck(connection: any) {
  // For generic connections, just check if credentials exist and haven't expired
  const credentials = connection.credentials as any;
  
  if (!credentials || Object.keys(credentials).length === 0) {
    return { healthy: false, error: 'No credentials configured' };
  }
  
  // Check token expiration if applicable
  if (connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      return { healthy: false, error: 'Access token expired' };
    }
  }
  
  return { healthy: true };
}

async function monitorSyncJobs() {
  console.log('Monitoring sync jobs');
  
  // Check for stuck jobs (running for more than 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data: stuckJobs } = await supabase
    .from('integration_sync_jobs')
    .select('*')
    .eq('status', 'running')
    .lt('started_at', oneHourAgo);
  
  // Mark stuck jobs as failed
  if (stuckJobs && stuckJobs.length > 0) {
    console.log(`Found ${stuckJobs.length} stuck sync jobs`);
    
    for (const job of stuckJobs) {
      await supabase
        .from('integration_sync_jobs')
        .update({
          status: 'failed',
          error_details: [{
            timestamp: new Date().toISOString(),
            error: 'Job timeout - marked as failed by monitoring system'
          }],
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
      
      // Create alert
      await supabase.from('integration_alerts').insert({
        tenant_id: job.tenant_id,
        connection_id: job.connection_id,
        alert_type: 'sync_timeout',
        severity: 'warning',
        title: 'Sync Job Timeout',
        message: `Sync job ${job.id} has been running for over 1 hour and was marked as failed`,
        context_data: {
          job_id: job.id,
          job_type: job.job_type,
          started_at: job.started_at,
        },
        created_at: new Date().toISOString(),
      });
    }
  }
  
  // Check for failed jobs that should be retried
  const { data: failedJobs } = await supabase
    .from('integration_sync_jobs')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 'max_retries')
    .lt('next_retry_at', new Date().toISOString());
  
  if (failedJobs && failedJobs.length > 0) {
    console.log(`Found ${failedJobs.length} jobs to retry`);
    
    for (const job of failedJobs) {
      await supabase
        .from('integration_sync_jobs')
        .update({
          status: 'retry',
          retry_count: job.retry_count + 1,
          next_retry_at: new Date(Date.now() + Math.pow(2, job.retry_count) * 60000).toISOString(), // Exponential backoff
        })
        .eq('id', job.id);
    }
  }
  
  return {
    stuck_jobs_processed: stuckJobs?.length || 0,
    jobs_queued_for_retry: failedJobs?.length || 0
  };
}

async function checkApiEndpointsHealth() {
  console.log('Checking API endpoints health');
  
  // Get API endpoints with high error rates in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data: errorStats } = await supabase
    .from('api_request_logs')
    .select('endpoint_id, status_code')
    .gte('request_timestamp', oneHourAgo);
  
  if (!errorStats || errorStats.length === 0) {
    return { healthy_endpoints: 0, unhealthy_endpoints: 0 };
  }
  
  // Group by endpoint and calculate error rates
  const endpointStats: Record<string, { total: number; errors: number }> = {};
  
  for (const log of errorStats) {
    if (!endpointStats[log.endpoint_id]) {
      endpointStats[log.endpoint_id] = { total: 0, errors: 0 };
    }
    
    endpointStats[log.endpoint_id].total++;
    
    if (log.status_code >= 400) {
      endpointStats[log.endpoint_id].errors++;
    }
  }
  
  let healthyEndpoints = 0;
  let unhealthyEndpoints = 0;
  
  // Check each endpoint's error rate
  for (const [endpointId, stats] of Object.entries(endpointStats)) {
    const errorRate = stats.errors / stats.total;
    
    if (errorRate > 0.1) { // More than 10% error rate
      unhealthyEndpoints++;
      
      // Get endpoint details
      const { data: endpoint } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('id', endpointId)
        .single();
      
      if (endpoint) {
        // Create alert
        await supabase.from('integration_alerts').insert({
          tenant_id: endpoint.tenant_id,
          alert_type: 'high_error_rate',
          severity: 'warning',
          title: 'High API Error Rate',
          message: `API endpoint ${endpoint.path} has a high error rate (${(errorRate * 100).toFixed(1)}%)`,
          context_data: {
            endpoint_id: endpointId,
            path: endpoint.path,
            method: endpoint.method,
            error_rate: errorRate,
            total_requests: stats.total,
            failed_requests: stats.errors,
          },
          created_at: new Date().toISOString(),
        });
      }
    } else {
      healthyEndpoints++;
    }
  }
  
  return { healthy_endpoints: healthyEndpoints, unhealthy_endpoints: unhealthyEndpoints };
}

async function generateMonitoringReport() {
  const [healthResults, syncResults, apiResults] = await Promise.all([
    performHealthChecks(),
    monitorSyncJobs(),
    checkApiEndpointsHealth(),
  ]);
  
  return {
    timestamp: new Date().toISOString(),
    health_checks: healthResults,
    sync_monitoring: syncResults,
    api_monitoring: apiResults,
    summary: {
      total_connections: healthResults.results?.length || 0,
      healthy_connections: healthResults.results?.filter((r: any) => r.healthy).length || 0,
      unhealthy_connections: healthResults.results?.filter((r: any) => !r.healthy).length || 0,
      stuck_jobs_processed: syncResults.stuck_jobs_processed,
      jobs_retried: syncResults.jobs_queued_for_retry,
      healthy_api_endpoints: apiResults.healthy_endpoints,
      unhealthy_api_endpoints: apiResults.unhealthy_endpoints,
    }
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    console.log(`Integration Monitoring: ${method} ${path}`);
    
    // Health check all connections
    if (path === '/health-checks' && method === 'POST') {
      const result = await performHealthChecks();
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Monitor sync jobs
    if (path === '/sync-monitoring' && method === 'POST') {
      const result = await monitorSyncJobs();
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate full monitoring report
    if (path === '/report' && method === 'GET') {
      const report = await generateMonitoringReport();
      
      return new Response(
        JSON.stringify(report),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Default health endpoint
    if (path === '/' && method === 'GET') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          service: 'integration-monitoring',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Integration Monitoring Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});