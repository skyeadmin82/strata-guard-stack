import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, FileText, DollarSign, Calendar, Building2, RotateCcw, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useEnhancedContractManagement, EnhancedContract } from '@/hooks/useEnhancedContractManagement';
import { ContractDialog } from '@/components/Contracts/ContractDialog';
import { RenewalReminders } from '@/components/Contracts/RenewalReminders';

export const ContractsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<EnhancedContract | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    contracts,
    stats,
    loading,
    selectedContracts,
    bulkRenewalAction,
    toggleContractSelection,
    selectAllContracts,
    clearSelection
  } = useEnhancedContractManagement();

  const handleBulkRenewal = async () => {
    if (selectedContracts.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select contracts to renew',
        variant: 'destructive',
      });
      return;
    }
    
    await bulkRenewalAction(selectedContracts, 12);
  };

  const handleViewContract = (contract: EnhancedContract) => {
    setSelectedContract(contract);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleCreateContract = () => {
    setSelectedContract(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

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
          <div className="flex gap-2">
            {selectedContracts.length > 0 && (
              <Button variant="outline" onClick={handleBulkRenewal}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Bulk Renew ({selectedContracts.length})
              </Button>
            )}
            <Button onClick={handleCreateContract}>
              <Plus className="w-4 h-4 mr-2" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_contracts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_contracts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_value, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiring_soon}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renewal Revenue</CardTitle>
              <RotateCcw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.renewal_revenue, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Profitability</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_profitability.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Renewal Reminders */}
        <RenewalReminders 
          contracts={contracts} 
          onViewContract={handleViewContract}
        />

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

            {/* Bulk Actions */}
            {selectedContracts.length > 0 && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedContracts.length} contract(s) selected
                </span>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear Selection
                </Button>
                <Button size="sm" onClick={handleBulkRenewal}>
                  Bulk Renew
                </Button>
              </div>
            )}

            {/* Contracts Table */}
            {filteredContracts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedContracts.length === filteredContracts.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllContracts();
                            } else {
                              clearSelection();
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Profitability</TableHead>
                      <TableHead>Renewal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow key={contract.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedContracts.includes(contract.id)}
                            onCheckedChange={() => toggleContractSelection(contract.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell 
                          className="font-medium cursor-pointer"
                          onClick={() => handleViewContract(contract)}
                        >
                          {contract.contract_number}
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() => handleViewContract(contract)}
                        >
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
                          <div>
                            <div className="font-medium">
                              {formatCurrency(contract.total_value || 0, contract.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(contract.monthly_revenue || 0, contract.currency)}/mo
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                            <span className="text-sm font-medium">
                              {contract.profitability_score?.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contract.days_until_renewal !== null ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={contract.renewal_risk === 'high' ? 'destructive' : 
                                              contract.renewal_risk === 'medium' ? 'secondary' : 'default'}>
                                {contract.days_until_renewal}d
                              </Badge>
                              {contract.auto_renewal && (
                                <RotateCcw className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                <Button onClick={handleCreateContract}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Contract
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Dialog */}
      <ContractDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contract={selectedContract}
        mode={dialogMode}
      />
    </DashboardLayout>
  );
};