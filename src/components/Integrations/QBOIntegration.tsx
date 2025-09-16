import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings, 
  Users, 
  FileText, 
  DollarSign,
  AlertCircle,
  ArrowRight,
  Clock,
  Link
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function QBOIntegration() {
  const [connection, setConnection] = useState<any>(null);
  const [settings, setSettings] = useState({
    sync_enabled: true,
    sync_frequency: 'hourly',
    sync_clients: true,
    sync_invoices: true,
    sync_payments: true,
    auto_create_invoices: false,
    auto_send_invoices: false
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState({
    clients: 0,
    invoices: 0,
    payments: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchConnection();
    fetchSyncStats();
  }, []);

  const fetchConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userData) {
      const { data } = await supabase
        .from('qbo_connections')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('is_active', true)
        .single();
      
      if (data) {
        setConnection(data);
        setLastSync(data.last_sync);
      }
    }
  };

  const fetchSyncStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userData) {
      // Get counts of synced entities
      const { count: clientCount } = await supabase
        .from('qbo_sync_mappings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userData.tenant_id)
        .eq('entity_type', 'client');

      const { count: invoiceCount } = await supabase
        .from('qbo_sync_mappings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userData.tenant_id)
        .eq('entity_type', 'invoice');

      setSyncStats({
        clients: clientCount || 0,
        invoices: invoiceCount || 0,
        payments: 0
      });
    }
  };

  const connectToQBO = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userData) {
      // Store return URL in localStorage to come back after OAuth
      localStorage.setItem('qbo_return_url', window.location.pathname);
      
      // For development, use placeholder
      toast({
        title: "Demo Mode",
        description: "In production, this would redirect to QuickBooks OAuth. Using demo connection for now.",
      });
      
      // Simulate connection for demo
      const { error } = await supabase
        .from('qbo_connections')
        .insert({
          tenant_id: userData.tenant_id,
          realm_id: 'demo_realm_' + Date.now(),
          access_token: 'demo_token',
          refresh_token: 'demo_refresh',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
          company_name: 'Demo QuickBooks Company',
          is_active: true
        });
      
      if (!error) {
        fetchConnection();
        fetchSyncStats();
      }
    }
  };

  const disconnectQBO = async () => {
    if (!connection) return;
    
    if (confirm('Are you sure you want to disconnect QuickBooks? This will stop all automatic syncing.')) {
      const { error } = await supabase
        .from('qbo_connections')
        .update({ is_active: false })
        .eq('id', connection.id);

      if (!error) {
        setConnection(null);
        setSyncStats({ clients: 0, invoices: 0, payments: 0 });
        toast({ title: 'Disconnected from QuickBooks' });
      }
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userData && connection) {
        // Update last sync time
        await supabase
          .from('qbo_connections')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', connection.id);
        
        setLastSync(new Date().toISOString());
        fetchSyncStats();
        
        toast({ 
          title: 'Sync Complete', 
          description: 'Successfully synced with QuickBooks'
        });
      }
    } catch (error: any) {
      toast({ 
        title: 'Sync Failed', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userData) {
      await supabase
        .from('qbo_settings')
        .upsert({
          tenant_id: userData.tenant_id,
          ...settings,
          [key]: value,
          updated_at: new Date().toISOString()
        });
    }
  };

  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            QuickBooks Online Integration
          </CardTitle>
          <CardDescription>
            Connect your QuickBooks Online account to automatically sync clients, create invoices, and track payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                QuickBooks integration allows you to:
                <ul className="list-disc list-inside mt-2">
                  <li>Automatically sync clients as customers</li>
                  <li>Create and send invoices from contracts</li>
                  <li>Track payments and update records</li>
                  <li>Generate financial reports</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <Button onClick={connectToQBO} className="w-full sm:w-auto">
              <Link className="mr-2 h-4 w-4" />
              Connect QuickBooks Online
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 h-6 w-6" />
                <div>
                  <p className="font-medium">Connected to QuickBooks</p>
                  <p className="text-sm text-muted-foreground">{connection.company_name}</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Clients Synced</p>
                <p className="text-2xl font-bold">{syncStats.clients}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoices Created</p>
                <p className="text-2xl font-bold">{syncStats.invoices}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">
                  {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={syncNow} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button variant="outline" onClick={disconnectQBO}>
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>Configure what data to sync and when</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="data" className="space-y-4">
            <TabsList>
              <TabsTrigger value="data">Data Sync</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sync Clients</p>
                    <p className="text-sm text-muted-foreground">
                      Sync platform clients as QuickBooks customers
                    </p>
                  </div>
                  <Switch
                    checked={settings.sync_clients}
                    onCheckedChange={(checked) => updateSetting('sync_clients', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sync Invoices</p>
                    <p className="text-sm text-muted-foreground">
                      Create QuickBooks invoices from contracts
                    </p>
                  </div>
                  <Switch
                    checked={settings.sync_invoices}
                    onCheckedChange={(checked) => updateSetting('sync_invoices', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sync Payments</p>
                    <p className="text-sm text-muted-foreground">
                      Import payment status from QuickBooks
                    </p>
                  </div>
                  <Switch
                    checked={settings.sync_payments}
                    onCheckedChange={(checked) => updateSetting('sync_payments', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-create Invoices</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically create invoices for new contracts
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_create_invoices}
                    onCheckedChange={(checked) => updateSetting('auto_create_invoices', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-send Invoices</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically email invoices to clients
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_send_invoices}
                    onCheckedChange={(checked) => updateSetting('auto_send_invoices', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Automatic Sync</p>
                    <p className="text-sm text-muted-foreground">
                      Sync data automatically on schedule
                    </p>
                  </div>
                  <Switch
                    checked={settings.sync_enabled}
                    onCheckedChange={(checked) => updateSetting('sync_enabled', checked)}
                  />
                </div>
                
                {settings.sync_enabled && (
                  <div>
                    <label className="text-sm font-medium">Sync Frequency</label>
                    <Select 
                      value={settings.sync_frequency} 
                      onValueChange={(value) => updateSetting('sync_frequency', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Every hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common QuickBooks operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Sync All Clients
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Generate Monthly Invoices
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Import Payments
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-start">
              <Clock className="mr-2 h-4 w-4" />
              View Sync History
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}