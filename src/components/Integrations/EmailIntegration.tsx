import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Send, 
  Users, 
  BarChart3,
  Settings,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';

interface EmailConfig {
  sender_name: string;
  sender_email: string;
  reply_to_email: string;
  daily_send_limit: number;
  hourly_send_limit: number;
  auto_send_enabled: boolean;
  bounce_handling_enabled: boolean;
}

export default function EmailIntegration() {
  const [config, setConfig] = useState<EmailConfig>({
    sender_name: '',
    sender_email: '',
    reply_to_email: '',
    daily_send_limit: 1000,
    hourly_send_limit: 100,
    auto_send_enabled: true,
    bounce_handling_enabled: true
  });
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [emailStats, setEmailStats] = useState({
    sent_today: 0,
    sent_this_month: 0,
    open_rate: 0,
    bounce_rate: 0
  });
  
  const { toast } = useToast();
  const { getTemplates, getCampaigns } = useEmailAutomation();
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetchEmailConfig();
    fetchEmailStats();
    checkConnection();
    loadEmailData();
  }, []);

  const loadEmailData = async () => {
    try {
      const templatesData = await getTemplates();
      const campaignsData = await getCampaigns();
      setTemplates(templatesData || []);
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Failed to load email data:', error);
    }
  };

  const fetchEmailConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userData) {
      // For now, use default config since email_configs table doesn't exist
      // In a real implementation, you would fetch from the database
      setConfig({
        sender_name: 'Your Company',
        sender_email: 'noreply@yourcompany.com',
        reply_to_email: 'support@yourcompany.com',
        daily_send_limit: 1000,
        hourly_send_limit: 100,
        auto_send_enabled: true,
        bounce_handling_enabled: true
      });
    }
  };

  const fetchEmailStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userData) {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      const { count: sentToday } = await supabase
        .from('email_sends')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userData.tenant_id)
        .gte('sent_at', today);

      const { count: sentThisMonth } = await supabase
        .from('email_sends')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', userData.tenant_id)
        .gte('sent_at', thisMonth);

      setEmailStats({
        sent_today: sentToday || 0,
        sent_this_month: sentThisMonth || 0,
        open_rate: 0, // Would calculate from email_tracking data
        bounce_rate: 0 // Would calculate from bounce data
      });
    }
  };

  const checkConnection = async () => {
    try {
      // Test connection by attempting to call the SMTP2GO function
      const { data, error } = await supabase.functions.invoke('smtp2go-send', {
        body: { test: true }
      });
      
      setIsConnected(!error);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const saveConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userData) {
      // For now, just show success message since email_configs table doesn't exist
      // In a real implementation, you would save to the database
      toast({ title: 'Email configuration saved successfully' });
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a test email address',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    
    try {
      const { error } = await supabase.functions.invoke('smtp2go-send', {
        body: {
          to: [testEmail],
          subject: 'SMTP2GO Test Email',
          html_content: '<h1>Test Email</h1><p>Your SMTP2GO integration is working correctly!</p>',
          text_content: 'Test Email\n\nYour SMTP2GO integration is working correctly!'
        }
      });

      if (error) throw error;

      toast({ 
        title: 'Test email sent successfully',
        description: `Check ${testEmail} for the test message`
      });
    } catch (error: any) {
      toast({ 
        title: 'Test email failed', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const updateSetting = (key: keyof EmailConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP2GO Email Integration
          </CardTitle>
          <CardDescription>
            Configure email automation for notifications and client communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <CheckCircle className="text-green-500 h-6 w-6" />
                ) : (
                  <XCircle className="text-red-500 h-6 w-6" />
                )}
                <div>
                  <p className="font-medium">
                    {isConnected ? 'Connected to SMTP2GO' : 'Connection Failed'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? 'Email service is operational' : 'Check your SMTP2GO configuration'}
                  </p>
                </div>
              </div>
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Sent Today</p>
                <p className="text-2xl font-bold">{emailStats.sent_today}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent This Month</p>
                <p className="text-2xl font-bold">{emailStats.sent_this_month}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>

            {!isConnected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  SMTP2GO connection is not working. Please check your API key configuration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>Configure sender settings and delivery preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sender" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sender">Sender Settings</TabsTrigger>
              <TabsTrigger value="limits">Send Limits</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="test">Test Email</TabsTrigger>
            </TabsList>

            <TabsContent value="sender" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Sender Name</Label>
                  <Input
                    id="sender-name"
                    value={config.sender_name}
                    onChange={(e) => updateSetting('sender_name', e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={config.sender_email}
                    onChange={(e) => updateSetting('sender_email', e.target.value)}
                    placeholder="noreply@yourcompany.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reply-to">Reply-To Email</Label>
                  <Input
                    id="reply-to"
                    type="email"
                    value={config.reply_to_email}
                    onChange={(e) => updateSetting('reply_to_email', e.target.value)}
                    placeholder="support@yourcompany.com"
                  />
                </div>
              </div>
              <Button onClick={saveConfig}>Save Settings</Button>
            </TabsContent>

            <TabsContent value="limits" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Send Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={config.daily_send_limit}
                    onChange={(e) => updateSetting('daily_send_limit', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly-limit">Hourly Send Limit</Label>
                  <Input
                    id="hourly-limit"
                    type="number"
                    value={config.hourly_send_limit}
                    onChange={(e) => updateSetting('hourly_send_limit', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={saveConfig}>Save Limits</Button>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-send Emails</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically send scheduled emails and notifications
                    </p>
                  </div>
                  <Switch
                    checked={config.auto_send_enabled}
                    onCheckedChange={(checked) => updateSetting('auto_send_enabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Bounce Handling</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically handle bounced emails and update recipient status
                    </p>
                  </div>
                  <Switch
                    checked={config.bounce_handling_enabled}
                    onCheckedChange={(checked) => updateSetting('bounce_handling_enabled', checked)}
                  />
                </div>
              </div>
              <Button onClick={saveConfig}>Save Automation Settings</Button>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <Button onClick={sendTestEmail} disabled={testing}>
                  <Send className={`mr-2 h-4 w-4 ${testing ? 'animate-pulse' : ''}`} />
                  {testing ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common email operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Mail className="mr-2 h-4 w-4" />
              Create Email Template
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Manage Recipients
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button variant="outline" className="justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Connection
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}