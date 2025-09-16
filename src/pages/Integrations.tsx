import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  DollarSign, 
  Mail, 
  CreditCard, 
  Users, 
  FileText,
  Shield,
  Zap,
  Database,
  ArrowRightLeft,
  CloudDownload,
  MessageSquare,
  Phone,
  Calendar,
  Package,
  Activity,
  Lock,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Import integration components
import PSAMigration from '@/components/Integrations/PSAMigration';
import { useIntegrations } from '@/hooks/useIntegrations';

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { integrations, loading, connectIntegration, disconnectIntegration } = useIntegrations();

  // Map integrations from hook to include UI-specific properties
  const staticIntegrations = integrations.map(integration => ({
    ...integration,
    icon: getIconForIntegration(integration.id),
    badge: getBadgeForIntegration(integration.id)
  }));

  // Helper functions for UI properties
  function getIconForIntegration(id: string) {
    const iconMap: Record<string, any> = {
      'connectwise': ArrowRightLeft,
      'kaseya': Database,
      'syncro': CloudDownload,
      'atera': Database,
      'qbo': DollarSign,
      'pcbancard': CreditCard,
      'smtp2go': Mail,
      'teams': MessageSquare,
      'slack': MessageSquare,
      'twilio': Phone,
      'azure_ad': Shield,
      'office365': Calendar,
      'sharepoint': FileText,
      'ninja_rmm': Activity,
      'connectwise_automate': Zap,
      'datto_rmm': Activity,
      'duo': Lock,
      'knowbe4': Shield,
      'huntress': Shield,
      'ingram': Package,
      'td_synnex': Package,
      'pax8': CloudDownload
    };
    return iconMap[id] || Settings;
  }

  function getBadgeForIntegration(id: string) {
    const badgeMap: Record<string, string> = {
      'connectwise': 'Migration Tool',
      'kaseya': 'Migration Tool',
      'syncro': 'Migration Tool',
      'atera': 'Migration Tool',
      'qbo': 'Popular',
      'pcbancard': 'Recommended'
    };
    return badgeMap[id];
  }

  const filteredIntegrations = staticIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'connected': return 'default';
      case 'available': return 'secondary';
      case 'coming_soon': return 'outline';
      default: return 'secondary';
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'migration': 'PSA Migration',
      'financial': 'Financial',
      'communication': 'Communication',
      'microsoft': 'Microsoft',
      'rmm': 'RMM Tools',
      'security': 'Security',
      'vendors': 'Vendors'
    };
    return names[category] || category;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite tools, migrate from existing PSAs, and streamline your MSP operations
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="overview">All</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="communication">Comm</TabsTrigger>
          <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
          <TabsTrigger value="rmm">RMM</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab - All Integrations */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Featured Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Featured Integrations</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredIntegrations
                  .filter(i => ['pcbancard', 'qbo', 'connectwise'].includes(i.id))
                  .map((integration) => (
                    <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <integration.icon className="h-5 w-5" />
                            {integration.name}
                          </span>
                          <div className="flex gap-1">
                            {integration.badge && (
                              <Badge variant="default" className="text-xs">
                                {integration.badge}
                              </Badge>
                            )}
                            <Badge variant={getStatusColor(integration.status)}>
                              {integration.status === 'connected' ? 'Connected' :
                               integration.status === 'available' ? 'Available' :
                               'Coming Soon'}
                            </Badge>
                          </div>
                        </CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => setActiveTab(integration.category)}
                          variant={integration.status === 'connected' ? 'default' : 'outline'}
                          className="w-full"
                          disabled={integration.status === 'coming_soon'}
                        >
                          {integration.status === 'connected' ? 'Manage' :
                           integration.status === 'available' ? 'Connect' :
                           'Coming Soon'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* All Integrations by Category */}
            {['migration', 'financial', 'communication', 'microsoft', 'rmm', 'security', 'vendors'].map(category => {
              const categoryIntegrations = filteredIntegrations.filter(i => i.category === category);
              if (categoryIntegrations.length === 0) return null;
              
              return (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4">{getCategoryName(category)}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryIntegrations.map((integration) => (
                      <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <integration.icon className="h-5 w-5" />
                              {integration.name}
                            </span>
                            <Badge variant={getStatusColor(integration.status)}>
                              {integration.status === 'connected' ? 'Connected' :
                               integration.status === 'available' ? 'Available' :
                               'Soon'}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => setActiveTab(integration.category)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={integration.status === 'coming_soon'}
                          >
                            {integration.status === 'connected' ? 'Manage' :
                             integration.status === 'available' ? 'View Details' :
                             'Notify Me'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* PSA Migration Tab */}
        <TabsContent value="migration">
          <PSAMigration />
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QuickBooks Online</CardTitle>
                <CardDescription>
                  Sync invoices, payments, and financial data automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Connect to QuickBooks</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>PCBancard Payment Processing</CardTitle>
                <CardDescription>
                  Accept payments with dual pricing and platform billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Setup PCBancard</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle>Communication Tools</CardTitle>
              <CardDescription>
                Email automation, SMS notifications, and team collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>SMTP2GO Email Service</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Microsoft Teams Integration</span>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Slack Notifications</span>
                  <Button variant="outline" size="sm">Setup</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Microsoft Tab */}
        <TabsContent value="microsoft">
          <Card>
            <CardHeader>
              <CardTitle>Microsoft Integrations</CardTitle>
              <CardDescription>
                Microsoft 365, Azure AD, and Teams integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Azure Active Directory</span>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Microsoft 365</span>
                  <Button variant="outline" size="sm">Setup</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RMM Tab */}
        <TabsContent value="rmm">
          <Card>
            <CardHeader>
              <CardTitle>RMM Tool Integrations</CardTitle>
              <CardDescription>
                Connect your remote monitoring and management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>NinjaOne RMM</span>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>ConnectWise Automate</span>
                  <Button variant="outline" size="sm">Setup</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Compliance</CardTitle>
              <CardDescription>
                Two-factor authentication and security monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Duo Security</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Manage global integration settings, webhooks, and API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Webhook URL</h3>
                <div className="flex gap-2">
                  <code className="bg-muted p-2 rounded text-sm flex-1">
                    {window.location.origin}/api/webhooks
                  </code>
                  <Button variant="outline" size="sm">Copy</Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">API Access</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Key</span>
                    <Button variant="outline" size="sm">Generate New Key</Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rate Limit</span>
                    <span className="text-sm text-muted-foreground">1000 requests/hour</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Connected Integrations</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      QuickBooks Online
                    </span>
                    <Button variant="ghost" size="sm">Disconnect</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}