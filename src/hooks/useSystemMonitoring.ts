import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SystemMonitor {
  id: string;
  monitor_type: 'ai_failure_rate' | 'workflow_failures' | 'data_quality' | 'performance';
  name: string;
  description?: string;
  check_config: any;
  alert_config: any;
  status: 'active' | 'inactive' | 'alerting';
  last_checked_at?: string;
  last_alert_at?: string;
  alert_count: number;
  check_interval_minutes: number;
  is_critical: boolean;
}

interface MonitorAlert {
  id: string;
  monitor_id: string;
  alert_level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  alert_data: any;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

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
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);

  const createMonitor = useCallback(async (monitorConfig: Partial<SystemMonitor>) => {
    try {
      const { data, error } = await supabase
        .from('system_monitors')
        .insert({
          monitor_type: monitorConfig.monitor_type || 'performance',
          name: monitorConfig.name || 'Untitled Monitor',
          description: monitorConfig.description,
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
  }, [toast]);

  const runMonitorChecks = useCallback(async (monitorId?: string) => {
    setIsMonitoring(true);
    
    try {
      let query = supabase
        .from('system_monitors')
        .select('*')
        .eq('status', 'active');

      if (monitorId) {
        query = query.eq('id', monitorId);
      }

      const { data: monitors, error } = await query;
      if (error) throw error;

      const checkResults = [];

      for (const monitor of monitors) {
        try {
          const result = await performMonitorCheck(monitor);
          checkResults.push(result);

          // Update monitor last checked time
          await supabase
            .from('system_monitors')
            .update({ 
              last_checked_at: new Date().toISOString(),
              status: result.alertTriggered ? 'alerting' : 'active'
            })
            .eq('id', monitor.id);

          // Create alert if threshold exceeded
          if (result.alertTriggered) {
            await createAlert(monitor, result.alertData);
          }

        } catch (checkError) {
          console.error(`Monitor check failed for ${monitor.name}:`, checkError);
        }
      }

      return checkResults;
    } catch (error) {
      console.error('Error running monitor checks:', error);
      return [];
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  const performMonitorCheck = async (monitor: SystemMonitor): Promise<{
    monitorId: string;
    monitorName: string;
    checkPassed: boolean;
    alertTriggered: boolean;
    currentValue: any;
    threshold: any;
    alertData?: any;
  }> => {
    const { check_config } = monitor;

    switch (monitor.monitor_type) {
      case 'ai_failure_rate':
        return await checkAIFailureRate(monitor);
      case 'workflow_failures':
        return await checkWorkflowFailures(monitor);
      case 'data_quality':
        return await checkDataQuality(monitor);
      case 'performance':
        return await checkPerformance(monitor);
      default:
        throw new Error(`Unknown monitor type: ${monitor.monitor_type}`);
    }
  };

  const checkAIFailureRate = async (monitor: SystemMonitor): Promise<any> => {
    const { threshold_percent, time_window_minutes } = monitor.check_config;
    const timeWindow = new Date(Date.now() - time_window_minutes * 60 * 1000);

    const { data: requests, error } = await supabase
      .from('ai_requests')
      .select('status')
      .gte('created_at', timeWindow.toISOString());

    if (error) throw error;

    const totalRequests = requests.length;
    const failedRequests = requests.filter(r => r.status === 'failed').length;
    const failureRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    const alertTriggered = failureRate > threshold_percent;

    return {
      monitorId: monitor.id,
      monitorName: monitor.name,
      checkPassed: !alertTriggered,
      alertTriggered,
      currentValue: failureRate,
      threshold: threshold_percent,
      alertData: {
        failure_rate: failureRate,
        failed_requests: failedRequests,
        total_requests: totalRequests,
        time_window: time_window_minutes
      }
    };
  };

  const checkWorkflowFailures = async (monitor: SystemMonitor): Promise<any> => {
    const { max_failures, time_window_minutes } = monitor.check_config;
    const timeWindow = new Date(Date.now() - time_window_minutes * 60 * 1000);

    const { data: executions, error } = await supabase
      .from('workflow_executions')
      .select('execution_status')
      .gte('started_at', timeWindow.toISOString())
      .eq('execution_status', 'failed');

    if (error) throw error;

    const failureCount = executions.length;
    const alertTriggered = failureCount > max_failures;

    return {
      monitorId: monitor.id,
      monitorName: monitor.name,
      checkPassed: !alertTriggered,
      alertTriggered,
      currentValue: failureCount,
      threshold: max_failures,
      alertData: {
        failure_count: failureCount,
        time_window: time_window_minutes
      }
    };
  };

  const checkDataQuality = async (monitor: SystemMonitor): Promise<any> => {
    const { table_name, metric_type, min_threshold } = monitor.check_config;

    const { data: metrics, error } = await supabase
      .from('data_quality_metrics')
      .select('*')
      .eq('table_name', table_name)
      .eq('metric_type', metric_type)
      .order('checked_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!metrics || metrics.length === 0) {
      return {
        monitorId: monitor.id,
        monitorName: monitor.name,
        checkPassed: false,
        alertTriggered: true,
        currentValue: null,
        threshold: min_threshold,
        alertData: {
          error: 'No data quality metrics found',
          table_name,
          metric_type
        }
      };
    }

    const latestMetric = metrics[0];
    const alertTriggered = latestMetric.metric_value < min_threshold;

    return {
      monitorId: monitor.id,
      monitorName: monitor.name,
      checkPassed: !alertTriggered,
      alertTriggered,
      currentValue: latestMetric.metric_value,
      threshold: min_threshold,
      alertData: {
        metric_value: latestMetric.metric_value,
        table_name,
        metric_type,
        sample_size: latestMetric.sample_size
      }
    };
  };

  const checkPerformance = async (monitor: SystemMonitor): Promise<any> => {
    const { metric_name, max_threshold, source_table } = monitor.check_config;

    let currentValue;
    let alertTriggered = false;

    switch (metric_name) {
      case 'avg_response_time':
        const { data: aiRequests } = await supabase
          .from('ai_requests')
          .select('latency_ms')
          .not('latency_ms', 'is', null)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (aiRequests && aiRequests.length > 0) {
          const avgLatency = aiRequests.reduce((sum, req) => sum + req.latency_ms, 0) / aiRequests.length;
          currentValue = avgLatency;
          alertTriggered = avgLatency > max_threshold;
        }
        break;

      case 'workflow_duration':
        const { data: executions } = await supabase
          .from('workflow_executions')
          .select('duration_ms')
          .not('duration_ms', 'is', null)
          .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (executions && executions.length > 0) {
          const avgDuration = executions.reduce((sum, exec) => sum + exec.duration_ms, 0) / executions.length;
          currentValue = avgDuration;
          alertTriggered = avgDuration > max_threshold;
        }
        break;

      default:
        throw new Error(`Unknown performance metric: ${metric_name}`);
    }

    return {
      monitorId: monitor.id,
      monitorName: monitor.name,
      checkPassed: !alertTriggered,
      alertTriggered,
      currentValue,
      threshold: max_threshold,
      alertData: {
        metric_name,
        current_value: currentValue
      }
    };
  };

  const createAlert = async (monitor: SystemMonitor, alertData: any) => {
    try {
      const alertLevel = monitor.is_critical ? 'critical' : 'warning';
      
      const { data, error } = await supabase
        .from('monitor_alerts')
        .insert({
          monitor_id: monitor.id,
          alert_level: alertLevel,
          title: `${monitor.name} Alert`,
          message: generateAlertMessage(monitor, alertData),
          alert_data: alertData
        })
        .select()
        .single();

      if (error) throw error;

      // Update monitor alert count and last alert time
      await supabase
        .from('system_monitors')
        .update({
          alert_count: monitor.alert_count + 1,
          last_alert_at: new Date().toISOString()
        })
        .eq('id', monitor.id);

      // Send notifications if configured
      if (monitor.alert_config.notifications_enabled) {
        await sendAlertNotifications(monitor, data);
      }

      // Show toast for critical alerts
      if (alertLevel === 'critical') {
        toast({
          title: "Critical Alert",
          description: data.message,
          variant: "destructive",
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const generateAlertMessage = (monitor: SystemMonitor, alertData: any): string => {
    switch (monitor.monitor_type) {
      case 'ai_failure_rate':
        return `AI failure rate (${alertData.failure_rate.toFixed(1)}%) exceeded threshold (${monitor.check_config.threshold_percent}%) with ${alertData.failed_requests} failures out of ${alertData.total_requests} requests`;
      
      case 'workflow_failures':
        return `Workflow failures (${alertData.failure_count}) exceeded threshold (${monitor.check_config.max_failures}) in the last ${alertData.time_window} minutes`;
      
      case 'data_quality':
        return `Data quality for ${alertData.table_name} ${alertData.metric_type} (${alertData.metric_value}%) below threshold (${monitor.check_config.min_threshold}%)`;
      
      case 'performance':
        return `Performance metric ${alertData.metric_name} (${alertData.current_value}) exceeded threshold (${monitor.check_config.max_threshold})`;
      
      default:
        return `Monitor "${monitor.name}" triggered an alert`;
    }
  };

  const sendAlertNotifications = async (monitor: SystemMonitor, alert: MonitorAlert) => {
    try {
      const { alert_config } = monitor;

      if (alert_config.email_enabled && alert_config.email_recipients) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: alert_config.email_recipients,
            subject: `Alert: ${alert.title}`,
            body: alert.message,
            priority: alert.alert_level === 'critical' ? 'high' : 'normal'
          }
        });
      }

      if (alert_config.webhook_url) {
        await fetch(alert_config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_id: alert.id,
            monitor_name: monitor.name,
            alert_level: alert.alert_level,
            message: alert.message,
            data: alert.alert_data,
            timestamp: alert.created_at
          })
        });
      }

      // Update notification status
      await supabase
        .from('monitor_alerts')
        .update({ notification_sent: true })
        .eq('id', alert.id);

    } catch (error) {
      console.error('Error sending alert notifications:', error);
      
      // Update notification failure
      await supabase
        .from('monitor_alerts')
        .update({ 
          notification_attempts: (alert.notification_attempts || 0) + 1 
        })
        .eq('id', alert.id);
    }
  };

  const acknowledgeAlert = useCallback(async (alertId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('monitor_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been acknowledged successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [toast]);

  const resolveAlert = useCallback(async (alertId: string, resolutionNotes: string) => {
    try {
      const { error } = await supabase
        .from('monitor_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Resolved",
        description: "Alert has been resolved successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [toast]);

  const getDashboardData = useCallback(async (): Promise<MonitoringDashboard> => {
    try {
      // Get active alerts
      const { data: activeAlerts } = await supabase
        .from('monitor_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      // Get system health metrics
      const healthChecks = await Promise.all([
        checkSystemHealth('ai_services'),
        checkSystemHealth('workflows'),
        checkSystemHealth('data_quality')
      ]);

      const overallHealth = healthChecks.some(h => h === 'critical') ? 'critical' :
                          healthChecks.some(h => h === 'warning') ? 'warning' : 'healthy';

      // Get performance stats
      const performanceStats = await getPerformanceStats();

      return {
        systemHealth: {
          overall: overallHealth,
          aiServices: healthChecks[0],
          workflows: healthChecks[1],
          dataQuality: healthChecks[2]
        },
        activeAlerts: activeAlerts || [],
        recentMetrics: [],
        performanceStats
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {
        systemHealth: {
          overall: 'warning',
          aiServices: 'warning',
          workflows: 'warning',
          dataQuality: 'warning'
        },
        activeAlerts: [],
        recentMetrics: [],
        performanceStats: {}
      };
    }
  }, []);

  const checkSystemHealth = async (system: string): Promise<'healthy' | 'warning' | 'critical'> => {
    const timeWindow = new Date(Date.now() - 60 * 60 * 1000); // Last hour

    switch (system) {
      case 'ai_services':
        const { data: aiRequests } = await supabase
          .from('ai_requests')
          .select('status')
          .gte('created_at', timeWindow.toISOString());

        if (!aiRequests || aiRequests.length === 0) return 'warning';
        
        const failureRate = aiRequests.filter(r => r.status === 'failed').length / aiRequests.length;
        if (failureRate > 0.5) return 'critical';
        if (failureRate > 0.2) return 'warning';
        return 'healthy';

      case 'workflows':
        const { data: executions } = await supabase
          .from('workflow_executions')
          .select('execution_status')
          .gte('started_at', timeWindow.toISOString());

        if (!executions || executions.length === 0) return 'healthy';
        
        const workflowFailureRate = executions.filter(e => e.execution_status === 'failed').length / executions.length;
        if (workflowFailureRate > 0.3) return 'critical';
        if (workflowFailureRate > 0.1) return 'warning';
        return 'healthy';

      case 'data_quality':
        const { data: qualityMetrics } = await supabase
          .from('data_quality_metrics')
          .select('is_passing')
          .gte('checked_at', timeWindow.toISOString());

        if (!qualityMetrics || qualityMetrics.length === 0) return 'warning';
        
        const passingRate = qualityMetrics.filter(m => m.is_passing).length / qualityMetrics.length;
        if (passingRate < 0.7) return 'critical';
        if (passingRate < 0.9) return 'warning';
        return 'healthy';

      default:
        return 'warning';
    }
  };

  const getPerformanceStats = async () => {
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const [aiStats, workflowStats] = await Promise.all([
      supabase
        .from('ai_requests')
        .select('latency_ms, status, created_at')
        .gte('created_at', timeWindow.toISOString()),
      supabase
        .from('workflow_executions')
        .select('duration_ms, execution_status, started_at')
        .gte('started_at', timeWindow.toISOString())
    ]);

    return {
      ai: {
        total_requests: aiStats.data?.length || 0,
        avg_latency: aiStats.data?.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / (aiStats.data?.length || 1),
        success_rate: aiStats.data ? aiStats.data.filter(r => r.status === 'completed').length / aiStats.data.length : 0
      },
      workflows: {
        total_executions: workflowStats.data?.length || 0,
        avg_duration: workflowStats.data?.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / (workflowStats.data?.length || 1),
        success_rate: workflowStats.data ? workflowStats.data.filter(e => e.execution_status === 'completed').length / workflowStats.data.length : 0
      }
    };
  };

  const getMonitors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_monitors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching monitors:', error);
      return [];
    }
  }, []);

  const getAlerts = useCallback(async (status?: string, limit = 50) => {
    try {
      let query = supabase
        .from('monitor_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }, []);

  // Auto-refresh dashboard data
  useEffect(() => {
    const refreshDashboard = async () => {
      const dashboardData = await getDashboardData();
      setDashboard(dashboardData);
      setAlerts(dashboardData.activeAlerts);
    };

    refreshDashboard();
    const interval = setInterval(refreshDashboard, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [getDashboardData]);

  return {
    createMonitor,
    runMonitorChecks,
    acknowledgeAlert,
    resolveAlert,
    getDashboardData,
    getMonitors,
    getAlerts,
    isMonitoring,
    dashboard,
    alerts
  };
};