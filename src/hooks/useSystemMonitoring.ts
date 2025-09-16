import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';
import type { Database } from '@/integrations/supabase/types';

type SystemMonitor = Database['public']['Tables']['system_monitors']['Row'];
type MonitorAlert = Database['public']['Tables']['monitor_alerts']['Row'];

interface MonitoringDashboard {
  systemHealth: {
    overall: 'healthy' | 'warning' | 'critical';
    aiServices: 'healthy' | 'warning' | 'critical';
    workflows: 'healthy' | 'warning' | 'critical';
    dataQuality: 'healthy' | 'warning' | 'critical';
  };
  activeAlerts: MonitorAlert[];
  recentMetrics: any[];
  performanceStats: any;
}

export const useSystemMonitoring = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);

  const createMonitor = useCallback(async (monitorConfig: Partial<SystemMonitor>) => {
    if (!tenantId) {
      throw new Error('Tenant not loaded');
    }

    try {
      const { data, error } = await supabase
        .from('system_monitors')
        .insert({
          tenant_id: tenantId,
          name: monitorConfig.name || 'Untitled Monitor',
          description: monitorConfig.description,
          monitor_type: monitorConfig.monitor_type || 'performance',
          check_config: monitorConfig.check_config || {},
          alert_config: monitorConfig.alert_config || {},
          check_interval_minutes: monitorConfig.check_interval_minutes || 5,
          is_critical: monitorConfig.is_critical || false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Monitor Created",
        description: `Monitor "${data.name}" has been created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating monitor:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create monitor",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, tenantId]);

  const runSystemCheck = useCallback(async () => {
    if (!tenantId) {
      throw new Error('Tenant not loaded');
    }

    setIsMonitoring(true);
    
    try {
      // Call the edge function for comprehensive monitoring
      const { data: checkData, error: checkError } = await supabase.functions.invoke('system-monitoring', {
        body: { 
          tenantId,
          monitorType: 'all'
        }
      });

      if (checkError) throw checkError;

      const results = checkData?.results || [];

      // Get all active monitors to update their status
      const { data: monitors } = await supabase
        .from('system_monitors')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      // Update monitor statuses and create alerts
      for (const monitor of monitors || []) {
        const relevantResult = results.find((r: any) => r.monitorType === monitor.monitor_type);
        
        if (relevantResult) {
          // Update monitor status
          await supabase
            .from('system_monitors')
            .update({
              last_checked_at: new Date().toISOString(),
              status: relevantResult.passed ? 'active' : 'alerting'
            })
            .eq('id', monitor.id);

          // Create alert if check failed
          if (!relevantResult.passed && relevantResult.alertLevel !== 'info') {
            await createAlert(monitor, relevantResult);
          }
        }
      }

      // Generate dashboard data
      const dashboardData = await generateDashboard(results);
      setDashboard(dashboardData);

      toast({
        title: "System Check Complete",
        description: `Ran ${results.length} checks. ${results.filter((r: any) => !r.passed).length} issues found.`,
      });

      return { success: true, results };

    } catch (error) {
      console.error('System check error:', error);
      toast({
        title: "System Check Failed",
        description: error instanceof Error ? error.message : "Failed to run system check",
        variant: "destructive",
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsMonitoring(false);
    }
  }, [toast, tenantId]);

  const runMonitorCheck = async (monitor: SystemMonitor) => {
    const checkConfig = monitor.check_config as any;
    
    try {
      switch (monitor.monitor_type) {
        case 'ai_failure_rate':
          return await checkAIFailureRate(checkConfig);
        case 'workflow_failures':
          return await checkWorkflowFailures(checkConfig);
        case 'data_quality':
          return await checkDataQuality(checkConfig);
        case 'performance':
          return await checkPerformance(checkConfig);
        default:
          return { passed: true, message: 'Unknown monitor type', alertLevel: 'info' };
      }
    } catch (error) {
      return {
        passed: false,
        message: error instanceof Error ? error.message : 'Check failed',
        alertLevel: 'error' as const,
        error: true
      };
    }
  };

  const checkAIFailureRate = async (config: any) => {
    const timeWindow = config.time_window_minutes || 60;
    const threshold = config.failure_rate_threshold || 0.1;

    const { data: requests } = await supabase
      .from('ai_requests')
      .select('status')
      .gte('created_at', new Date(Date.now() - timeWindow * 60 * 1000).toISOString());

    if (!requests || requests.length === 0) {
      return { passed: true, message: 'No AI requests in time window', alertLevel: 'info' };
    }

    const failureRate = requests.filter(r => r.status === 'failed').length / requests.length;
    const passed = failureRate < threshold;

    return {
      passed,
      message: `AI failure rate: ${Math.round(failureRate * 100)}%`,
      alertLevel: passed ? 'info' : (failureRate > threshold * 2 ? 'critical' : 'warning'),
      metrics: { failureRate, totalRequests: requests.length }
    };
  };

  const checkWorkflowFailures = async (config: any) => {
    const timeWindow = config.time_window_minutes || 60;
    const threshold = config.failure_threshold || 5;

    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('execution_status')
      .eq('execution_status', 'failed')
      .gte('started_at', new Date(Date.now() - timeWindow * 60 * 1000).toISOString());

    const failureCount = executions?.length || 0;
    const passed = failureCount < threshold;

    return {
      passed,
      message: `${failureCount} workflow failures in ${timeWindow} minutes`,
      alertLevel: passed ? 'info' : (failureCount > threshold * 2 ? 'critical' : 'warning'),
      metrics: { failureCount, threshold }
    };
  };

  const checkDataQuality = async (config: any) => {
    const threshold = config.quality_threshold || 0.9;

    const { data: metrics } = await supabase
      .from('data_quality_metrics')
      .select('*')
      .gte('checked_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('checked_at', { ascending: false })
      .limit(10);

    if (!metrics || metrics.length === 0) {
      return { passed: true, message: 'No recent data quality metrics', alertLevel: 'info' };
    }

    const avgQuality = metrics.reduce((sum, m) => sum + (m.metric_value || 0), 0) / metrics.length;
    const passed = avgQuality >= threshold;

    return {
      passed,
      message: `Average data quality: ${Math.round(avgQuality * 100)}%`,
      alertLevel: passed ? 'info' : (avgQuality < threshold * 0.8 ? 'critical' : 'warning'),
      metrics: { avgQuality, threshold, sampleCount: metrics.length }
    };
  };

  const checkPerformance = async (config: any) => {
    const responseTimeThreshold = config.response_time_threshold || 5000; // 5 seconds

    // Check AI request latency
    const { data: recentRequests } = await supabase
      .from('ai_requests')
      .select('latency_ms')
      .not('latency_ms', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .limit(50);

    if (!recentRequests || recentRequests.length === 0) {
      return { passed: true, message: 'No recent performance data', alertLevel: 'info' };
    }

    const avgLatency = recentRequests.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / recentRequests.length;
    const passed = avgLatency < responseTimeThreshold;

    return {
      passed,
      message: `Average response time: ${Math.round(avgLatency)}ms`,
      alertLevel: passed ? 'info' : (avgLatency > responseTimeThreshold * 2 ? 'critical' : 'warning'),
      metrics: { avgLatency, threshold: responseTimeThreshold, sampleCount: recentRequests.length }
    };
  };

  const createAlert = async (monitor: SystemMonitor, checkResult: any) => {
    try {
      await supabase
        .from('monitor_alerts')
        .insert({
          tenant_id: tenantId!,
          monitor_id: monitor.id,
          alert_level: checkResult.alertLevel,
          title: `${monitor.name} Alert`,
          message: checkResult.message,
          alert_data: checkResult.metrics || {}
        });

      // Update monitor alert count
      const currentCount = monitor.alert_count || 0;
      await supabase
        .from('system_monitors')
        .update({ 
          alert_count: currentCount + 1,
          last_alert_at: new Date().toISOString()
        })
        .eq('id', monitor.id);

    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const generateDashboard = async (checkResults: any[]): Promise<MonitoringDashboard> => {
    // Get recent active alerts
    const { data: alerts } = await supabase
      .from('monitor_alerts')
      .select('*')
      .eq('tenant_id', tenantId!)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    // Determine overall system health
    const criticalCount = checkResults.filter(r => r.alertLevel === 'critical').length;
    const warningCount = checkResults.filter(r => r.alertLevel === 'warning').length;

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalCount > 0) overall = 'critical';
    else if (warningCount > 0) overall = 'warning';

    // Component-specific health
    const aiHealth = checkResults.find(r => r.type === 'ai_failure_rate')?.alertLevel === 'critical' ? 'critical' : 
                    checkResults.find(r => r.type === 'ai_failure_rate')?.alertLevel === 'warning' ? 'warning' : 'healthy';
    
    const workflowHealth = checkResults.find(r => r.type === 'workflow_failures')?.alertLevel === 'critical' ? 'critical' :
                          checkResults.find(r => r.type === 'workflow_failures')?.alertLevel === 'warning' ? 'warning' : 'healthy';
    
    const dataQualityHealth = checkResults.find(r => r.type === 'data_quality')?.alertLevel === 'critical' ? 'critical' :
                             checkResults.find(r => r.type === 'data_quality')?.alertLevel === 'warning' ? 'warning' : 'healthy';

    return {
      systemHealth: {
        overall,
        aiServices: aiHealth,
        workflows: workflowHealth,
        dataQuality: dataQualityHealth
      },
      activeAlerts: alerts || [],
      recentMetrics: checkResults,
      performanceStats: {
        checksRun: checkResults.length,
        alertsGenerated: checkResults.filter(r => !r.passed).length,
        lastCheckTime: new Date().toISOString()
      }
    };
  };

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!tenantId) return { success: false, error: 'Tenant not loaded' };

    try {
      await supabase
        .from('monitor_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('tenant_id', tenantId);

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been acknowledged successfully",
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to acknowledge alert' 
      };
    }
  }, [toast, tenantId]);

  const resolveAlert = useCallback(async (alertId: string, resolutionNotes?: string) => {
    if (!tenantId) return { success: false, error: 'Tenant not loaded' };

    try {
      await supabase
        .from('monitor_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', alertId)
        .eq('tenant_id', tenantId);

      toast({
        title: "Alert Resolved",
        description: "Alert has been resolved successfully",
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to resolve alert' 
      };
    }
  }, [toast, tenantId]);

  const getMonitors = useCallback(async () => {
    if (!tenantId) return [];

    try {
      const { data, error } = await supabase
        .from('system_monitors')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching monitors:', error);
      return [];
    }
  }, [tenantId]);

  return {
    createMonitor,
    runSystemCheck,
    acknowledgeAlert,
    resolveAlert,
    getMonitors,
    isMonitoring,
    dashboard
  };
};