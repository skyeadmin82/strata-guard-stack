import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  Server,
  Monitor,
  HardDrive,
  Cpu,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Zap,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';

interface RMMIntegrationProps {
  integrations: any[];
}

export default function RMMIntegration({ integrations }: RMMIntegrationProps) {
  const [rmmStats, setRmmStats] = useState({
    monitoredDevices: 0,
    activeAlerts: 0,
    patchCompliance: 0,
    uptimeAverage: 0
  });
  const [connections, setConnections] = useState({
    ninja: false,
    connectwise: false,
    kaseya: false,
    atera: false,
    syncro: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnections();
    loadRMMStats();
  }, []);

  const checkConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'rmm_integration')
        .single();

      if (data?.settings && typeof data.settings === 'object' && 'rmm' in data.settings) {
        const settings = data.settings as any;
        if (settings.rmm) {
          setConnections(prev => ({
            ...prev,
            ...settings.rmm
          }));
        }
      }
    } catch (error) {
      console.error('Error checking RMM connections:', error);
    }
  };

  const loadRMMStats = async () => {
    // In a real implementation, this would fetch actual RMM statistics
    setRmmStats({
      monitoredDevices: 1247,
      activeAlerts: 23,
      patchCompliance: 87.5,
      uptimeAverage: 99.7
    });
  };

  const handleConnect = async (service: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rmm-integration', {
        body: {
          action: 'connect',
          service: service
        }
      });

      if (error) throw error;

      if (data.auth_url) {
        window.open(data.auth_url, '_blank', 'width=600,height=700');
        toast({
          title: 'RMM Authentication',
          description: 'Please complete authentication in the popup window.',
        });
      }

      setConnections(prev => ({ ...prev, [service]: true }));
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

  const rmmPlatforms = [
    {
      id: 'ninja',
      name: 'NinjaOne RMM',
      description: 'Comprehensive remote monitoring and management',
      icon: Activity,
      category: 'RMM Platform',
      features: ['Device monitoring', 'Patch management', 'Remote control', 'Automated maintenance'],
      connected: connections.ninja,
      metrics: {
        devices: 567,
        uptime: 99.8,
        patches: 92
      }
    },
    {
      id: 'connectwise',
      name: 'ConnectWise Automate',
      description: 'Advanced automation and monitoring platform',
      icon: Zap,
      category: 'RMM Platform',
      features: ['Automated scripting', 'Proactive monitoring', 'Patch deployment', 'Performance tracking'],
      connected: connections.connectwise,
      metrics: {
        devices: 234,
        uptime: 99.5,
        patches: 88
      }
    },
    {
      id: 'kaseya',
      name: 'Kaseya VSA',
      description: 'Integrated IT management platform',
      icon: Server,
      category: 'RMM Platform',
      features: ['Network discovery', 'Asset management', 'Security monitoring', 'Compliance reporting'],
      connected: connections.kaseya,
      metrics: {
        devices: 189,
        uptime: 99.2,
        patches: 85
      }
    },
    {
      id: 'atera',
      name: 'Atera',
      description: 'All-in-one IT management solution',
      icon: Monitor,
      category: 'RMM Platform',
      features: ['Real-time monitoring', 'Ticketing integration', 'Mobile app', 'Billing automation'],
      connected: connections.atera,
      metrics: {
        devices: 145,
        uptime: 99.6,
        patches: 90
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RMM Integration Hub</h2>
          <p className="text-muted-foreground">
            Connect and manage remote monitoring and management platforms
          </p>
        </div>
        <Badge variant="default">
          Enterprise RMM
        </Badge>
      </div>

      {/* RMM Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Devices</CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rmmStats.monitoredDevices.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rmmStats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patch Compliance</CardTitle>
            <HardDrive className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rmmStats.patchCompliance}%</div>
            <p className="text-xs text-muted-foreground">
              Up to date systems
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rmmStats.uptimeAverage}%</div>
            <p className="text-xs text-muted-foreground">
              Network availability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RMM Platforms */}
      <div className="grid gap-6 md:grid-cols-2">
        {rmmPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          
          return (
            <Card key={platform.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={platform.connected ? 'default' : 'secondary'}>
                    {platform.connected ? 'Connected' : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {platform.connected && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{platform.metrics.devices}</div>
                      <div className="text-xs text-muted-foreground">Devices</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{platform.metrics.uptime}%</div>
                      <div className="text-xs text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{platform.metrics.patches}%</div>
                      <div className="text-xs text-muted-foreground">Patches</div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Key Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {platform.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {platform.connected ? (
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
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Data
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleConnect(platform.id)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Connect {platform.name}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monitoring Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoring Categories
          </CardTitle>
          <CardDescription>
            Comprehensive monitoring across all your managed environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Cpu className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">System Performance</div>
                <div className="text-sm text-muted-foreground">CPU, RAM, Disk</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Server className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Network Monitoring</div>
                <div className="text-sm text-muted-foreground">Bandwidth, Latency</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <HardDrive className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-medium">Storage Management</div>
                <div className="text-sm text-muted-foreground">Disk usage, Health</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-medium">Alert Management</div>
                <div className="text-sm text-muted-foreground">Proactive alerts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RMM Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>RMM Best Practices</CardTitle>
          <CardDescription>
            Optimize your remote monitoring and management strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Proactive Monitoring</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Set up comprehensive monitoring thresholds
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Implement automated patch management
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Regular performance baseline reviews
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Predictive maintenance scheduling
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Automation & Efficiency</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Automated script deployment
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Real-time alert escalation
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Centralized reporting dashboards
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Integrated ticketing workflows
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}