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

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const integrations = [
    // PSA Migration Tools
    {
      id: 'connectwise',
      name: 'ConnectWise PSA',
      description: 'Migrate tickets, clients, and invoices from ConnectWise',
      icon: ArrowRightLeft,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool'
    },
    {
      id: 'kaseya',
      name: 'Kaseya BMS',
      description: 'Import data from Kaseya Business Management Suite',
      icon: Database,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool'
    },
    {
      id: 'syncro',
      name: 'SyncroMSP',
      description: 'Migrate from SyncroMSP with full data transfer',
      icon: CloudDownload,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool'
    },
    {
      id: 'atera',
      name: 'Atera',
      description: 'Import clients, tickets, and contracts from Atera',
      icon: Database,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool'
    },
    
    // Financial Integrations
    {
      id: 'qbo',
      name: 'QuickBooks Online',
      description: 'Sync invoices, payments, and financial data',
      icon: DollarSign,
      status: 'available',
      category: 'financial',
      badge: 'Popular'
    },
    {
      id: 'pcbancard',
      name: 'PCBancard',
      description: 'Accept payments with dual pricing and platform billing',
      icon: CreditCard,
      status: 'available',
      category: 'financial',
      badge: 'Recommended'
    },
    
    // Communication Tools
    {
      id: 'smtp2go',
      name: 'SMTP2GO',
      description: 'Email automation and transactional emails',
      icon: Mail,
      status: 'available',
      category: 'communication'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Team collaboration and ticket notifications',
      icon: MessageSquare,
      status: 'available',
      category: 'communication'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Real-time notifications and team updates',
      icon: MessageSquare,
      status: 'available',
      category: 'communication'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS notifications and phone integration',
      icon: Phone,
      status: 'coming_soon',
      category: 'communication'
    },
    
    // Microsoft Suite
    {
      id: 'azure_ad',
      name: 'Azure Active Directory',
      description: 'Single sign-on and user management',
      icon: Shield,
      status: 'available',
      category: 'microsoft'
    },
    {
      id: 'office365',
      name: 'Microsoft 365',
      description: 'Calendar sync, contacts, and document management',
      icon: Calendar,
      status: 'available',
      category: 'microsoft'
    },
    {
      id: 'sharepoint',
      name: 'SharePoint',
      description: 'Document storage and collaboration',
      icon: FileText,
      status: 'coming_soon',
      category: 'microsoft'
    },
    
    // RMM Tools
    {
      id: 'ninja_rmm',
      name: 'NinjaOne RMM',
      description: 'Remote monitoring and management integration',
      icon: Activity,
      status: 'available',
      category: 'rmm'
    },
    {
      id: 'connectwise_automate',
      name: 'ConnectWise Automate',
      description: 'Automate ticket creation from RMM alerts',
      icon: Zap,
      status: 'available',
      category: 'rmm'
    },
    {
      id: 'datto_rmm',
      name: 'Datto RMM',
      description: 'Sync device information and alerts',
      icon: Activity,
      status: 'coming_soon',
      category: 'rmm'
    },
    
    // Security & Compliance
    {
      id: 'duo',
      name: 'Duo Security',
      description: 'Two-factor authentication for enhanced security',
      icon: Lock,
      status: 'available',
      category: 'security'
    },
    {
      id: 'knowbe4',
      name: 'KnowBe4',
      description: 'Security training and phishing simulation',
      icon: Shield,
      status: 'coming_soon',
      category: 'security'
    },
    {
      id: 'huntress',
      name: 'Huntress',
      description: 'Managed threat detection and response',
      icon: Shield,
      status: 'coming_soon',
      category: 'security'
    },
    
    // Vendor Management
    {
      id: 'ingram',
      name: 'Ingram Micro',
      description: 'Order management and product catalog',
      icon: Package,
      status: 'coming_soon',
      category: 'vendors'
    },
    {
      id: 'td_synnex',
      name: 'TD SYNNEX',
      description: 'Distributor integration for ordering',
      icon: Package,
      status: 'coming_soon',
      category: 'vendors'
    },
    {
      id: 'pax8',
      name: 'Pax8',
      description: 'Cloud marketplace and licensing',
      icon: CloudDownload,
      status: 'coming_soon',
      category: 'vendors'
    }
  ];

  const filteredIntegrations = integrations.filter(integration =>
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
          <Card>
            <CardHeader>
              <CardTitle>PSA Migration Tools</CardTitle>
              <CardDescription>
                Migrate from existing PSA platforms with zero downtime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Migration Benefits</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Zero downtime - continue working while migrating</li>
                    <li>• Data validation and mapping assistance</li>
                    <li>• Automatic field matching with manual override</li>
                    <li>• Full audit trail of migrated data</li>
                    <li>• Rollback capability within 30 days</li>
                  </ul>
                </div>
                <Button className="w-full">Start Migration Wizard</Button>
              </div>
            </CardContent>
          </Card>
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