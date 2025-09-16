import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CreditCard,
  Settings,
  DollarSign,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Lock,
  Zap,
  TrendingUp,
  Users
} from 'lucide-react';

interface PCBancardIntegrationProps {
  integrations: any[];
}

export default function PCBancardIntegration({ integrations }: PCBancardIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [config, setConfig] = useState({
    merchantId: '',
    apiKey: '',
    secretKey: '',
    environment: 'sandbox',
    enableRecurring: true,
    autoCapture: true,
    webhookUrl: ''
  });
  const [paymentStats, setPaymentStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successRate: 0,
    failedTransactions: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
    loadConfig();
    loadPaymentStats();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'payment_gateways')
        .single();

      if (data?.settings?.pcbancard?.connected) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking PCBancard connection:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('settings')
        .eq('category', 'payment_gateways')
        .single();

      if (data?.settings?.pcbancard) {
        setConfig(prev => ({
          ...prev,
          ...data.settings.pcbancard
        }));
      }
    } catch (error) {
      console.error('Error loading PCBancard config:', error);
    }
  };

  const loadPaymentStats = async () => {
    // In a real implementation, this would fetch actual payment statistics
    setPaymentStats({
      totalTransactions: 147,
      totalAmount: 23456.78,
      successRate: 97.3,
      failedTransactions: 4
    });
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Validate configuration
      if (!config.merchantId || !config.apiKey || !config.secretKey) {
        throw new Error('Please fill in all required fields');
      }

      const { error } = await supabase.functions.invoke('payment-gateway-setup', {
        body: {
          provider: 'pcbancard',
          action: 'connect',
          config: config
        }
      });

      if (error) throw error;

      setIsConnected(true);
      toast({
        title: 'PCBancard Connected',
        description: 'Successfully connected to PCBancard payment gateway.',
      });
    } catch (error: any) {
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect to PCBancard.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTransaction = async () => {
    try {
      const { error } = await supabase.functions.invoke('payment-gateway-setup', {
        body: {
          provider: 'pcbancard',
          action: 'test_transaction',
          amount: 1.00
        }
      });

      if (error) throw error;

      toast({
        title: 'Test Successful',
        description: 'Test transaction processed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message || 'Test transaction failed.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveConfig = async () => {
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
        category: 'payment_gateways',
        tenant_id: userProfile.tenant_id,
        settings: {
          pcbancard: {
            ...config,
            connected: isConnected,
            updated_at: new Date().toISOString()
          }
        }
      };

      const { data: existingRecord } = await supabase
        .from('company_settings')
        .select('id')
        .eq('category', 'payment_gateways')
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
        description: 'PCBancard configuration has been saved successfully.',
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
          <h2 className="text-2xl font-bold">Payment Processing Hub</h2>
          <p className="text-muted-foreground">
            Configure payment gateways and process transactions securely
          </p>
        </div>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          {isConnected ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      {/* Payment Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paymentStats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Revenue processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Successful transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.failedTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Failed transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* PCBancard Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              PCBancard Configuration
            </CardTitle>
            <CardDescription>
              Configure your PCBancard payment gateway settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                type="text"
                value={config.merchantId}
                onChange={(e) => setConfig(prev => ({ ...prev, merchantId: e.target.value }))}
                placeholder="Enter your merchant ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                value={config.secretKey}
                onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                placeholder="Enter your secret key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select value={config.environment} onValueChange={(value) => 
                setConfig(prev => ({ ...prev, environment: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production (Live)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableRecurring">Enable Recurring Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Allow subscription and recurring billing
                </p>
              </div>
              <Switch
                id="enableRecurring"
                checked={config.enableRecurring}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, enableRecurring: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoCapture">Auto Capture</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically capture authorized payments
                </p>
              </div>
              <Switch
                id="autoCapture"
                checked={config.autoCapture}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, autoCapture: checked }))
                }
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} className="flex-1">
                Save Configuration
              </Button>
              {!isConnected && (
                <Button 
                  onClick={handleConnect} 
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Connecting...' : 'Test & Connect'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection Status & Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Test your payment gateway connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Connected to PCBancard</span>
                </div>
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Your payment gateway is secure and ready to process transactions.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Button onClick={handleTestTransaction} className="w-full">
                    Run Test Transaction
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Transaction History
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Not connected to PCBancard</span>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete the configuration above and test the connection.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Security Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PCI DSS Compliant</li>
                <li>• 256-bit SSL Encryption</li>
                <li>• Fraud Detection</li>
                <li>• 3D Secure Authentication</li>
                <li>• Real-time Transaction Monitoring</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Payment Gateways */}
      <Card>
        <CardHeader>
          <CardTitle>Available Payment Gateways</CardTitle>
          <CardDescription>
            Other payment processors you can integrate with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const IconComponent = integration.icon;
              const isActive = integration.id === 'pcbancard' && isConnected;
              
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
                    <Button size="sm" variant={isActive ? "outline" : "default"}>
                      {isActive ? 'Manage' : 'Setup'}
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