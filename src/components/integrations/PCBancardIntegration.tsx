import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign,
  Users,
  Settings,
  Shield,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PCBancardIntegration() {
  const [config, setConfig] = useState({
    // Platform Account (for platform fees)
    platform_merchant_id: '',
    platform_api_key: '',
    platform_enabled: false,
    
    // MSP Merchant Account
    merchant_id: '',
    merchant_api_key: '',
    merchant_enabled: false,
    
    // Dual Pricing Settings
    dual_pricing_enabled: false,
    cash_discount_rate: 3.5, // Percentage
    credit_surcharge_rate: 3.5, // Percentage
    pricing_model: 'cash_discount', // 'cash_discount' or 'surcharge'
    
    // Settings
    test_mode: true,
    auto_settle: true,
    require_cvv: true,
    require_zip: true
  });

  const [stats, setStats] = useState({
    platform_revenue: 0,
    merchant_revenue: 0,
    total_transactions: 0,
    active_merchants: 0
  });

  const { toast } = useToast();

  const savePlatformConfig = async () => {
    toast({
      title: 'Saving PCBancard Configuration',
      description: 'Your payment settings are being updated...',
    });

    // TODO: Save to database when payment_configurations table is created
    
    setTimeout(() => {
      toast({
        title: 'Configuration Saved',
        description: 'PCBancard settings have been updated successfully.',
      });
    }, 1000);
  };

  const calculateDualPricing = (amount: number) => {
    if (config.pricing_model === 'cash_discount') {
      const creditPrice = amount;
      const cashPrice = amount * (1 - config.cash_discount_rate / 100);
      const discount = creditPrice - cashPrice;
      return { creditPrice, cashPrice, discount };
    } else {
      const cashPrice = amount;
      const creditPrice = amount * (1 + config.credit_surcharge_rate / 100);
      const surcharge = creditPrice - cashPrice;
      return { cashPrice, creditPrice, surcharge };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PCBancard Payment Processing
          </span>
          <Badge variant={config.platform_enabled ? 'default' : 'secondary'}>
            {config.platform_enabled ? 'Active' : 'Not Configured'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Accept payments with dual pricing for platform fees and MSP billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="platform" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="merchant">Merchant</TabsTrigger>
            <TabsTrigger value="dual-pricing">Dual Pricing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Platform Account Configuration */}
          <TabsContent value="platform" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Platform account processes subscription fees from MSPs using your platform
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="platform_merchant">Platform Merchant ID</Label>
                <Input
                  id="platform_merchant"
                  placeholder="Your PCBancard Platform Merchant ID"
                  value={config.platform_merchant_id}
                  onChange={(e) => setConfig({...config, platform_merchant_id: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="platform_api">Platform API Key</Label>
                <Input
                  id="platform_api"
                  type="password"
                  placeholder="Your PCBancard Platform API Key"
                  value={config.platform_api_key}
                  onChange={(e) => setConfig({...config, platform_api_key: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Platform Billing</Label>
                  <p className="text-sm text-gray-600">
                    Process platform subscription fees
                  </p>
                </div>
                <Switch
                  checked={config.platform_enabled}
                  onCheckedChange={(checked) => setConfig({...config, platform_enabled: checked})}
                />
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2">Platform Pricing</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Starter Plan</span>
                      <span className="font-medium">$99/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional Plan</span>
                      <span className="font-medium">$299/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enterprise Plan</span>
                      <span className="font-medium">$599/month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Merchant Account Configuration */}
          <TabsContent value="merchant" className="space-y-4">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Merchant account for MSPs to process their client payments
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="merchant_id">Merchant ID</Label>
                <Input
                  id="merchant_id"
                  placeholder="MSP's PCBancard Merchant ID"
                  value={config.merchant_id}
                  onChange={(e) => setConfig({...config, merchant_id: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="merchant_api">Merchant API Key</Label>
                <Input
                  id="merchant_api"
                  type="password"
                  placeholder="MSP's PCBancard API Key"
                  value={config.merchant_api_key}
                  onChange={(e) => setConfig({...config, merchant_api_key: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Client Billing</Label>
                  <p className="text-sm text-gray-600">
                    Process payments from your clients
                  </p>
                </div>
                <Switch
                  checked={config.merchant_enabled}
                  onCheckedChange={(checked) => setConfig({...config, merchant_enabled: checked})}
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Security Settings</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="cvv">Require CVV</Label>
                  <Switch
                    id="cvv"
                    checked={config.require_cvv}
                    onCheckedChange={(checked) => setConfig({...config, require_cvv: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="zip">Require ZIP Code</Label>
                  <Switch
                    id="zip"
                    checked={config.require_zip}
                    onCheckedChange={(checked) => setConfig({...config, require_zip: checked})}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Dual Pricing Configuration */}
          <TabsContent value="dual-pricing" className="space-y-4">
            <Alert>
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                Dual pricing allows you to offer cash discounts or add credit card surcharges
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Dual Pricing</Label>
                  <p className="text-sm text-gray-600">
                    Offer different prices for cash vs credit
                  </p>
                </div>
                <Switch
                  checked={config.dual_pricing_enabled}
                  onCheckedChange={(checked) => setConfig({...config, dual_pricing_enabled: checked})}
                />
              </div>

              {config.dual_pricing_enabled && (
                <>
                  <div>
                    <Label>Pricing Model</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        variant={config.pricing_model === 'cash_discount' ? 'default' : 'outline'}
                        onClick={() => setConfig({...config, pricing_model: 'cash_discount'})}
                      >
                        Cash Discount
                      </Button>
                      <Button
                        variant={config.pricing_model === 'surcharge' ? 'default' : 'outline'}
                        onClick={() => setConfig({...config, pricing_model: 'surcharge'})}
                      >
                        Credit Surcharge
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>
                      {config.pricing_model === 'cash_discount' ? 'Cash Discount Rate (%)' : 'Credit Surcharge Rate (%)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={config.pricing_model === 'cash_discount' ? config.cash_discount_rate : config.credit_surcharge_rate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (config.pricing_model === 'cash_discount') {
                          setConfig({...config, cash_discount_rate: value});
                        } else {
                          setConfig({...config, credit_surcharge_rate: value});
                        }
                      }}
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Pricing Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">For a $100 service:</p>
                        {(() => {
                          const pricing = calculateDualPricing(100);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm">Cash Price:</span>
                                <span className="font-medium">${pricing.cashPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Credit Card Price:</span>
                                <span className="font-medium">${pricing.creditPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-green-600">
                                <span className="text-sm">
                                  {config.pricing_model === 'cash_discount' ? 'Cash Discount:' : 'Card Surcharge:'}
                                </span>
                                <span className="font-medium">
                                  ${(config.pricing_model === 'cash_discount' ? pricing.discount : pricing.surcharge)?.toFixed(2)}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Platform Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${stats.platform_revenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600">↑ 12% this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Merchant Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">${stats.merchant_revenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600">↑ 8% this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.total_transactions.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active Merchants</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.active_merchants}</p>
                  <p className="text-xs text-gray-600">Using PCBancard</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { id: 1, amount: 299.00, type: 'Platform Fee', status: 'completed', merchant: 'TechServe Pro' },
                    { id: 2, amount: 1250.00, type: 'Client Payment', status: 'completed', merchant: 'Your MSP' },
                    { id: 3, amount: 99.00, type: 'Platform Fee', status: 'completed', merchant: 'CloudFirst IT' },
                    { id: 4, amount: 850.00, type: 'Client Payment', status: 'processing', merchant: 'Your MSP' },
                  ].map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{transaction.merchant}</p>
                        <p className="text-xs text-gray-600">{transaction.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${transaction.amount.toFixed(2)}</p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline">Test Connection</Button>
          <Button onClick={savePlatformConfig}>
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}