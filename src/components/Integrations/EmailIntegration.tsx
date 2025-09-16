import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Mail,
  Settings,
  Send,
  Users,
  BarChart,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Eye,
  MousePointer
} from 'lucide-react';

interface EmailIntegrationProps {
  integrations: any[];
}

export default function EmailIntegration({ integrations }: EmailIntegrationProps) {
  const [emailProvider, setEmailProvider] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState({
    apiKey: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    trackOpens: true,
    trackClicks: true,
    enableBounceHandling: true
  });
  const [emailStats, setEmailStats] = useState({
    totalSent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    openRate: 0,
    clickRate: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
    loadEmailStats();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'email_integration')
        .single();

      if (data?.settings && typeof data.settings === 'object' && 'email' in data.settings) {
        const settings = data.settings as any;
        if (settings.email?.connected) {
          setIsConnected(true);
          setEmailProvider(settings.email.provider || '');
          setConfig(prev => ({
            ...prev,
            ...settings.email
          }));
        }
      }
    } catch (error) {
      console.error('Error checking email connection:', error);
    }
  };

  const loadEmailStats = async () => {
    // In a real implementation, this would fetch actual email statistics
    setEmailStats({
      totalSent: 1247,
      delivered: 1198,
      opened: 743,
      clicked: 127,
      bounced: 49,
      openRate: 62.0,
      clickRate: 10.6
    });
  };

  const handleConnect = async () => {
    if (!emailProvider || !config.apiKey) {
      toast({
        title: 'Configuration Required',
        description: 'Please select a provider and enter your API key.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('email-integration-setup', {
        body: {
          provider: emailProvider,
          action: 'connect',
          config: config
        }
      });

      if (error) throw error;

      setIsConnected(true);
      await saveConfig();
      toast({
        title: 'Email Integration Connected',
        description: `Successfully connected to ${emailProvider}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect email integration.',
        variant: 'destructive',
      });
    }
  };

  const handleTestEmail = async () => {
    try {
      const { error } = await supabase.functions.invoke('email-integration-setup', {
        body: {
          provider: emailProvider,
          action: 'test_email',
          config: config
        }
      });

      if (error) throw error;

      toast({
        title: 'Test Email Sent',
        description: 'Test email sent successfully. Check your inbox.',
      });
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to send test email.',
        variant: 'destructive',
      });
    }
  };

  const saveConfig = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not logged in');

      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', userData.user.id)
        .single();

      if (!userProfile?.tenant_id) throw new Error('User tenant not found');

      const settingsData = {
        category: 'email_integration',
        tenant_id: userProfile.tenant_id,
        settings: {
          email: {
            ...config,
            provider: emailProvider,
            connected: isConnected,
            updated_at: new Date().toISOString()
          }
        }
      };

      const { data: existingRecord } = await supabase
        .from('company_settings')
        .select('id')
        .eq('category', 'email_integration')
        .eq('tenant_id', userProfile.tenant_id)
        .single();

      let error;
      if (existingRecord) {
        const result = await supabase
          .from('company_settings')
          .update(settingsData)
          .eq('id', existingRecord.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('company_settings')
          .insert(settingsData);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Configuration Saved',
        description: 'Email integration settings saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error.message || 'Failed to save configuration.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Email Marketing Integration</h3>
          <p className="text-muted-foreground">
            Configure email providers for automated marketing and notifications
          </p>
        </div>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          {isConnected ? `Connected to ${emailProvider}` : 'Not Connected'}
        </Badge>
      </div>

      {/* Email Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Emails delivered: {emailStats.delivered}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              {emailStats.opened} opens
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.clickRate}%</div>
            <p className="text-xs text-muted-foreground">
              {emailStats.clicked} clicks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((emailStats.bounced / emailStats.totalSent) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {emailStats.bounced} bounces
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Provider Setup
          </CardTitle>
          <CardDescription>
            Configure your email service provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">Email Provider</Label>
              <Select value={emailProvider} onValueChange={setEmailProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select email provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mailchimp">Mailchimp</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="aws-ses">Amazon SES</SelectItem>
                  <SelectItem value="postmark">Postmark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourcompany.com"
                value={config.fromEmail}
                onChange={(e) => setConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                placeholder="Your Company Name"
                value={config.fromName}
                onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {isConnected ? (
              <>
                <Button onClick={handleTestEmail} variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
                <Button onClick={saveConfig} size="sm">
                  Save Settings
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleConnect} 
                disabled={!emailProvider || !config.apiKey}
              >
                Connect Email Provider
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Email Providers</CardTitle>
          <CardDescription>
            Choose from these popular email service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations
              .filter(integration => ['mailchimp', 'sendgrid', 'mailgun'].some(id => integration.id?.includes(id)))
              .map((integration) => {
                const IconComponent = integration.icon;
                const isActive = emailProvider === integration.id && isConnected;
                
                return (
                  <div 
                    key={integration.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      isActive ? 'border-green-500 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Setup: {integration.setupTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant={isActive ? "outline" : "default"}
                        onClick={() => setEmailProvider(integration.id)}
                      >
                        {isActive ? 'Manage' : 'Select'}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}