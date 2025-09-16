import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSystemMonitoring } from '@/hooks/useSystemMonitoring';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Database,
  Bot,
  Settings
} from 'lucide-react';

const SystemDashboard: React.FC = () => {
  const { toast } = useToast();
  const { 
    dashboard, 
    runSystemCheck, 
    acknowledgeAlert, 
    resolveAlert,
    isMonitoring 
  } = useSystemMonitoring();
  
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Auto-run initial health check on mount
  useEffect(() => {
    if (!dashboard) {
      runSystemCheck();
    }
  }, [dashboard, runSystemCheck]);

  const getHealthColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    const result = await acknowledgeAlert(alertId);
    if (result.success) {
      setSelectedAlert(null);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!resolutionNotes.trim()) {
      toast({
        title: "Resolution Notes Required",
        description: "Please provide resolution notes",
        variant: "destructive",
      });
      return;
    }

    const result = await resolveAlert(alertId, resolutionNotes);
    if (result.success) {
      setSelectedAlert(null);
      setResolutionNotes('');
    }
  };

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            {getHealthIcon(dashboard.systemHealth.overall)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(dashboard.systemHealth.overall)}>
                {dashboard.systemHealth.overall.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Services</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(dashboard.systemHealth.aiServices)}>
                {dashboard.systemHealth.aiServices.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.performanceStats?.ai?.success_rate ? 
                `${Math.round(dashboard.performanceStats.ai.success_rate * 100)}% success rate` : 
                'No recent data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(dashboard.systemHealth.workflows)}>
                {dashboard.systemHealth.workflows.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.performanceStats?.workflows?.success_rate ? 
                `${Math.round(dashboard.performanceStats.workflows.success_rate * 100)}% success rate` : 
                'No recent data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(dashboard.systemHealth.dataQuality)}>
                {dashboard.systemHealth.dataQuality.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="alerts">
              Active Alerts ({dashboard.activeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>
          
          <Button 
            onClick={() => runSystemCheck()} 
            disabled={isMonitoring}
            className="flex items-center gap-2"
          >
            {isMonitoring ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Run Health Check
          </Button>
        </div>

        <TabsContent value="alerts" className="space-y-4">
          {dashboard.activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active alerts</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {dashboard.activeAlerts.map((alert) => (
                <Alert key={alert.id} className={`border-l-4 ${
                  alert.alert_level === 'critical' ? 'border-l-red-500' :
                  alert.alert_level === 'warning' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {alert.title}
                      <Badge variant={
                        alert.alert_level === 'critical' ? 'destructive' :
                        alert.alert_level === 'warning' ? 'secondary' : 'default'
                      }>
                        {alert.alert_level}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-1">
                      {alert.message}
                    </AlertDescription>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Services Performance
                </CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">
                      {dashboard.performanceStats?.ai?.success_rate ? 
                        `${Math.round(dashboard.performanceStats.ai.success_rate * 100)}%` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <Progress 
                    value={dashboard.performanceStats?.ai?.success_rate ? 
                      dashboard.performanceStats.ai.success_rate * 100 : 0
                    } 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="text-sm font-medium">
                      {dashboard.performanceStats?.ai?.avg_latency ? 
                        `${Math.round(dashboard.performanceStats.ai.avg_latency)}ms` : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Total Requests: {dashboard.performanceStats?.ai?.total_requests || 0}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Workflow Performance
                </CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">
                      {dashboard.performanceStats?.workflows?.success_rate ? 
                        `${Math.round(dashboard.performanceStats.workflows.success_rate * 100)}%` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <Progress 
                    value={dashboard.performanceStats?.workflows?.success_rate ? 
                      dashboard.performanceStats.workflows.success_rate * 100 : 0
                    } 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Duration</span>
                    <span className="text-sm font-medium">
                      {dashboard.performanceStats?.workflows?.avg_duration ? 
                        `${Math.round(dashboard.performanceStats.workflows.avg_duration / 1000)}s` : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Total Executions: {dashboard.performanceStats?.workflows?.total_executions || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Controls</CardTitle>
              <CardDescription>Manual system operations and diagnostics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => runSystemCheck()}
                  disabled={isMonitoring}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <Zap className="h-6 w-6" />
                  Run Health Check
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => toast({
                    title: "Feature Coming Soon",
                    description: "Data quality check will be available soon",
                  })}
                >
                  <Database className="h-6 w-6" />
                  Check Data Quality
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => toast({
                    title: "Feature Coming Soon",
                    description: "System diagnostics will be available soon",
                  })}
                >
                  <Settings className="h-6 w-6" />
                  Run Diagnostics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Resolution Dialog */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Resolve Alert</CardTitle>
              <CardDescription>{selectedAlert.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Resolution Notes</label>
                <textarea 
                  className="w-full mt-1 p-2 border rounded-md"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this issue was resolved..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleResolveAlert(selectedAlert.id)}
                  className="flex-1"
                >
                  Resolve
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SystemDashboard;