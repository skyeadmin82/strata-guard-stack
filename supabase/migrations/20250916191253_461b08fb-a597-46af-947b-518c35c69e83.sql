-- Fix Critical Security Issues: Add missing RLS policies and enable RLS on all tables
-- This addresses the "Customer and Business Data Could Be Stolen by Hackers" security finding

-- Enable RLS on all critical tables that don't have it
ALTER TABLE public.proposal_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Add comprehensive RLS policies for proposal_catalog (Products & Services)
CREATE POLICY "Users can manage proposal catalog in their tenant" 
  ON public.proposal_catalog 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for proposal_items
CREATE POLICY "Users can manage proposal items in their tenant" 
  ON public.proposal_items 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for proposal_templates
CREATE POLICY "Users can manage proposal templates in their tenant" 
  ON public.proposal_templates 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for proposals
CREATE POLICY "Users can manage proposals in their tenant" 
  ON public.proposals 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for invoices
CREATE POLICY "Users can manage invoices in their tenant" 
  ON public.invoices 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for invoice_line_items
CREATE POLICY "Users can manage invoice line items in their tenant" 
  ON public.invoice_line_items 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for payments
CREATE POLICY "Users can manage payments in their tenant" 
  ON public.payments 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for financial_transactions
CREATE POLICY "Users can manage financial transactions in their tenant" 
  ON public.financial_transactions 
  FOR ALL 
  USING (tenant_id = get_current_user_tenant_id());

-- Add comprehensive RLS policies for users
CREATE POLICY "Users can view users in their tenant" 
  ON public.users 
  FOR SELECT 
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update their own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth_user_id = auth.uid());

CREATE POLICY "System can insert users" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (true);

-- Add comprehensive RLS policies for tenants
CREATE POLICY "Users can view their own tenant" 
  ON public.tenants 
  FOR SELECT 
  USING (id = get_current_user_tenant_id());

CREATE POLICY "Admins can update their tenant" 
  ON public.tenants 
  FOR UPDATE 
  USING (id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

-- Fix data integration: Ensure proposal_items properly links to both proposals and catalog
-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposal_items_proposal_id ON public.proposal_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_items_tenant_id ON public.proposal_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_catalog_tenant_id ON public.proposal_catalog(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_catalog_sku ON public.proposal_catalog(sku);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_tenant_id ON public.proposals(tenant_id);

-- Add catalog_item_id to proposal_items for proper linking
ALTER TABLE public.proposal_items 
ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES public.proposal_catalog(id);

-- Add QBO integration fields if missing
ALTER TABLE public.proposal_items 
ADD COLUMN IF NOT EXISTS qbo_item_ref TEXT,
ADD COLUMN IF NOT EXISTS qbo_sync_status TEXT DEFAULT 'pending';

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS qbo_estimate_ref TEXT,
ADD COLUMN IF NOT EXISTS qbo_invoice_ref TEXT,
ADD COLUMN IF NOT EXISTS qbo_sync_status TEXT DEFAULT 'pending';

-- Create function to sync proposal items with catalog
CREATE OR REPLACE FUNCTION sync_proposal_item_with_catalog()
RETURNS TRIGGER AS $$
BEGIN
  -- When a proposal item is created/updated, sync relevant fields from catalog
  IF NEW.catalog_item_id IS NOT NULL THEN
    UPDATE proposal_items 
    SET 
      name = COALESCE(NEW.name, catalog.name),
      description = COALESCE(NEW.description, catalog.description),
      unit_price = COALESCE(NEW.unit_price, catalog.unit_price),
      item_type = COALESCE(NEW.item_type, catalog.item_type),
      metadata = COALESCE(NEW.metadata, '{}') || jsonb_build_object(
        'sku', catalog.sku,
        'vendor', catalog.vendor,
        'category', catalog.category,
        'margin_percent', catalog.margin_percent
      )
    FROM proposal_catalog catalog
    WHERE catalog.id = NEW.catalog_item_id
    AND proposal_items.id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for proposal item catalog sync
DROP TRIGGER IF EXISTS trigger_sync_proposal_item_catalog ON public.proposal_items;
CREATE TRIGGER trigger_sync_proposal_item_catalog
  AFTER INSERT OR UPDATE ON public.proposal_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_proposal_item_with_catalog();

-- Add real-time capabilities for live data updates
ALTER TABLE public.proposal_catalog REPLICA IDENTITY FULL;
ALTER TABLE public.proposal_items REPLICA IDENTITY FULL;
ALTER TABLE public.proposals REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_catalog;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;