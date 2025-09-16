import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProposalESignature } from './ProposalESignature';
import { ProposalTracking } from './ProposalTracking';
import { ProposalPDFGenerator } from './ProposalPDFGenerator';
import { ProposalApprovalWorkflow } from './ProposalApprovalWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Download, Send, Eye, Calendar, Package, ShoppingCart, EyeOff, DollarSign, TrendingUp } from 'lucide-react';
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
  last_viewed_at?: string;
  client_id: string;
  clients?: { name: string; email?: string } | null;
  created_at: string;
  updated_at?: string;
  terms_and_conditions?: string;
  payment_terms?: string;
}

interface ProposalItem {
  id: string;
  item_order: number;
  item_type: string;
  category: string;
  name: string;
  description: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  total_price: number;
  billing_cycle?: string;
  setup_fee?: number;
  renewal_price?: number;
  vendor?: string;
  margin_percent?: number;
}

interface ProposalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: Proposal | null;
  onEdit?: (proposal: Proposal) => void;
}

export const ProposalDetailDialog: React.FC<ProposalDetailDialogProps> = ({
  open,
  onOpenChange,
  proposal,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [proposalItems, setProposalItems] = useState<ProposalItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showInternalView, setShowInternalView] = useState(true); // Toggle for internal vs client view
  const { toast } = useToast();

  useEffect(() => {
    if (proposal?.id) {
      fetchProposalItems();
    }
  }, [proposal?.id]);

  const fetchProposalItems = async () => {
    if (!proposal?.id) return;
    
    try {
      setLoadingItems(true);
      console.log('Fetching proposal items for proposal:', proposal.id);
      
      const { data, error } = await supabase
        .from('proposal_items')
        .select('*')
        .eq('proposal_id', proposal.id)
        .order('item_order', { ascending: true });

      if (error) {
        console.error('Error fetching proposal items:', error);
        return;
      }

      console.log('Found proposal items:', data?.length || 0);

      const items: ProposalItem[] = (data || []).map(item => ({
        id: item.id,
        item_order: item.item_order || 1,
        item_type: item.item_type || 'product',
        category: (item.metadata as any)?.category || '',
        name: item.name || '',
        description: item.description || '',
        sku: (item.metadata as any)?.sku || undefined,
        quantity: item.quantity || 1,
        unit_price: parseFloat(String(item.unit_price || 0)),
        discount_percent: parseFloat(String(item.discount_percent || 0)),
        discount_amount: (item.metadata as any)?.discount_amount ? parseFloat(String((item.metadata as any).discount_amount)) : 0,
        tax_percent: parseFloat(String(item.tax_percent || 0)),
        total_price: parseFloat(String(item.total_price || 0)),
        billing_cycle: (item.metadata as any)?.billing_cycle,
        setup_fee: (item.metadata as any)?.setup_fee ? parseFloat(String((item.metadata as any).setup_fee)) : undefined,
        renewal_price: (item.metadata as any)?.renewal_price ? parseFloat(String((item.metadata as any).renewal_price)) : undefined,
        vendor: (item.metadata as any)?.vendor || undefined,
        margin_percent: (item.metadata as any)?.margin_percent ? parseFloat(String((item.metadata as any).margin_percent)) : undefined
      }));

      setProposalItems(items);
    } catch (error) {
      console.error('Error fetching proposal items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  if (!proposal) return null;

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

  const handleDownload = async () => {
    // PDF generation is now handled by ProposalPDFGenerator component
    console.log('Download handled by PDF generator');
  };

  const handleSend = async () => {
    if (!proposal.clients?.email) {
      toast({
        title: 'Error',
        description: 'Client email not found. Please add an email address to the client record.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-proposal-email', {
        body: {
          proposalId: proposal.id,
          recipientEmail: proposal.clients.email,
          recipientName: proposal.clients.name,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Proposal sent successfully',
      });
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to send proposal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{proposal.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(proposal.status)}>
                  {proposal.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  #{proposal.proposal_number}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showInternalView ? "default" : "outline"}
                size="sm"
                onClick={() => setShowInternalView(!showInternalView)}
                className="mr-2"
              >
                {showInternalView ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showInternalView ? "Client View" : "Internal View"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit?.(proposal)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <ProposalPDFGenerator 
                proposalId={proposal.id}
                proposalTitle={proposal.title}
              />
              <Button variant="outline" size="sm" onClick={handleSend}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5 shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="approvals" className="relative">
              Approvals
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 space-y-6"
            style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {/* NEW FEATURES INDICATOR */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-800">✨ Enhanced Proposal Features Active</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Enterprise approvals, item tracking, and advanced workflow management are now available
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Proposal Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Proposal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm mt-1">{proposal.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Client</label>
                      <p className="text-sm mt-1">{proposal.clients?.name || 'Unknown Client'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-sm mt-1">
                        {format(new Date(proposal.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>

                  {proposal.valid_until && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
                      <p className="text-sm mt-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(proposal.valid_until), 'PPP')}
                      </p>
                    </div>
                  )}

                  {proposal.terms_and_conditions && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Terms & Conditions</label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {proposal.terms_and_conditions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Financial Summary
                    {showInternalView && (
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Internal
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Base Amount</label>
                    <p className="text-lg font-semibold">
                      {formatCurrency(proposal.total_amount || 0, proposal.currency)}
                    </p>
                  </div>
                  
                  {proposal.discount_amount > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Discount</label>
                      <p className="text-sm text-red-600">
                        -{formatCurrency(proposal.discount_amount, proposal.currency)}
                      </p>
                    </div>
                  )}
                  
                  {proposal.tax_amount > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tax</label>
                      <p className="text-sm">
                        +{formatCurrency(proposal.tax_amount, proposal.currency)}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t pt-2">
                    <label className="text-sm font-medium text-muted-foreground">Final Amount</label>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(proposal.final_amount || proposal.total_amount || 0, proposal.currency)}
                    </p>
                  </div>

                  {/* INTERNAL MARGIN INFORMATION - HIDDEN FROM CLIENTS */}
                  {showInternalView && (
                    <>
                      <div className="border-t pt-4 bg-orange-50 rounded-lg p-3 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-orange-600" />
                          <label className="text-sm font-bold text-orange-800">Margin Analysis (Internal Only)</label>
                        </div>
                        
                        {proposalItems.length > 0 ? (
                          <div className="space-y-2">
                            {(() => {
                              const totalRevenue = proposal.final_amount || proposal.total_amount || 0;
                              const totalMargin = proposalItems.reduce((sum, item) => {
                                const itemMargin = item.total_price * ((item.margin_percent || 0) / 100);
                                return sum + itemMargin;
                              }, 0);
                              const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
                              
                              return (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-orange-700">Total Margin:</span>
                                    <span className="font-semibold text-orange-800">
                                      {formatCurrency(totalMargin, proposal.currency)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-orange-700">Margin %:</span>
                                    <span className="font-bold text-orange-800">
                                      {marginPercentage.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-orange-700">Net Profit:</span>
                                    <span className="font-bold text-green-700">
                                      {formatCurrency(totalMargin, proposal.currency)}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-orange-600">
                            Add line items to see detailed margin analysis
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Proposal Items - NEW ENHANCED FEATURE */}
            {proposalItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Proposal Items
                    <Badge variant="secondary" className="ml-2">
                      {proposalItems.length} item{proposalItems.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          {showInternalView && (
                            <TableHead className="text-right bg-orange-50">
                              <div className="flex items-center justify-end gap-1">
                                <TrendingUp className="w-3 h-3 text-orange-600" />
                                <span className="text-orange-800 font-semibold text-xs">Margin %</span>
                              </div>
                            </TableHead>
                          )}
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposalItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground">{item.description}</div>
                                )}
                                {item.sku && (
                                  <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                                )}
                                {showInternalView && item.vendor && (
                                  <div className="text-xs text-orange-600">Vendor: {item.vendor}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                item.item_type === 'subscription' ? 'outline' :
                                item.item_type === 'service' ? 'secondary' :
                                item.item_type === 'one-time' ? 'destructive' : 'default'
                              }>
                                {item.item_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price, proposal.currency)}
                            </TableCell>
                            {showInternalView && (
                              <TableCell className="text-right bg-orange-50">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-orange-800">
                                    {(item.margin_percent || 0).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-orange-600">
                                    {formatCurrency((item.total_price * ((item.margin_percent || 0) / 100)), proposal.currency)}
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total_price, proposal.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {proposalItems.length === 0 && !loadingItems && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Proposal Items ✨ New Feature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-6 mb-4">
                      <Package className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold text-blue-900 mb-2">Enhanced Item Management Available!</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        This proposal was created before the new enhanced features were added.
                      </p>
                      <div className="text-xs text-blue-600 space-y-1">
                        <p>✓ Browse product catalog</p>
                        <p>✓ Detailed line items with descriptions</p>
                        <p>✓ SKU and vendor tracking</p>
                        <p>✓ Margin calculations</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      New proposals will show detailed line items here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Engagement Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{proposal.view_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Views</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">
                      {proposal.sent_date ? format(new Date(proposal.sent_date), 'MMM dd') : 'Not sent'}
                    </p>
                    <p className="text-sm text-muted-foreground">Sent Date</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-sm font-medium">
                      {proposal.viewed_date ? format(new Date(proposal.viewed_date), 'MMM dd') : 'Not viewed'}
                    </p>
                    <p className="text-sm text-muted-foreground">First Viewed</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-sm font-medium">
                      {proposal.last_viewed_at ? format(new Date(proposal.last_viewed_at), 'MMM dd') : 'Never'}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Viewed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="flex-1 overflow-y-auto p-4"
            style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <ProposalTracking
              proposalId={proposal.id}
              proposalTitle={proposal.title}
            />
          </TabsContent>

          <TabsContent value="approvals" className="flex-1 overflow-y-auto p-4"
            style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-purple-800">🚀 Enterprise Approval Workflow</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Multi-step approval process with comments, tracking, and notifications
              </p>
            </div>
            <ProposalApprovalWorkflow
              proposalId={proposal.id}
              proposalTitle={proposal.title}
            />
          </TabsContent>

          <TabsContent value="signatures" className="flex-1 overflow-y-auto p-4"
            style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <ProposalESignature
              proposalId={proposal.id}
              proposalTitle={proposal.title}
              clientEmail={proposal.clients?.email}
            />
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-y-auto p-4"
            style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Activity tracking coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};