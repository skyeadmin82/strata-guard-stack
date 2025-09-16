-- Fix phone validation and complete MSP database schema
-- Drop and recreate clients table with corrected phone validation
DROP TABLE IF EXISTS public.clients CASCADE;

-- Clients table with corrected validation
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) >= 2),
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  website TEXT CHECK (website ~* '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
  address JSONB DEFAULT '{}',
  phone TEXT CHECK (phone ~* '^\+?[0-9\s\-\(\)]{7,20}$'),
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Fix contacts table phone validation too
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS contacts_phone_check;

ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_phone_check 
CHECK (phone ~* '^\+?[0-9\s\-\(\)]{7,20}$');

-- Enable RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view clients in their tenant"
ON public.clients FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can insert clients in their tenant"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can update clients in their tenant"
ON public.clients FOR UPDATE
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Admins can delete clients in their tenant"
ON public.clients FOR DELETE
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id() AND public.user_has_role('admin'));

-- Create trigger for timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_name ON public.clients(name);

-- Insert sample data for demo
INSERT INTO public.clients (tenant_id, name, industry, company_size, email, phone, status, created_by) 
SELECT 
  t.id,
  unnest(ARRAY['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Local Business']),
  unnest(ARRAY['Technology', 'Retail', 'Healthcare', 'Manufacturing']),
  unnest(ARRAY['51-200', '11-50', '201-1000', '1-10']),
  unnest(ARRAY['contact@acme.com', 'info@techstart.com', 'hello@global.com', 'owner@local.biz']),
  unnest(ARRAY['+1-555-0101', '+1-555-0102', '+1-555-0103', '+1-555-0104']),
  'active',
  (SELECT id FROM public.users WHERE tenant_id = t.id LIMIT 1)
FROM public.tenants t WHERE t.subdomain = 'techserve';

-- Add sample contacts for each client
INSERT INTO public.contacts (tenant_id, client_id, first_name, last_name, email, phone, title, is_primary)
SELECT 
  c.tenant_id,
  c.id,
  unnest(ARRAY['John', 'Jane', 'Mike', 'Sarah']),
  unnest(ARRAY['Smith', 'Doe', 'Johnson', 'Wilson']),
  unnest(ARRAY['john@acme.com', 'jane@techstart.com', 'mike@global.com', 'sarah@local.biz']),
  unnest(ARRAY['+1-555-1001', '+1-555-1002', '+1-555-1003', '+1-555-1004']),
  unnest(ARRAY['CEO', 'CTO', 'Manager', 'Owner']),
  true
FROM public.clients c
ORDER BY c.created_at;

-- Add sample tickets
INSERT INTO public.tickets (tenant_id, client_id, title, description, priority, status, category)
SELECT 
  c.tenant_id,
  c.id,
  unnest(ARRAY['Server Performance Issue', 'Email Configuration', 'Network Connectivity', 'Software Installation']),
  unnest(ARRAY['Server response times are slow during peak hours', 'Need help configuring new email accounts', 'Intermittent network connection issues', 'Assistance needed installing new software package']),
  unnest(ARRAY['high', 'medium', 'high', 'low']),
  unnest(ARRAY['open', 'in_progress', 'waiting', 'resolved']),
  unnest(ARRAY['hardware', 'software', 'network', 'software'])
FROM public.clients c
ORDER BY c.created_at;