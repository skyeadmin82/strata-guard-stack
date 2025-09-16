import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface MonitorCheckRequest {
  tenantId: string;
  monitorType?: 'ai_failure_rate' | 'workflow_failures' | 'data_quality' | 'performance' | 'all';
  timeWindow?: number; // minutes
}

interface MonitorResult {
  monitorType: string;
  passed: boolean;
  message: string;
  alertLevel: 'info' | 'warning' | 'critical';
  metrics?: Record<string, any>;
  error?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json() as MonitorCheckRequest;
    
    if (!body.tenantId) {
      throw new Error('Tenant ID is required');
    }

    const results: MonitorResult[] = [];
    
    // Run AI failure rate check
    if (!body.monitorType || body.monitorType === 'all' || body.monitorType === 'ai_failure_rate') {
      const aiResult = await checkAIFailureRate(supabase, body.tenantId, body.timeWindow || 60);
      results.push(aiResult);
    }

    // Run workflow failure check  
    if (!body.monitorType || body.monitorType === 'all' || body.monitorType === 'workflow_failures') {
      const workflowResult = await checkWorkflowFailures(supabase, body.tenantId, body.timeWindow || 60);
      results.push(workflowResult);
    }

    // Run data quality check
    if (!body.monitorType || body.monitorType === 'all' || body.monitorType === 'data_quality') {
      const dataQualityResult = await checkDataQuality(supabase, body.tenantId);
      results.push(dataQualityResult);
    }

    // Run performance check
    if (!body.monitorType || body.monitorType === 'all' || body.monitorType === 'performance') {
      const performanceResult = await checkPerformance(supabase, body.tenantId);
      results.push(performanceResult);
    }

    // Log the monitoring results
    for (const result of results) {
      await supabase
        .from('monitoring_errors')
        .insert({
          tenant_id: body.tenantId,
          error_type: 'monitoring_check',
          error_message: result.message,
          error_stack: JSON.stringify(result.metrics),
          context: {
            monitor_type: result.monitorType,
            alert_level: result.alertLevel,
            passed: result.passed
          },
          severity: result.alertLevel === 'critical' ? 'critical' : result.alertLevel === 'warning' ? 'warning' : 'info'
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          totalChecks: results.length,
          passed: results.filter(r => r.passed).length,
          warnings: results.filter(r => r.alertLevel === 'warning').length,
          critical: results.filter(r => r.alertLevel === 'critical').length
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('System monitoring error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function checkAIFailureRate(supabase: any, tenantId: string, timeWindowMinutes: number): Promise<MonitorResult> {
  try {
    const { data: requests } = await supabase
      .from('ai_requests')
      .select('status')
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString());

    if (!requests || requests.length === 0) {
      return {
        monitorType: 'ai_failure_rate',
        passed: true,
        message: 'No AI requests in time window',
        alertLevel: 'info',
        metrics: { totalRequests: 0, failureRate: 0 }
      };
    }

    const failedRequests = requests.filter((r: any) => r.status === 'failed').length;
    const failureRate = failedRequests / requests.length;
    const threshold = 0.1; // 10% failure rate threshold

    return {
      monitorType: 'ai_failure_rate',
      passed: failureRate < threshold,
      message: `AI failure rate: ${Math.round(failureRate * 100)}% (${failedRequests}/${requests.length})`,
      alertLevel: failureRate >= 0.2 ? 'critical' : failureRate >= threshold ? 'warning' : 'info',
      metrics: { failureRate, totalRequests: requests.length, failedRequests }
    };
  } catch (error) {
    return {
      monitorType: 'ai_failure_rate',
      passed: false,
      message: `AI check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      alertLevel: 'critical',
      error: true
    };
  }
}

async function checkWorkflowFailures(supabase: any, tenantId: string, timeWindowMinutes: number): Promise<MonitorResult> {
  try {
    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('execution_status')
      .eq('tenant_id', tenantId)
      .eq('execution_status', 'failed')
      .gte('started_at', new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString());

    const failureCount = executions?.length || 0;
    const threshold = 5; // 5 failures threshold

    return {
      monitorType: 'workflow_failures',
      passed: failureCount < threshold,
      message: `${failureCount} workflow failures in ${timeWindowMinutes} minutes`,
      alertLevel: failureCount >= 10 ? 'critical' : failureCount >= threshold ? 'warning' : 'info',
      metrics: { failureCount, threshold, timeWindowMinutes }
    };
  } catch (error) {
    return {
      monitorType: 'workflow_failures', 
      passed: false,
      message: `Workflow check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      alertLevel: 'critical',
      error: true
    };
  }
}

async function checkDataQuality(supabase: any, tenantId: string): Promise<MonitorResult> {
  try {
    const { data: metrics } = await supabase
      .from('data_quality_metrics')
      .select('metric_value')
      .eq('tenant_id', tenantId)
      .gte('checked_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('checked_at', { ascending: false })
      .limit(10);

    if (!metrics || metrics.length === 0) {
      return {
        monitorType: 'data_quality',
        passed: true,
        message: 'No recent data quality metrics available',
        alertLevel: 'info',
        metrics: { sampleCount: 0 }
      };
    }

    const avgQuality = metrics.reduce((sum: number, m: any) => sum + (m.metric_value || 0), 0) / metrics.length;
    const threshold = 0.9; // 90% quality threshold

    return {
      monitorType: 'data_quality',
      passed: avgQuality >= threshold,
      message: `Average data quality: ${Math.round(avgQuality * 100)}%`,
      alertLevel: avgQuality < 0.7 ? 'critical' : avgQuality < threshold ? 'warning' : 'info',
      metrics: { avgQuality, threshold, sampleCount: metrics.length }
    };
  } catch (error) {
    return {
      monitorType: 'data_quality',
      passed: false,
      message: `Data quality check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      alertLevel: 'critical',
      error: true
    };
  }
}

async function checkPerformance(supabase: any, tenantId: string): Promise<MonitorResult> {
  try {
    const { data: recentRequests } = await supabase
      .from('ai_requests')
      .select('latency_ms')
      .eq('tenant_id', tenantId)
      .not('latency_ms', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 minutes
      .limit(50);

    if (!recentRequests || recentRequests.length === 0) {
      return {
        monitorType: 'performance',
        passed: true,
        message: 'No recent performance data available',
        alertLevel: 'info',
        metrics: { sampleCount: 0 }
      };
    }

    const avgLatency = recentRequests.reduce((sum: number, r: any) => sum + (r.latency_ms || 0), 0) / recentRequests.length;
    const threshold = 5000; // 5 seconds

    return {
      monitorType: 'performance',
      passed: avgLatency < threshold,
      message: `Average response time: ${Math.round(avgLatency)}ms`,
      alertLevel: avgLatency >= 10000 ? 'critical' : avgLatency >= threshold ? 'warning' : 'info',
      metrics: { avgLatency, threshold, sampleCount: recentRequests.length }
    };
  } catch (error) {
    return {
      monitorType: 'performance',
      passed: false,
      message: `Performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      alertLevel: 'critical',
      error: true
    };
  }
}