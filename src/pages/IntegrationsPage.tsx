import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntegrationPlatform } from '@/hooks/useIntegrationPlatform';
import { Activity, AlertTriangle, CheckCircle, Clock, Settings, Zap } from 'lucide-react';

const IntegrationsPage = () => {
  const {
    connections,
    syncJobs,
    alerts,
    loading,
    triggerSync,
    performHealthCheck,
    acknowledgeAlert,
  } = useIntegrationPlatform();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'completed':
        return 'bg-green-500';
      case 'running':
      case 'connecting':
        return 'bg-blue-500';
      case 'error':
      case 'failed':
      case 'unhealthy':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Integration Platform</h1>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="sync-jobs">Sync Jobs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{connection.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(connection.connection_status)}`} />
                      <Badge variant={connection.auth_status === 'connected' ? 'default' : 'destructive'}>
                        {connection.auth_status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {connection.integration_providers?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Last Sync:</span>{' '}
                      {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString() : 'Never'}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className="capitalize">{connection.sync_status}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => triggerSync(connection.id)}
                      disabled={loading}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => performHealthCheck(connection.id)}
                      disabled={loading}
                    >
                      <Activity className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync-jobs" className="space-y-4">
          <div className="space-y-4">
            {syncJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {job.job_type.replace('_', ' ')}
                    </CardTitle>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Priority: {job.priority} | Direction: {job.sync_direction}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span>{job.progress_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Records:</span>
                      <span>{job.processed_records}/{job.total_records}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span>
                        {job.total_records > 0 ? 
                          Math.round((job.successful_records / job.total_records) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {alert.severity === 'critical' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      {alert.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      {alert.severity === 'info' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                      <Badge variant={alert.status === 'active' ? 'default' : 'outline'}>
                        {alert.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {new Date(alert.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{alert.message}</p>
                  {alert.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                      disabled={loading}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connections.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Healthy Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {connections.filter(c => c.connection_status === 'healthy').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Sync Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {syncJobs.filter(j => j.status === 'running').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.status === 'active').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsPage;