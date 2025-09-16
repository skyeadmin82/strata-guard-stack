import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Phone,
  Video,
  Bell,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Send,
  TrendingUp,
  Clock
} from 'lucide-react';

interface CommunicationIntegrationProps {
  integrations: any[];
}

export default function CommunicationIntegration({ integrations }: CommunicationIntegrationProps) {
  const [communicationStats, setCommicationStats] = useState({
    messagesExchanged: 0,
    callsConnected: 0,
    meetingsScheduled: 0,
    responseTime: 0
  });
  const [connections, setConnections] = useState({
    slack: false,
    teams: false,
    twilio: false,
    zoom: false,
    discord: false
  });
  const [configs, setConfigs] = useState({
    slack: { webhook: '', token: '' },
    teams: { webhook: '', tenantId: '' },
    twilio: { accountSid: '', authToken: '', phoneNumber: '' },
    zoom: { apiKey: '', apiSecret: '' },
    discord: { webhook: '', botToken: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnections();
    loadCommunicationStats();
  }, []);

  const checkConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'communication_integration')
        .single();

      if (data?.settings && typeof data.settings === 'object' && 'communication' in data.settings) {
        const settings = data.settings as any;
        if (settings.communication) {
          setConnections(prev => ({
            ...prev,
            ...settings.communication.connections
          }));
          setConfigs(prev => ({
            ...prev,
            ...settings.communication.configs
          }));
        }
      }
    } catch (error) {
      console.error('Error checking communication connections:', error);
    }
  };

  const loadCommunicationStats = async () => {
    // In a real implementation, this would fetch actual communication statistics
    setCommicationStats({
      messagesExchanged: 3247,
      callsConnected: 189,
      meetingsScheduled: 67,
      responseTime: 2.3
    });
  };

  const handleConnect = async (service: string) => {
    setIsLoading(true);
    try {
      const config = configs[service as keyof typeof configs];
      
      const { error } = await supabase.functions.invoke('communication-integration', {
        body: {
          action: 'connect',
          service: service,
          config: config
        }
      });

      if (error) throw error;

      setConnections(prev => ({ ...prev, [service]: true }));
      await saveConfig();
      toast({
        title: 'Integration Connected',
        description: `Successfully connected to ${service}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Connection Error',
        description: error.message || `Failed to connect to ${service}.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (service: string) => {
    try {
      const { error } = await supabase.functions.invoke('communication-integration', {
        body: {
          action: 'test',
          service: service
        }
      });

      if (error) throw error;

      toast({
        title: 'Test Successful',
        description: `Test message sent via ${service}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message || 'Test failed.',
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
        category: 'communication_integration',
        tenant_id: userProfile.tenant_id,
        settings: {
          communication: {
            connections: connections,
            configs: configs,
            updated_at: new Date().toISOString()
          }
        }
      };

      const { data: existingRecord } = await supabase
        .from('company_settings')
        .select('id')
        .eq('category', 'communication_integration')
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
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const communicationPlatforms = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team messaging and collaboration platform',
      icon: MessageSquare,
      category: 'Team Chat',
      features: ['Channel notifications', 'Direct messaging', 'File sharing', 'Bot integration'],
      configFields: [
        { key: 'webhook', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/...' },
        { key: 'token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' }
      ]
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Microsoft collaboration platform',
      icon: Users,
      category: 'Team Chat',
      features: ['Team notifications', 'Meeting integration', 'File collaboration', 'Channel management'],
      configFields: [
        { key: 'webhook', label: 'Webhook URL', type: 'url', placeholder: 'https://outlook.office.com/...' },
        { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Your tenant ID' }
      ]
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS and voice communication platform',
      icon: Phone,
      category: 'Voice & SMS',
      features: ['SMS notifications', 'Voice calls', 'Phone verification', 'Automated messaging'],
      configFields: [
        { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'AC...' },
        { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'Your auth token' },
        { key: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '+1234567890' }
      ]
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Video conferencing and meeting platform',
      icon: Video,
      category: 'Video Conferencing',
      features: ['Meeting scheduling', 'Video calls', 'Screen sharing', 'Recording integration'],
      configFields: [
        { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Your Zoom API key' },
        { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Your API secret' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Communication Integration Hub</h2>
          <p className="text-muted-foreground">
            Connect team communication and notification platforms
          </p>
        </div>
      </div>

      {/* Communication Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.messagesExchanged.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Connected</CardTitle>
            <Phone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.callsConnected}</div>
            <p className="text-xs text-muted-foreground">
              Voice & video calls
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Video className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.meetingsScheduled}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.responseTime}min</div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Platforms */}
      <div className="grid gap-6">
        {communicationPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          const isConnected = connections[platform.id as keyof typeof connections];
          const config = configs[platform.id as keyof typeof configs];
          
          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                      {isConnected ? 'Connected' : 'Available'}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {platform.category}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {platform.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    {platform.configFields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${platform.id}-${field.key}`} className="text-xs">
                          {field.label}
                        </Label>
                        <Input
                          id={`${platform.id}-${field.key}`}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={config?.[field.key as keyof typeof config] || ''}
                          onChange={(e) => setConfigs(prev => ({
                            ...prev,
                            [platform.id]: {
                              ...prev[platform.id as keyof typeof prev],
                              [field.key]: e.target.value
                            }
                          }))}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {isConnected ? (
                    <>
                      <Button 
                        onClick={() => handleTestConnection(platform.id)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Test
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(platform.id)}
                      disabled={isLoading}
                    >
                      Connect {platform.name}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Integration Benefits</CardTitle>
          <CardDescription>
            How integrated communications improve your MSP operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Automated Notifications</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Ticket status updates via Slack/Teams</li>
                <li>• Critical alert notifications via SMS</li>
                <li>• Scheduled maintenance reminders</li>
                <li>• Client communication automation</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Team Collaboration</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Centralized team communication</li>
                <li>• Automated meeting scheduling</li>
                <li>• File sharing and collaboration</li>
                <li>• Multi-channel support workflows</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}