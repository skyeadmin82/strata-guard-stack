import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProposalDetailDialog } from '@/components/Proposals/ProposalDetailDialog';
import { ProposalEditDialog } from '@/components/Proposals/ProposalEditDialog';
import { ProposalTemplateManager } from '@/components/Proposals/ProposalTemplateManager';
import { ProposalAnalytics } from '@/components/Proposals/ProposalAnalytics';
import { WinLossTracker } from '@/components/Proposals/WinLossTracker';
import { Search, Plus, FileText, DollarSign, Eye, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Proposal {
  id: string;
  proposal_number: string;
  title: string;
  description?: string;
  status: string;
  total_amount?: number;
  currency: string;
  tax_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  valid_until?: string;
  sent_date?: string;
  viewed_date?: string;
  view_count?: number;
  client_id: string;
  clients?: { name: string } | null;
  created_at: string;
}

export const ProposalsPage = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('proposals');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchProposals = async () => {
    try {
      // Fetch proposals and clients separately since there are no FK constraints
      const [proposalsResult, clientsResult] = await Promise.all([
        supabase.from('proposals').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name, email')
      ]);

      if (proposalsResult.error) throw proposalsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      // Manually join the data
      const proposalsWithClients = proposalsResult.data?.map(proposal => ({
        ...proposal,
        clients: clientsResult.data?.find(client => client.id === proposal.client_id) || null
      })) || [];

      setProposals(proposalsWithClients as unknown as Proposal[]);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proposals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.proposal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'viewed': return 'secondary';
      case 'approved': return 'default';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'expired': return 'destructive';
      case 'draft': return 'outline';
      case 'pending_approval': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const totalValue = proposals.reduce((sum, proposal) => sum + (proposal.final_amount || proposal.total_amount || 0), 0);
  const acceptedValue = proposals
    .filter(p => p.status === 'accepted' || p.status === 'approved')
    .reduce((sum, proposal) => sum + (proposal.final_amount || proposal.total_amount || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading proposals...</p>
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
            <h1 className="text-3xl font-bold">Proposals</h1>
            <p className="text-muted-foreground">Manage client proposals and track performance</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="winloss">Win/Loss</TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">{/* Move all existing proposal content here */}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proposals.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(acceptedValue, 'USD')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {proposals.length > 0 
                  ? Math.round((proposals.filter(p => p.status === 'accepted' || p.status === 'approved').length / proposals.length) * 100)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Filters */}
            <Card>
          <CardHeader>
            <CardTitle>Client Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search proposals..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Proposals Table */}
            {filteredProposals.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposal #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Valid Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((proposal) => (
                      <TableRow 
                        key={proposal.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setShowDetailDialog(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {proposal.proposal_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{proposal.title}</div>
                            {proposal.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {proposal.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            {proposal.clients?.name || 'Unknown Client'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(proposal.status)}>
                            {proposal.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(proposal.final_amount || proposal.total_amount || 0, proposal.currency)}
                            </div>
                            {proposal.total_amount !== proposal.final_amount && (
                              <div className="text-sm text-muted-foreground">
                                Base: {formatCurrency(proposal.total_amount || 0, proposal.currency)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1 text-muted-foreground" />
                            {proposal.view_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {proposal.sent_date ? 
                            format(new Date(proposal.sent_date), 'MMM dd, yyyy') : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {proposal.valid_until ? 
                            format(new Date(proposal.valid_until), 'MMM dd, yyyy') : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No proposals found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No proposals match your current filters'
                    : 'Get started by creating your first proposal'
                  }
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Button>
              </div>
            )}
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <ProposalTemplateManager />
          </TabsContent>

          <TabsContent value="analytics">
            <ProposalAnalytics />
          </TabsContent>

          <TabsContent value="winloss">
            <WinLossTracker proposals={proposals} />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <ProposalDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          proposal={selectedProposal}
          onEdit={(proposal) => {
            setSelectedProposal(proposal);
            setShowDetailDialog(false);
            setShowEditDialog(true);
          }}
        />

        <ProposalEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          proposal={selectedProposal}
          onSave={() => {
            fetchProposals();
            setShowEditDialog(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
};