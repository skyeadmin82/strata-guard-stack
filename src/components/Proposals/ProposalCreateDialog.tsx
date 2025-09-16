import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProposalCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export const ProposalCreateDialog: React.FC<ProposalCreateDialogProps> = ({
  open,
  onOpenChange,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [templates, setTemplates] = useState<Array<{id: string, name: string}>>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    template_id: '',
    total_amount: '',
    currency: 'USD',
    tax_amount: '',
    discount_amount: '',
    valid_until: '',
    terms_and_conditions: '',
    payment_terms: '',
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchTemplates();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      client_id: '',
      template_id: '',
      total_amount: '',
      currency: 'USD',
      tax_amount: '',
      discount_amount: '',
      valid_until: '',
      terms_and_conditions: '',
      payment_terms: '',
    });
  };

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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const generateProposalNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000) + 100;
    return `PROP-${year}-${randomNum}`;
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

      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', currentUser.user?.id)
        .single();

      const totalAmount = parseFloat(formData.total_amount) || 0;
      const taxAmount = parseFloat(formData.tax_amount) || 0;
      const discountAmount = parseFloat(formData.discount_amount) || 0;
      const finalAmount = totalAmount + taxAmount - discountAmount;

      const proposalData = {
        tenant_id: userProfile?.tenant_id,
        proposal_number: generateProposalNumber(),
        title: formData.title,
        description: formData.description,
        client_id: formData.client_id,
        template_id: formData.template_id === 'none' ? null : formData.template_id || null,
        status: 'draft' as const,
        total_amount: totalAmount,
        currency: formData.currency as 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD',
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        terms_and_conditions: formData.terms_and_conditions,
        payment_terms: formData.payment_terms,
        created_date: new Date().toISOString(),
        view_count: 0,
        content: {},
        delivery_errors: [],
        generation_errors: [],
        validation_errors: [],
        tracking_pixel_id: crypto.randomUUID(),
      };

      const { error } = await supabase
        .from('proposals')
        .insert(proposalData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Proposal created successfully',
      });

      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create proposal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Set default valid until date (30 days from now)
  const defaultValidUntil = new Date();
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
  const defaultValidUntilString = defaultValidUntil.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template">Template (Optional)</Label>
              <Select value={formData.template_id} onValueChange={(value) => setFormData({ ...formData, template_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
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
              value={formData.valid_until || defaultValidUntilString}
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
              {loading ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};