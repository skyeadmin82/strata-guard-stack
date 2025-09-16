import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalESignature } from './ProposalESignature';
import { ProposalTracking } from './ProposalTracking';
import { ProposalPDFGenerator } from './ProposalPDFGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Download, Send, Eye, Calendar } from 'lucide-react';
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
  const { toast } = useToast();

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                  <CardTitle>Financial Summary</CardTitle>
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
                </CardContent>
              </Card>
            </div>

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

          <TabsContent value="tracking">
            <ProposalTracking
              proposalId={proposal.id}
              proposalTitle={proposal.title}
            />
          </TabsContent>

          <TabsContent value="signatures">
            <ProposalESignature
              proposalId={proposal.id}
              proposalTitle={proposal.title}
              clientEmail={proposal.clients?.email}
            />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
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