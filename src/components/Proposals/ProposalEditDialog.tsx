import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      setFormData({
        title: proposal.title || '',
        description: proposal.description || '',
        client_id: proposal.client_id || '',
        status: proposal.status || 'draft',
        total_amount: proposal.total_amount?.toString() || '',
        currency: proposal.currency || 'USD',
        tax_amount: proposal.tax_amount?.toString() || '',
        discount_amount: proposal.discount_amount?.toString() || '',
        valid_until: proposal.valid_until ? proposal.valid_until.split('T')[0] : '',
        terms_and_conditions: proposal.terms_and_conditions || '',
        payment_terms: proposal.payment_terms || '',
      });
    }
  }, [proposal]);

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
      const taxAmount = parseFloat(formData.tax_amount) || 0;
      const discountAmount = parseFloat(formData.discount_amount) || 0;
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Proposal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
              <Label htmlFor="tax_amount">Tax Amount</Label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                placeholder="0.00"
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
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="e.g., Net 30 days"
            />
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