import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRightLeft, 
  Database, 
  CloudDownload,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  DollarSign,
  Package,
  Upload,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PSAMigration() {
  const [selectedPSA, setSelectedPSA] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string>('idle');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const psaSystems = [
    {
      id: 'connectwise',
      name: 'ConnectWise PSA',
      description: 'Full-featured PSA with extensive API support',
      features: ['Tickets', 'Clients', 'Invoices', 'Contracts', 'Projects', 'Time Entries'],
      apiType: 'REST API',
      logo: '/connectwise-logo.png',
      instructions: {
        api: 'Requires Company ID, Public Key, and Private Key',
        endpoint: 'https://api-na.myconnectwise.net',
        documentation: 'https://developer.connectwise.com'
      }
    },
    {
      id: 'kaseya',
      name: 'Kaseya BMS',
      description: 'Business Management Suite with comprehensive features',
      features: ['Service Desk', 'Clients', 'Billing', 'Contracts', 'Assets'],
      apiType: 'REST API',
      logo: '/kaseya-logo.png',
      instructions: {
        api: 'Requires API Key and Tenant ID',
        endpoint: 'https://api.kaseya.com',
        documentation: 'https://helpdesk.kaseya.com/hc/en-gb/articles/360000936292'
      }
    },
    {
      id: 'syncro',
      name: 'SyncroMSP',
      description: 'All-in-one RMM and PSA platform',
      features: ['Tickets', 'Customers', 'Invoices', 'Estimates', 'Assets', 'Contracts'],
      apiType: 'REST API',
      logo: '/syncro-logo.png',
      instructions: {
        api: 'Requires API Token from Syncro Admin',
        endpoint: 'https://api.syncromsp.com',
        documentation: 'https://api-docs.syncromsp.com'
      }
    },
    {
      id: 'atera',
      name: 'Atera',
      description: 'Cloud-based RMM and PSA solution',
      features: ['Tickets', 'Customers', 'Contracts', 'Knowledge Base', 'Billing'],
      apiType: 'REST API',
      logo: '/atera-logo.png',
      instructions: {
        api: 'Requires API Key from Atera Admin Portal',
        endpoint: 'https://app.atera.com/api/v3',
        documentation: 'https://app.atera.com/apidocs'
      }
    }
  ];

  const migrationSteps = [
    { id: 'connect', label: 'Connect', description: 'Authenticate with source PSA' },
    { id: 'analyze', label: 'Analyze', description: 'Scan available data' },
    { id: 'map', label: 'Map', description: 'Map fields to our schema' },
    { id: 'migrate', label: 'Migrate', description: 'Transfer data' },
    { id: 'verify', label: 'Verify', description: 'Validate migration' }
  ];

  const startMigration = async (psaId: string) => {
    setSelectedPSA(psaId);
    setMigrationStatus('connecting');
    setProgress(20);
    
    toast({
      title: 'Migration Started',
      description: `Connecting to ${psaSystems.find(p => p.id === psaId)?.name}...`,
    });

    // Simulate migration process
    setTimeout(() => {
      setProgress(40);
      setMigrationStatus('analyzing');
    }, 2000);
    
    setTimeout(() => {
      setProgress(60);
      setMigrationStatus('mapping');
    }, 4000);
    
    setTimeout(() => {
      setProgress(80);
      setMigrationStatus('migrating');
    }, 6000);
    
    setTimeout(() => {
      setProgress(100);
      setMigrationStatus('complete');
      toast({
        title: 'Migration Complete',
        description: 'Your data has been successfully migrated!',
      });
    }, 8000);
  };

  const exportData = () => {
    toast({
      title: 'Export Started',
      description: 'Preparing your data export...',
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>PSA Migration Center</CardTitle>
          <CardDescription>
            Seamlessly migrate your data from existing PSA platforms to our system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Migration Benefits:</strong>
              <ul className="list-disc list-inside mt-2">
                <li>Zero downtime - continue working while migrating</li>
                <li>Data validation and mapping assistance</li>
                <li>Automatic field matching with manual override</li>
                <li>Full audit trail of migrated data</li>
                <li>Rollback capability within 30 days</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* PSA Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Current PSA</CardTitle>
          <CardDescription>
            Choose the platform you want to migrate from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {psaSystems.map((psa) => (
              <Card key={psa.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{psa.name}</span>
                    <Badge variant="outline">{psa.apiType}</Badge>
                  </CardTitle>
                  <CardDescription>{psa.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {psa.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    {selectedPSA === psa.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>API Credentials</Label>
                          <Input 
                            placeholder={psa.instructions.api}
                            type="password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>API Endpoint</Label>
                          <Input 
                            placeholder={psa.instructions.endpoint}
                            defaultValue={psa.instructions.endpoint}
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => startMigration(psa.id)}
                        >
                          Start Migration
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedPSA(psa.id)}
                      >
                        Select {psa.name}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Migration Progress */}
      {migrationStatus !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Progress</CardTitle>
            <CardDescription>
              Migrating from {psaSystems.find(p => p.id === selectedPSA)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              
              <div className="grid grid-cols-5 gap-2">
                {migrationSteps.map((step, index) => (
                  <div key={step.id} className="text-center">
                    <div className={`
                      w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center
                      ${progress >= (index + 1) * 20 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-400'}
                    `}>
                      {progress >= (index + 1) * 20 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium">{step.label}</p>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>

              {migrationStatus === 'complete' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Migration Complete!</strong>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>✓ 245 Clients migrated</p>
                      <p>✓ 1,847 Tickets migrated</p>
                      <p>✓ 523 Invoices migrated</p>
                      <p>✓ 89 Contracts migrated</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Import/Export</CardTitle>
          <CardDescription>
            Use CSV files for manual data migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import">
            <TabsList>
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop CSV files here, or click to browse
                </p>
                <Button variant="outline">
                  Select Files
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Client Template
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Ticket Template
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clients
                  </span>
                  <Button size="sm" variant="outline" onClick={exportData}>
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tickets
                  </span>
                  <Button size="sm" variant="outline" onClick={exportData}>
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Invoices
                  </span>
                  <Button size="sm" variant="outline" onClick={exportData}>
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Contracts
                  </span>
                  <Button size="sm" variant="outline" onClick={exportData}>
                    Export
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}