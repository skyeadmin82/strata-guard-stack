import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  Settings,
  TrendingUp,
  Users,
  Server,
  Zap,
  ExternalLink
} from 'lucide-react';

interface SecurityIntegrationProps {
  integrations: any[];
}

export default function SecurityIntegration({ integrations }: SecurityIntegrationProps) {
  const [securityStats, setSecurityStats] = useState({
    protectedEndpoints: 0,
    threatsBlocked: 0,
    securityAlerts: 0,
    complianceScore: 0
  });
  const [connections, setConnections] = useState({
    sentinelone: false,
    crowdstrike: false,
    defender: false,
    bitdefender: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnections();
    loadSecurityStats();
  }, []);

  const checkConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'security_integration')
        .single();

      if (data?.settings && typeof data.settings === 'object' && 'security' in data.settings) {
        const settings = data.settings as any;
        if (settings.security) {
          setConnections(prev => ({
            ...prev,
            ...settings.security
          }));
        }
      }
    } catch (error) {
      console.error('Error checking security connections:', error);
    }
  };

  const loadSecurityStats = async () => {
    // In a real implementation, this would fetch actual security statistics
    setSecurityStats({
      protectedEndpoints: 247,
      threatsBlocked: 1532,
      securityAlerts: 12,
      complianceScore: 94
    });
  };

  const handleConnect = async (service: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-integration', {
        body: {
          action: 'connect',
          service: service
        }
      });

      if (error) throw error;

      setConnections(prev => ({ ...prev, [service]: true }));
      toast({
        title: 'Security Integration Connected',
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

  const securitySolutions = [
    {
      id: 'sentinelone',
      name: 'SentinelOne',
      description: 'AI-powered endpoint protection and response',
      icon: Shield,
      features: ['Real-time threat detection', 'Automated response', 'Behavioral analysis', 'Rollback capabilities'],
      connected: connections.sentinelone,
      category: 'Endpoint Protection'
    },
    {
      id: 'crowdstrike',
      name: 'CrowdStrike Falcon',
      description: 'Cloud-native endpoint protection platform',
      icon: Lock,
      features: ['Cloud-native architecture', 'Threat intelligence', 'Incident response', 'Zero-day protection'],
      connected: connections.crowdstrike,
      category: 'Endpoint Protection'
    },
    {
      id: 'defender',
      name: 'Microsoft Defender',
      description: 'Microsoft comprehensive security solution',
      icon: Shield,
      features: ['Integrated security', 'Advanced threat protection', 'Identity protection', 'Cloud security'],
      connected: connections.defender,
      category: 'Microsoft Security'
    },
    {
      id: 'bitdefender',
      name: 'Bitdefender GravityZone',
      description: 'Enterprise endpoint security and management',
      icon: Lock,
      features: ['Multi-layered protection', 'Advanced threat defense', 'Network security', 'Risk analytics'],
      connected: connections.bitdefender,
      category: 'Endpoint Protection'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Integration Hub</h2>
          <p className="text-muted-foreground">
            Connect and manage enterprise security solutions
          </p>
        </div>
        <Badge variant="destructive">
          Critical Infrastructure
        </Badge>
      </div>

      {/* Security Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Endpoints</CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.protectedEndpoints}</div>
            <p className="text-xs text-muted-foreground">
              Active protection
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.threatsBlocked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.securityAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats.complianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              Security posture
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Solutions */}
      <div className="grid gap-6 md:grid-cols-2">
        {securitySolutions.map((solution) => {
          const IconComponent = solution.icon;
          
          return (
            <Card key={solution.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{solution.name}</CardTitle>
                      <CardDescription>{solution.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={solution.connected ? 'default' : 'secondary'}>
                      {solution.connected ? 'Connected' : 'Available'}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {solution.category}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Key Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {solution.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {solution.connected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Connected and monitoring</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Dashboard
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleConnect(solution.id)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Connect {solution.name}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
          <CardDescription>
            Recommended security practices for MSP environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Endpoint Protection</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Deploy next-generation antivirus on all endpoints
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Enable real-time behavioral monitoring
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Implement automated threat response
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Regular security policy updates
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Threat Intelligence</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Continuous threat landscape monitoring
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Proactive vulnerability assessments
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Integration with threat feeds
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Incident response automation
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Reporting */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance & Reporting</CardTitle>
          <CardDescription>
            Meet regulatory requirements with automated compliance reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-medium">SOC 2</div>
              <div className="text-sm text-muted-foreground">Type II Compliant</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-medium">ISO 27001</div>
              <div className="text-sm text-muted-foreground">Certified Framework</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-medium">NIST</div>
              <div className="text-sm text-muted-foreground">Cybersecurity Framework</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="font-medium">HIPAA</div>
              <div className="text-sm text-muted-foreground">Healthcare Compliance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}