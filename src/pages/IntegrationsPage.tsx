import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useIntegrationPlatform } from '@/hooks/useIntegrationPlatform';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Zap, 
  Plus,
  ExternalLink,
  RefreshCw,
  Database,
  FileText,
  ShoppingCart,
  Users,
  DollarSign
} from 'lucide-react';

const IntegrationsPage = () => {
  const [qboConfig, setQboConfig] = useState({
    clientId: '',
    clientSecret: '',
    environment: 'sandbox',
    webhookUrl: '',
    autoSync: true,
    syncFrequency: 'daily'
  });
  const [qboConnected, setQboConnected] = useState(false);
  const [qboSyncStatus, setQboSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showQboConfig, setShowQboConfig] = useState(false);
  const { toast } = useToast();

  const {
    connections,
    syncJobs,
    alerts,
    loading,
    triggerSync,
    performHealthCheck,
    acknowledgeAlert,
  } = useIntegrationPlatform();

  useEffect(() => {
    checkQboConnection();
    loadQboConfig();
  }, []);

  const checkQboConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'integrations')
        .single();

      if (data?.settings && typeof data.settings === 'object' && 'quickbooks' in data.settings) {
        const settings = data.settings as { quickbooks?: { connected?: boolean } };
        if (settings.quickbooks?.connected) {
          setQboConnected(true);
        }
      }
    } catch (error) {
      console.error('Error checking QBO connection:', error);
    }
  };

  const loadQboConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'integrations')
        .single();

      if (data?.settings && typeof data.settings === 'object' && 'quickbooks' in data.settings) {
        const settings = data.settings as { quickbooks?: any };
        if (settings.quickbooks) {
          setQboConfig(prev => ({
            ...prev,
            ...settings.quickbooks
          }));
        }
      }
    } catch (error) {
      console.error('Error loading QBO config:', error);
    }
  };

  const handleQboConnect = async () => {
    try {
      // Save configuration first
      await saveQboConfig();
      
      // Initiate OAuth flow
      const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
        body: {
          action: 'get_auth_url',
          config: qboConfig
        }
      });

      if (error) throw error;

      if (data.auth_url) {
        window.open(data.auth_url, '_blank', 'width=600,height=700');
        
        toast({
          title: 'QuickBooks Authentication',
          description: 'Please complete the authentication in the popup window.',
        });
      }
    } catch (error) {
      console.error('Error connecting to QuickBooks:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to QuickBooks. Please check your configuration.',
        variant: 'destructive',
      });
    }
  };

  const saveQboConfig = async () => {
    try {
      // Get current user's tenant_id
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not logged in');

      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (!userProfile?.tenant_id) throw new Error('User tenant not found');

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          category: 'integrations',
          tenant_id: userProfile.tenant_id,
          settings: {
            quickbooks: {
              ...qboConfig,
              updated_at: new Date().toISOString()
            }
          } as any
        }, {
          onConflict: 'category'
        });

      if (error) throw error;

      toast({
        title: 'Configuration Saved',
        description: 'QuickBooks configuration has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving QBO config:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save QuickBooks configuration.',
        variant: 'destructive',
      });
    }
  };

  const handleQboSync = async (syncType: 'full' | 'incremental' | 'items' | 'customers' | 'invoices') => {
    try {
      setQboSyncStatus('syncing');
      
      const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
        body: {
          action: 'sync',
          type: syncType,
          config: qboConfig
        }
      });

      if (error) throw error;

      setQboSyncStatus('success');
      toast({
        title: 'Sync Completed',
        description: `QuickBooks ${syncType} sync completed successfully.`,
      });

      // Refresh connections
      checkQboConnection();
    } catch (error) {
      console.error('Error syncing with QuickBooks:', error);
      setQboSyncStatus('error');
      toast({
        title: 'Sync Error',
        description: 'Failed to sync with QuickBooks. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleQboDisconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('quickbooks-integration', {
        body: {
          action: 'disconnect'
        }
      });

      if (error) throw error;

      setQboConnected(false);
      setQboSyncStatus('idle');
      
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from QuickBooks.',
      });
    } catch (error) {
      console.error('Error disconnecting from QuickBooks:', error);
      toast({
        title: 'Disconnect Error',
        description: 'Failed to disconnect from QuickBooks.',
        variant: 'destructive',
      });
    }
  };

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
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Integration Platform</h1>
              <p className="text-muted-foreground">
                Manage your integrations and sync data across platforms.
              </p>
            </div>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure New Integration
            </Button>
          </div>

            <Tabs defaultValue="quickbooks" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="quickbooks">QuickBooks</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
                <TabsTrigger value="sync-jobs">Sync Jobs</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              </TabsList>

              {/* QuickBooks Integration Tab */}
              <TabsContent value="quickbooks" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Connection Status Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Database className="w-4 h-4 text-blue-600" />
                          </div>
                          QuickBooks Online
                        </CardTitle>
                        <Badge variant={qboConnected ? 'default' : 'secondary'}>
                          {qboConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Sync products, services, invoices, and customers with QuickBooks Online
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${qboConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm font-medium">
                            {qboConnected ? 'Active Connection' : 'No Connection'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {qboConnected ? 'Last sync: 2 hours ago' : 'Never synced'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        {!qboConnected ? (
                          <>
                            <Dialog open={showQboConfig} onOpenChange={setShowQboConfig}>
                              <DialogTrigger asChild>
                                <Button className="flex-1">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Connect QuickBooks
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                            <Button variant="outline" onClick={() => setShowQboConfig(true)}>
                              <Settings className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleQboSync('incremental')}
                              disabled={qboSyncStatus === 'syncing'}
                            >
                              {qboSyncStatus === 'syncing' ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4 mr-2" />
                              )}
                              Quick Sync
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowQboConfig(true)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleQboDisconnect}
                            >
                              Disconnect
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sync Options Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sync Options</CardTitle>
                      <CardDescription>
                        Choose what data to synchronize with QuickBooks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => handleQboSync('items')}
                          disabled={!qboConnected || qboSyncStatus === 'syncing'}
                        >
                          <ShoppingCart className="w-6 h-6" />
                          <div className="text-center">
                            <div className="font-medium">Products & Services</div>
                            <div className="text-xs text-muted-foreground">Sync catalog items</div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => handleQboSync('customers')}
                          disabled={!qboConnected || qboSyncStatus === 'syncing'}
                        >
                          <Users className="w-6 h-6" />
                          <div className="text-center">
                            <div className="font-medium">Customers</div>
                            <div className="text-xs text-muted-foreground">Sync client data</div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => handleQboSync('invoices')}
                          disabled={!qboConnected || qboSyncStatus === 'syncing'}
                        >
                          <FileText className="w-6 h-6" />
                          <div className="text-center">
                            <div className="font-medium">Invoices</div>
                            <div className="text-xs text-muted-foreground">Sync invoices & estimates</div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="h-auto p-4 flex-col gap-2"
                          onClick={() => handleQboSync('full')}
                          disabled={!qboConnected || qboSyncStatus === 'syncing'}
                        >
                          <Database className="w-6 h-6" />
                          <div className="text-center">
                            <div className="font-medium">Full Sync</div>
                            <div className="text-xs text-muted-foreground">Sync everything</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* QuickBooks Configuration Dialog */}
                <Dialog open={showQboConfig} onOpenChange={setShowQboConfig}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>QuickBooks Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientId">Client ID</Label>
                          <Input
                            id="clientId"
                            type="password"
                            value={qboConfig.clientId}
                            onChange={(e) => setQboConfig({...qboConfig, clientId: e.target.value})}
                            placeholder="QuickBooks App Client ID"
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientSecret">Client Secret</Label>
                          <Input
                            id="clientSecret"
                            type="password"
                            value={qboConfig.clientSecret}
                            onChange={(e) => setQboConfig({...qboConfig, clientSecret: e.target.value})}
                            placeholder="QuickBooks App Client Secret"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="environment">Environment</Label>
                          <Select value={qboConfig.environment} onValueChange={(value) => setQboConfig({...qboConfig, environment: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="syncFreq">Sync Frequency</Label>
                          <Select value={qboConfig.syncFrequency} onValueChange={(value) => setQboConfig({...qboConfig, syncFrequency: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual Only</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                        <Input
                          id="webhookUrl"
                          value={qboConfig.webhookUrl}
                          onChange={(e) => setQboConfig({...qboConfig, webhookUrl: e.target.value})}
                          placeholder="https://your-app.com/webhooks/quickbooks"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="autoSync"
                          checked={qboConfig.autoSync}
                          onCheckedChange={(checked) => setQboConfig({...qboConfig, autoSync: checked})}
                        />
                        <Label htmlFor="autoSync">Enable automatic sync</Label>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button onClick={saveQboConfig} className="flex-1">
                          Save Configuration
                        </Button>
                        {!qboConnected && (
                          <Button onClick={handleQboConnect} className="flex-1">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect to QuickBooks
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

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
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default IntegrationsPage;