import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedProposalItemsManager } from './EnhancedProposalItemsManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProposalEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: any;
  onSave?: () => void;
}

export const ProposalEditDialog: React.FC<ProposalEditDialogProps> = ({
  open,
  onOpenChange,
  proposal,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [proposalItems, setProposalItems] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    status: '',
    total_amount: '',
    currency: 'USD',
    tax_amount: '',
    discount_amount: '',
    valid_until: '',
    terms_and_conditions: '',
    payment_terms: '',
  });

  useEffect(() => {
    if (proposal) {
      // Convert tax_amount back to percentage if it exists
      const taxPercentage = proposal.tax_amount && proposal.total_amount 
        ? ((proposal.tax_amount / proposal.total_amount) * 100).toString()
        : '';
        
      setFormData({
        title: proposal.title || '',
        description: proposal.description || '',
        client_id: proposal.client_id || '',
        status: proposal.status || 'draft',
        total_amount: proposal.total_amount?.toString() || '',
        currency: proposal.currency || 'USD',
        tax_amount: taxPercentage, // This is now percentage
        discount_amount: proposal.discount_amount?.toString() || '',
        valid_until: proposal.valid_until ? proposal.valid_until.split('T')[0] : '',
        terms_and_conditions: proposal.terms_and_conditions || '',
        payment_terms: proposal.payment_terms || '',
      });
      
      // Fetch existing proposal items
      fetchProposalItems();
    }
  }, [proposal]);

  const fetchProposalItems = async () => {
    if (!proposal?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('proposal_items')
        .select('*')
        .eq('proposal_id', proposal.id)
        .order('item_order', { ascending: true });

      if (error) {
        console.error('Error fetching proposal items:', error);
        return;
      }

      const items = (data || []).map(item => ({
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
    }
  };

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.client_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const totalAmount = parseFloat(formData.total_amount) || 0;
      const taxRate = parseFloat(formData.tax_amount) || 0; // This is now percentage
      const discountAmount = parseFloat(formData.discount_amount) || 0;
      
      // Calculate tax amount from percentage
      const taxAmount = totalAmount * (taxRate / 100);
      const finalAmount = totalAmount + taxAmount - discountAmount;

      const updateData = {
        title: formData.title,
        description: formData.description,
        client_id: formData.client_id,
        status: formData.status as 'draft' | 'cancelled' | 'approved' | 'rejected' | 'pending_approval' | 'expired' | 'sent' | 'viewed' | 'accepted',
        total_amount: totalAmount,
        currency: formData.currency as 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD',
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        terms_and_conditions: formData.terms_and_conditions,
        payment_terms: formData.payment_terms,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', proposal.id);

      if (error) throw error;

      // Update proposal items if any changes were made
      if (proposalItems.length > 0) {
        // First, delete existing items
        await supabase
          .from('proposal_items')
          .delete()
          .eq('proposal_id', proposal.id);

        // Then insert updated items
        const { data: currentUser } = await supabase.auth.getUser();
        const { data: userProfile } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', currentUser.user?.id)
          .single();

        const itemsWithProposalId = proposalItems.map((item, index) => ({
          tenant_id: userProfile?.tenant_id,
          proposal_id: proposal.id,
          item_order: index + 1,
          item_type: item.item_type || 'product',
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percent || 0,
          tax_percent: item.tax_percent || 0,
          total_price: item.total_price || 0,
          metadata: {
            category: item.category,
            sku: item.sku,
            discount_amount: item.discount_amount,
            billing_cycle: item.billing_cycle,
            setup_fee: item.setup_fee,
            renewal_price: item.renewal_price,
            vendor: item.vendor,
            margin_percent: item.margin_percent
          },
          created_at: new Date().toISOString(),
        }));

        const { error: itemsError } = await supabase
          .from('proposal_items')
          .insert(itemsWithProposalId);

        if (itemsError) {
          console.warn('Failed to save proposal items:', itemsError);
        }
      }

      toast({
        title: 'Success',
        description: 'Proposal updated successfully',
      });

      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update proposal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-proposal-description">
        <DialogHeader>
          <DialogTitle>Edit Proposal - Enhanced Features</DialogTitle>
          <div id="edit-proposal-description" className="sr-only">
            Edit proposal with enhanced features including items, pricing, and payment terms
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* ENHANCED FEATURES BANNER */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-800">✨ Editing with Enhanced Features</span>
            </div>
            <p className="text-xs text-green-600">
              • Manage line items • Percentage-based tax rates • Standard payment terms • Enhanced workflow
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter proposal title"
              />
            </div>
            
            <div>
              <Label htmlFor="client">Client *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter proposal description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="tax_rate">Tax Rate (%) ✨ Enhanced</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                placeholder="0.0"
                className="border-green-200 focus:border-green-400"
              />
            </div>
            
            <div>
              <Label htmlFor="discount_amount">Discount Amount</Label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="valid_until">Valid Until</Label>
            <Input
              id="valid_until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
              placeholder="Enter terms and conditions"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="payment_terms">Payment Terms ✨ Enhanced</Label>
            <Select value={formData.payment_terms} onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}>
              <SelectTrigger className="border-green-200 focus:border-green-400">
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                <SelectItem value="net_15">Net 15 Days</SelectItem>
                <SelectItem value="net_30">Net 30 Days</SelectItem>
                <SelectItem value="net_45">Net 45 Days</SelectItem>
                <SelectItem value="net_60">Net 60 Days</SelectItem>
                <SelectItem value="net_90">Net 90 Days</SelectItem>
                <SelectItem value="50_50_split">50% Upfront, 50% on Completion</SelectItem>
                <SelectItem value="monthly">Monthly Payments</SelectItem>
                <SelectItem value="quarterly">Quarterly Payments</SelectItem>
                <SelectItem value="custom">Custom Terms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Proposal Items Manager */}
          <div className="border-2 border-dashed border-green-300 rounded-lg p-1 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="bg-white rounded-lg">
              <EnhancedProposalItemsManager
                items={proposalItems}
                onItemsChange={setProposalItems}
                currency={formData.currency}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};