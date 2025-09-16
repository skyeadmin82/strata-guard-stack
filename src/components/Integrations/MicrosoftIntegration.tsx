import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Mail,
  Users,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Cloud,
  Lock,
  RefreshCw as Sync
} from 'lucide-react';

interface MicrosoftIntegrationProps {
  integrations: any[];
}

export default function MicrosoftIntegration({ integrations }: MicrosoftIntegrationProps) {
  const [connections, setConnections] = useState({
    office365: false,
    azureAD: false,
    teams: false,
    onedrive: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'microsoft_integration')
        .single();

      if (data?.settings && typeof data.settings === 'object' && 'microsoft' in data.settings) {
        const settings = data.settings as any;
        setConnections(prev => ({
          ...prev,
          ...settings.microsoft
        }));
      }
    } catch (error) {
      console.error('Error checking Microsoft connections:', error);
    }
  };

  const handleConnect = async (service: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('microsoft-integration', {
        body: {
          action: 'connect',
          service: service
        }
      });

      if (error) throw error;

      if (data.auth_url) {
        window.open(data.auth_url, '_blank', 'width=600,height=700');
        toast({
          title: 'Microsoft Authentication',
          description: 'Please complete authentication in the popup window.',
        });
      }
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

  const microsoftServices = [
    {
      id: 'office365',
      name: 'Microsoft 365',
      description: 'Email, calendar, and document integration',
      icon: Mail,
      features: ['Email sync', 'Calendar integration', 'Contact management', 'Document access'],
      connected: connections.office365
    },
    {
      id: 'azureAD',
      name: 'Azure Active Directory',
      description: 'Identity and access management',
      icon: Shield,
      features: ['Single sign-on', 'User management', 'Security policies', 'Multi-factor auth'],
      connected: connections.azureAD
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Team collaboration and communication',
      icon: Users,
      features: ['Chat integration', 'Meeting notifications', 'File sharing', 'Channel sync'],
      connected: connections.teams
    },
    {
      id: 'onedrive',
      name: 'OneDrive for Business',
      description: 'Cloud storage and file management',
      icon: Cloud,
      features: ['File sync', 'Document sharing', 'Version control', 'Backup integration'],
      connected: connections.onedrive
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Microsoft Ecosystem Integration</h2>
          <p className="text-muted-foreground">
            Connect and sync with Microsoft 365, Azure AD, Teams, and more
          </p>
        </div>
        <Badge variant="secondary">
          Microsoft Partner
        </Badge>
      </div>

      {/* Connection Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{microsoftServices.length}</div>
            <p className="text-xs text-muted-foreground">
              Available integrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(connections).filter(Boolean).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Lock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Enterprise</div>
            <p className="text-xs text-muted-foreground">
              Grade security
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Sync className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">
              Data synchronization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Microsoft Services */}
      <div className="grid gap-6 md:grid-cols-2">
        {microsoftServices.map((service) => {
          const IconComponent = service.icon;
          
          return (
            <Card key={service.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={service.connected ? 'default' : 'secondary'}>
                    {service.connected ? 'Connected' : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {service.connected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Connected and syncing</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <Sync className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleConnect(service.id)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Connect to {service.name}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
          <CardDescription>
            Enterprise-grade security features and compliance standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">OAuth 2.0 Authentication</div>
                <div className="text-sm text-muted-foreground">Secure token-based auth</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Data Encryption</div>
                <div className="text-sm text-muted-foreground">End-to-end encryption</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">GDPR Compliant</div>
                <div className="text-sm text-muted-foreground">Privacy regulations</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">SOC 2 Type II</div>
                <div className="text-sm text-muted-foreground">Security certification</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Multi-Factor Auth</div>
                <div className="text-sm text-muted-foreground">Enhanced security</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Audit Logging</div>
                <div className="text-sm text-muted-foreground">Complete audit trail</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Benefits</CardTitle>
          <CardDescription>
            Why integrate with Microsoft services for your MSP business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Productivity Gains</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Unified calendar and scheduling across teams</li>
                <li>• Seamless document collaboration and sharing</li>
                <li>• Centralized communication through Teams</li>
                <li>• Automated workflow integration</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Security & Management</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Single sign-on across all applications</li>
                <li>• Centralized user and access management</li>
                <li>• Advanced threat protection integration</li>
                <li>• Compliance and data governance tools</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}