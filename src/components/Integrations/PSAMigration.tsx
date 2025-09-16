import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Database,
  ArrowRightLeft,
  CloudDownload,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Package,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Upload
} from 'lucide-react';

interface PSAMigrationProps {
  integrations: any[];
}

export default function PSAMigration({ integrations }: PSAMigrationProps) {
  const [selectedPSA, setSelectedPSA] = useState('');
  const [migrationConfig, setMigrationConfig] = useState({
    apiUrl: '',
    apiKey: '',
    username: '',
    password: '',
    companyId: ''
  });
  const [selectedData, setSelectedData] = useState({
    clients: true,
    tickets: true,
    invoices: true,
    contracts: true,
    contacts: true,
    products: false,
    timeEntries: false
  });
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'analyzing' | 'migrating' | 'completed' | 'error'>('idle');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);
  const { toast } = useToast();

  const handleStartAnalysis = async () => {
    if (!selectedPSA) {
      toast({
        title: 'PSA Required',
        description: 'Please select a PSA system to migrate from.',
        variant: 'destructive',
      });
      return;
    }

    setMigrationStatus('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('psa-migration', {
        body: {
          action: 'analyze',
          psa_type: selectedPSA,
          config: migrationConfig,
          data_types: selectedData
        }
      });

      if (error) throw error;

      setMigrationResults(data);
      toast({
        title: 'Analysis Complete',
        description: 'Migration analysis completed successfully.',
      });
    } catch (error: any) {
      setMigrationStatus('error');
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze PSA data.',
        variant: 'destructive',
      });
    }
  };

  const handleStartMigration = async () => {
    setMigrationStatus('migrating');
    setMigrationProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('psa-migration', {
        body: {
          action: 'migrate',
          psa_type: selectedPSA,
          config: migrationConfig,
          data_types: selectedData
        }
      });

      if (error) throw error;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setMigrationStatus('completed');
            toast({
              title: 'Migration Complete',
              description: 'Data migration completed successfully.',
            });
            return 100;
          }
          return prev + 10;
        });
      }, 1000);

    } catch (error: any) {
      setMigrationStatus('error');
      toast({
        title: 'Migration Failed',
        description: error.message || 'Failed to migrate PSA data.',
        variant: 'destructive',
      });
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'clients': return Users;
      case 'tickets': return FileText;
      case 'invoices': return DollarSign;
      case 'contracts': return FileText;
      case 'contacts': return Users;
      case 'products': return Package;
      case 'timeEntries': return Calendar;
      default: return Database;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'migrating': return 'text-blue-500';
      case 'error': return 'text-red-500';
      case 'analyzing': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PSA Migration Hub</h2>
          <p className="text-muted-foreground">
            Migrate your data from existing PSA systems seamlessly
          </p>
        </div>
        <Badge variant={migrationStatus === 'completed' ? 'default' : 'secondary'}>
          {migrationStatus.charAt(0).toUpperCase() + migrationStatus.slice(1)}
        </Badge>
      </div>

      {/* Migration Status */}
      {migrationStatus !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className={`h-5 w-5 ${getStatusColor(migrationStatus)}`} />
              Migration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrationStatus === 'migrating' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{migrationProgress}%</span>
                </div>
                <Progress value={migrationProgress} className="w-full" />
              </div>
            )}
            
            {migrationResults && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(migrationResults).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {key}: {value.count || 0} records
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* PSA Selection & Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Source PSA Configuration
            </CardTitle>
            <CardDescription>
              Select and configure your current PSA system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="psaSelect">Source PSA System</Label>
              <Select value={selectedPSA} onValueChange={setSelectedPSA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your current PSA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connectwise">ConnectWise Manage</SelectItem>
                  <SelectItem value="autotask">Datto Autotask PSA</SelectItem>
                  <SelectItem value="kaseya">Kaseya BMS</SelectItem>
                  <SelectItem value="syncro">SyncroMSP</SelectItem>
                  <SelectItem value="atera">Atera</SelectItem>
                  <SelectItem value="tigerpaw">Tigerpaw</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPSA && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://api.yourdomain.com"
                    value={migrationConfig.apiUrl}
                    onChange={(e) => setMigrationConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username/Client ID</Label>
                    <Input
                      id="username"
                      value={migrationConfig.username}
                      onChange={(e) => setMigrationConfig(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password/API Key</Label>
                    <Input
                      id="password"
                      type="password"
                      value={migrationConfig.password}
                      onChange={(e) => setMigrationConfig(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                {(selectedPSA === 'connectwise' || selectedPSA === 'autotask') && (
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Company ID</Label>
                    <Input
                      id="companyId"
                      placeholder="Your company identifier"
                      value={migrationConfig.companyId}
                      onChange={(e) => setMigrationConfig(prev => ({ ...prev, companyId: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Selection
            </CardTitle>
            <CardDescription>
              Choose what data to migrate to your new system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(selectedData).map(([key, value]) => {
              const IconComponent = getDataTypeIcon(key);
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setSelectedData(prev => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <Label htmlFor={key} className="text-sm font-medium">
                      {label}
                    </Label>
                  </div>
                </div>
              );
            })}
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select the data types you want to migrate. Historical data will be preserved with original dates.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Migration Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Migration Actions
          </CardTitle>
          <CardDescription>
            Start the migration process or analyze your data first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleStartAnalysis}
              disabled={!selectedPSA || migrationStatus === 'analyzing' || migrationStatus === 'migrating'}
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              Analyze Data
            </Button>
            
            <Button 
              onClick={handleStartMigration}
              disabled={!selectedPSA || migrationStatus === 'migrating' || !migrationResults}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Start Migration
            </Button>
            
            {migrationStatus === 'completed' && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available PSA Systems */}
      <Card>
        <CardHeader>
          <CardTitle>Supported PSA Systems</CardTitle>
          <CardDescription>
            We support migration from these popular PSA platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const IconComponent = integration.icon;
              const isSelected = selectedPSA === integration.id;
              
              return (
                <div 
                  key={integration.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedPSA(integration.id)}
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
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                    <Button size="sm" variant={isSelected ? "default" : "outline"}>
                      {isSelected ? 'Configure' : 'Select'}
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