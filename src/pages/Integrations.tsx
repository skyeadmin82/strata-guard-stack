import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Mail, 
  CreditCard, 
  Shield,
  Database,
  ArrowRightLeft,
  MessageSquare,
  Calendar,
  Activity,
  Search,
  CheckCircle
} from 'lucide-react';

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const integrations = [
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
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Team collaboration and ticket notifications',
      icon: MessageSquare,
      status: 'available',
      category: 'microsoft'
    },
    {
      id: 'azure_ad',
      name: 'Azure Active Directory',
      description: 'Single sign-on and user management',
      icon: Shield,
      status: 'available',
      category: 'microsoft'
    }
  ];

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite tools, migrate from existing PSAs, and streamline your MSP operations
        </p>
      </div>

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
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">All</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <integration.icon className="h-5 w-5" />
                      {integration.name}
                    </span>
                    <Badge variant="secondary">Available</Badge>
                  </CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="migration">
          <Card>
            <CardHeader>
              <CardTitle>PSA Migration Tools</CardTitle>
              <CardDescription>Migrate from existing PSA platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Migration tools will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Integrations</CardTitle>
              <CardDescription>Payment processing and accounting integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Financial integrations will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="microsoft">
          <Card>
            <CardHeader>
              <CardTitle>Microsoft Integrations</CardTitle>
              <CardDescription>Microsoft 365 and Azure integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Microsoft integrations will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}