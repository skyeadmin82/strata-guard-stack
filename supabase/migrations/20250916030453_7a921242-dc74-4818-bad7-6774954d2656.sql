-- Fix RLS policies for error_logs to allow authenticated users to log errors
DROP POLICY IF EXISTS "Users can insert error logs for their tenant" ON public.error_logs;
DROP POLICY IF EXISTS "Users can view error logs in their tenant" ON public.error_logs;

-- Allow authenticated users to insert error logs (they might not have a profile yet)
CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view error logs in their tenant (once they have a profile)
CREATE POLICY "Users can view error logs in their tenant"
ON public.error_logs FOR SELECT
TO authenticated
USING (
  tenant_id IS NULL OR 
  tenant_id = public.get_current_user_tenant_id()
);

-- Create function to handle new user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Get the demo tenant ID (TechServe Solutions)
  SELECT id INTO tenant_id FROM public.tenants WHERE subdomain = 'techserve' LIMIT 1;
  
  -- Create user profile
  INSERT INTO public.users (
    auth_user_id,
    tenant_id,
    email,
    role,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    tenant_id,
    NEW.email,
    'technician', -- Default role
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Expand database schema for complete MSP platform
-- Clients table with validation
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) >= 2),
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  website TEXT CHECK (website ~* '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
  address JSONB DEFAULT '{}',
  phone TEXT CHECK (phone ~* '^\+?[1-9]\d{1,14}$'),
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Contacts table with validation
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL CHECK (LENGTH(first_name) >= 1),
  last_name TEXT NOT NULL CHECK (LENGTH(last_name) >= 1),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone ~* '^\+?[1-9]\d{1,14}$'),
  title TEXT,
  department TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(client_id, email)
);

-- Contracts table with date validation
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) >= 2),
  contract_type TEXT NOT NULL CHECK (contract_type IN ('msp', 'project', 'support', 'consulting')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  start_date DATE NOT NULL,
  end_date DATE CHECK (end_date > start_date),
  value DECIMAL(10,2) CHECK (value >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (LENGTH(currency) = 3),
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'annually', 'one-time')),
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Tickets table with status constraints
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (LENGTH(title) >= 5),
  description TEXT NOT NULL CHECK (LENGTH(description) >= 10),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  category TEXT CHECK (category IN ('hardware', 'software', 'network', 'security', 'other')),
  resolution TEXT,
  estimated_hours DECIMAL(5,2) CHECK (estimated_hours >= 0),
  actual_hours DECIMAL(5,2) CHECK (actual_hours >= 0),
  due_date TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Assessments table with score validation
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assessed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('security', 'infrastructure', 'compliance', 'general')),
  title TEXT NOT NULL CHECK (LENGTH(title) >= 5),
  description TEXT,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  findings JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'reviewed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Enable RLS on all new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for contacts
CREATE POLICY "Users can view contacts in their tenant"
ON public.contacts FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can manage contacts in their tenant"
ON public.contacts FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for contracts
CREATE POLICY "Users can view contracts in their tenant"
ON public.contracts FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Managers can manage contracts in their tenant"
ON public.contracts FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id() AND 
       (public.user_has_role('admin') OR public.user_has_role('manager')));

-- RLS Policies for tickets
CREATE POLICY "Users can view tickets in their tenant"
ON public.tickets FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can manage tickets in their tenant"
ON public.tickets FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

-- RLS Policies for assessments
CREATE POLICY "Users can view assessments in their tenant"
ON public.assessments FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can manage assessments in their tenant"
ON public.assessments FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

-- Create triggers for timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_name ON public.clients(name);

CREATE INDEX idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);

CREATE INDEX idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);

CREATE INDEX idx_tickets_tenant_id ON public.tickets(tenant_id);
CREATE INDEX idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);

CREATE INDEX idx_assessments_tenant_id ON public.assessments(tenant_id);
CREATE INDEX idx_assessments_client_id ON public.assessments(client_id);

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