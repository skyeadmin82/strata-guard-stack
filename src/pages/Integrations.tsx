import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
  CheckCircle,
  ExternalLink
} from 'lucide-react';

// Import integration components
import QBOIntegration from '@/components/Integrations/QBOIntegration';
import PCBancardIntegration from '@/components/Integrations/PCBancardIntegration';
import PSAMigration from '@/components/Integrations/PSAMigration';
import EmailIntegration from '@/components/Integrations/EmailIntegration';
import MicrosoftIntegration from '@/components/Integrations/MicrosoftIntegration';
import SecurityIntegration from '@/components/Integrations/SecurityIntegration';
import CommunicationIntegration from '@/components/Integrations/CommunicationIntegration';
import RMMIntegration from '@/components/Integrations/RMMIntegration';

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
      badge: 'Migration Tool',
      setupTime: '30 min'
    },
    {
      id: 'kaseya',
      name: 'Kaseya BMS',
      description: 'Import data from Kaseya Business Management Suite',
      icon: Database,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool',
      setupTime: '45 min'
    },
    {
      id: 'syncro',
      name: 'SyncroMSP',
      description: 'Migrate from SyncroMSP with full data transfer',
      icon: CloudDownload,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool',
      setupTime: '25 min'
    },
    {
      id: 'atera',
      name: 'Atera',
      description: 'Import clients, tickets, and contracts from Atera',
      icon: Database,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool',
      setupTime: '35 min'
    },
    {
      id: 'autotask',
      name: 'Autotask PSA',
      description: 'Complete migration from Datto Autotask PSA',
      icon: ArrowRightLeft,
      status: 'available',
      category: 'migration',
      badge: 'Migration Tool',
      setupTime: '40 min'
    },

    // Payment Processing
    {
      id: 'pcbancard',
      name: 'PCBancard',
      description: 'Accept credit card payments and process transactions',
      icon: CreditCard,
      status: 'available',
      category: 'payment',
      badge: 'Payment Gateway',
      setupTime: '15 min'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Online payment processing with recurring billing',
      icon: DollarSign,
      status: 'available',
      category: 'payment',
      badge: 'Payment Gateway',
      setupTime: '10 min'
    },
    {
      id: 'square',
      name: 'Square',
      description: 'In-person and online payment processing',
      icon: CreditCard,
      status: 'available',
      category: 'payment',
      badge: 'Payment Gateway',
      setupTime: '15 min'
    },
    {
      id: 'authorize-net',
      name: 'Authorize.Net',
      description: 'Secure payment gateway for online transactions',
      icon: Shield,
      status: 'available',
      category: 'payment',
      badge: 'Payment Gateway',
      setupTime: '20 min'
    },

    // Accounting & Financial
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      description: 'Sync invoices, customers, and financial data',
      icon: FileText,
      status: 'connected',
      category: 'accounting',
      badge: 'Accounting',
      setupTime: '20 min'
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Cloud accounting platform integration',
      icon: Database,
      status: 'available',
      category: 'accounting',
      badge: 'Accounting',
      setupTime: '25 min'
    },

    // Communication & Marketing
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Email marketing and customer communication',
      icon: Mail,
      status: 'available',
      category: 'communication',
      badge: 'Marketing',
      setupTime: '10 min'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS and voice communication platform',
      icon: Phone,
      status: 'available',
      category: 'communication',
      badge: 'Communication',
      setupTime: '15 min'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and notifications',
      icon: MessageSquare,
      status: 'available',
      category: 'communication',
      badge: 'Communication',
      setupTime: '5 min'
    },

    // Microsoft Ecosystem
    {
      id: 'microsoft-365',
      name: 'Microsoft 365',
      description: 'Email, calendar, and document integration',
      icon: Calendar,
      status: 'available',
      category: 'productivity',
      badge: 'Microsoft',
      setupTime: '30 min'
    },
    {
      id: 'azure-ad',
      name: 'Azure Active Directory',
      description: 'Identity and access management integration',
      icon: Shield,
      status: 'available',
      category: 'security',
      badge: 'Microsoft',
      setupTime: '45 min'
    },

    // RMM & Security
    {
      id: 'ninja-rmm',
      name: 'NinjaOne RMM',
      description: 'Remote monitoring and management integration',
      icon: Activity,
      status: 'available',
      category: 'rmm',
      badge: 'RMM',
      setupTime: '35 min'
    },
    {
      id: 'sentinel-one',
      name: 'SentinelOne',
      description: 'Endpoint protection and threat detection',
      icon: Shield,
      status: 'available',
      category: 'security',
      badge: 'Security',
      setupTime: '40 min'
    },
    {
      id: 'crowdstrike',
      name: 'CrowdStrike',
      description: 'Advanced endpoint protection platform',
      icon: Lock,
      status: 'available',
      category: 'security',
      badge: 'Security',
      setupTime: '45 min'
    }
  ];

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'available':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'available': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getCategoryIntegrations = (category: string) => 
    filteredIntegrations.filter(integration => integration.category === category);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">MSP Integration Hub</h1>
              <p className="text-muted-foreground">
                Connect your business systems, migrate data, and process payments seamlessly
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-80"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integrations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available platforms
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
                  {integrations.filter(i => i.status === 'connected').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active connections
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Migration Tools</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getCategoryIntegrations('migration').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  PSA migration options
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Gateways</CardTitle>
                <CreditCard className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getCategoryIntegrations('payment').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Payment processors
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="migration">Migration</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="accounting">Accounting</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="rmm">RMM</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredIntegrations.map((integration) => {
                  const IconComponent = integration.icon;
                  return (
                    <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{integration.name}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={getStatusColor(integration.status)}>
                                  {integration.badge}
                                </Badge>
                                {getStatusIcon(integration.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardDescription>{integration.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Setup: {integration.setupTime}
                          </span>
                          <Button 
                            variant={integration.status === 'connected' ? 'outline' : 'default'}
                            size="sm"
                          >
                            {integration.status === 'connected' ? 'Manage' : 'Connect'}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* PSA Migration Tab */}
            <TabsContent value="migration" className="space-y-6">
              <PSAMigration integrations={getCategoryIntegrations('migration')} />
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-6">
              <PCBancardIntegration integrations={getCategoryIntegrations('payment')} />
            </TabsContent>

            {/* Accounting Tab */}
            <TabsContent value="accounting" className="space-y-6">
              <QBOIntegration integrations={getCategoryIntegrations('accounting')} />
            </TabsContent>

            {/* Communication Tab */}
            <TabsContent value="communication" className="space-y-6">
              <div className="grid gap-6">
                <EmailIntegration integrations={getCategoryIntegrations('communication')} />
                <CommunicationIntegration integrations={getCategoryIntegrations('communication')} />
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <SecurityIntegration integrations={getCategoryIntegrations('security')} />
            </TabsContent>

            {/* RMM Tab */}
            <TabsContent value="rmm" className="space-y-6">
              <RMMIntegration integrations={getCategoryIntegrations('rmm')} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}