import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, FileText, DollarSign, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description?: string;
  contract_type: string;
  status: string;
  total_value?: number;
  currency: string;
  start_date: string;
  end_date?: string;
  client_id: string;
  clients?: { name: string } | null;
  created_at: string;
}

export const ContractsPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchContracts = async () => {
    try {
      // Fetch contracts and clients separately since there are no FK constraints
      const [contractsResult, clientsResult] = await Promise.all([
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name')
      ]);

      if (contractsResult.error) throw contractsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      // Manually join the data
      const contractsWithClients = contractsResult.data?.map(contract => ({
        ...contract,
        clients: clientsResult.data?.find(client => client.id === contract.client_id) || null
      })) || [];

      setContracts(contractsWithClients as unknown as Contract[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contracts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch = 
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'expired': return 'destructive';
      case 'terminated': return 'destructive';
      case 'pending_approval': return 'outline';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading contracts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contracts</h1>
            <p className="text-muted-foreground">Manage client contracts and agreements</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Contract
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contracts.filter(c => c.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  contracts.reduce((sum, contract) => sum + (contract.total_value || 0), 0),
                  'USD'
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contracts.filter(c => c.status === 'pending_approval').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contracts Table */}
            {filteredContracts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow 
                        key={contract.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          // Primary action: View/Edit contract
                          console.log('View contract:', contract.id);
                        }}
                      >
                        <TableCell className="font-medium">
                          {contract.contract_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contract.title}</div>
                            {contract.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {contract.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            {contract.clients?.name || 'Unknown Client'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {contract.contract_type?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(contract.status)}>
                            {contract.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(contract.total_value || 0, contract.currency)}
                        </TableCell>
                        <TableCell>
                          {contract.start_date ? format(new Date(contract.start_date), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {contract.end_date ? format(new Date(contract.end_date), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No contracts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No contracts match your current filters'
                    : 'Get started by creating your first contract'
                  }
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contract
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};