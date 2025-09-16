import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useTenant } from '@/hooks/useTenant';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Table, 
  Users, 
  Building2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface TableInfo {
  table_name: string;
  row_count: number;
}

const DatabaseDiagnosticPage = () => {
  const { toast } = useToast();
  const { environment } = useEnvironment();
  const { tenant, loading: tenantLoading } = useTenant();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);

  const checkConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.from('tenants').select('count').limit(1);
      if (error) throw error;
      
      setConnectionStatus('connected');
      toast({
        title: "Connection Test Successful",
        description: "Database connection is working properly",
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection Test Failed",
        description: "Unable to connect to the database",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const loadTableInfo = async () => {
    setLoadingTables(true);
    try {
      const { data, error } = await supabase.rpc('get_table_row_counts' as any);
      
      if (error) {
        // Fallback: Get table names from information_schema
        const { data: tableData, error: tableError } = await supabase
          .from('information_schema.tables' as any)
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE_TABLE');

        if (tableError) throw tableError;
        
        // For now, just show table names without counts since RPC might not exist
        setTables((tableData || []).map((table: any) => ({
          table_name: table.table_name,
          row_count: 0
        })));
      } else {
        setTables(data || []);
      }
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to load table info:', error);
      setConnectionStatus('error');
      toast({
        title: "Failed to Load Table Information",
        description: "Could not retrieve database table information",
        variant: "destructive",
      });
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    loadTableInfo();
  }, []);

  const tablesWithData = tables.filter(table => table.row_count > 0);
  const totalRows = tables.reduce((sum, table) => sum + table.row_count, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Diagnostics
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor database connection status and data overview
          </p>
        </div>
        <Button 
          onClick={checkConnection} 
          disabled={testingConnection}
          variant="outline"
        >
          {testingConnection && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Test Connection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {connectionStatus === 'checking' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm">Checking...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Error</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={environment === 'production' ? 'default' : 'secondary'}>
              {environment}
            </Badge>
          </CardContent>
        </Card>

        {/* Tenant Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">
                {tenantLoading ? 'Loading...' : tenant?.name || 'No tenant'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Records */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-semibold">{totalRows.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Database Configuration</CardTitle>
          <CardDescription>
            Supabase connection details for PSA | MYTE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Project URL</label>
              <p className="text-sm text-muted-foreground font-mono">
                https://ghczhzfywivhrcvncffl.supabase.co
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Project ID</label>
              <p className="text-sm text-muted-foreground font-mono">
                ghczhzfywivhrcvncffl
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Client Location</label>
              <p className="text-sm text-muted-foreground">
                src/integrations/supabase/client.ts
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Types Location</label>
              <p className="text-sm text-muted-foreground">
                src/integrations/supabase/types.ts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Database Tables ({tables.length})
          </CardTitle>
          <CardDescription>
            Overview of all database tables and their record counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTables ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading table information...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tables with Data */}
              {tablesWithData.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Tables with Data ({tablesWithData.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tablesWithData.map((table) => (
                      <div
                        key={table.table_name}
                        className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
                      >
                        <span className="font-mono text-sm">{table.table_name}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {table.row_count} rows
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Empty Tables */}
              <div>
                <h3 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Empty Tables ({tables.length - tablesWithData.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                  {tables
                    .filter(table => table.row_count === 0)
                    .map((table) => (
                      <div
                        key={table.table_name}
                        className="p-2 border rounded text-center"
                      >
                        <span className="font-mono text-xs text-muted-foreground">
                          {table.table_name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Working Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Features
          </CardTitle>
          <CardDescription>
            Database-backed features currently working in the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Authentication & Tenancy</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• User authentication via Supabase Auth</li>
                <li>• Multi-tenant data isolation</li>
                <li>• User profiles and roles</li>
                <li>• Session management</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Client Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Client CRUD operations</li>
                <li>• Contact management</li>
                <li>• Client data with RLS</li>
                <li>• Demo data generation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Assessment System</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Assessment templates</li>
                <li>• Question management</li>
                <li>• Response tracking</li>
                <li>• Report generation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Contract Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Contract templates</li>
                <li>• Pricing rules</li>
                <li>• Approval workflows</li>
                <li>• Audit trails</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseDiagnosticPage;