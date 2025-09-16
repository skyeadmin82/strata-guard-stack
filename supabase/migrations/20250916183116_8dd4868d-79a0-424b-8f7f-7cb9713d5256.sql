-- Create proposal catalog table for products and services
CREATE TABLE public.proposal_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sku TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service', 'subscription', 'one-time')),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  margin_percent DECIMAL(5,2) DEFAULT 0,
  vendor TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_catalog ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view catalog items from their tenant" 
ON public.proposal_catalog 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT u.tenant_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create catalog items for their tenant" 
ON public.proposal_catalog 
FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT u.tenant_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update catalog items from their tenant" 
ON public.proposal_catalog 
FOR UPDATE 
USING (
  tenant_id IN (
    SELECT u.tenant_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create approval workflows table
CREATE TABLE public.proposal_approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create approval steps table
CREATE TABLE public.proposal_approval_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.proposal_approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  approver_name TEXT NOT NULL,
  approver_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_approval_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage approval workflows for their tenant" 
ON public.proposal_approval_workflows 
FOR ALL 
USING (
  tenant_id IN (
    SELECT u.tenant_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage approval steps for their tenant" 
ON public.proposal_approval_steps 
FOR ALL 
USING (
  tenant_id IN (
    SELECT u.tenant_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Insert sample catalog items
INSERT INTO public.proposal_catalog (tenant_id, name, description, category, sku, item_type, unit_price, margin_percent, vendor) VALUES
('11111111-1111-1111-1111-111111111111', 'Microsoft 365 Business Premium', 'Complete productivity suite with advanced security', 'Software', 'MS365-BP', 'subscription', 22.00, 25, 'Microsoft'),
('11111111-1111-1111-1111-111111111111', 'IT Support - Level 1', 'Basic help desk and troubleshooting services', 'Services', 'ITS-L1', 'service', 150.00, 40, 'Internal'),
('11111111-1111-1111-1111-111111111111', 'Network Security Assessment', 'Comprehensive security audit and vulnerability assessment', 'Professional Services', 'NSA-001', 'one-time', 2500.00, 60, 'Internal'),
('11111111-1111-1111-1111-111111111111', 'Managed Firewall Service', 'Enterprise firewall management and monitoring', 'Security', 'MFS-001', 'subscription', 299.00, 35, 'SonicWall');

-- Create indexes
CREATE INDEX idx_proposal_catalog_tenant_id ON public.proposal_catalog(tenant_id);
CREATE INDEX idx_proposal_catalog_category ON public.proposal_catalog(category);
CREATE INDEX idx_proposal_approval_workflows_proposal_id ON public.proposal_approval_workflows(proposal_id);
CREATE INDEX idx_proposal_approval_steps_workflow_id ON public.proposal_approval_steps(workflow_id);