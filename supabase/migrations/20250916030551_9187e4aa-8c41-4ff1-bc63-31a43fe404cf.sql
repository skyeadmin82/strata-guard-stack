-- Create all tables in correct order (no references to non-existent tables)

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

-- Contacts table with validation
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL CHECK (LENGTH(first_name) >= 1),
  last_name TEXT NOT NULL CHECK (LENGTH(last_name) >= 1),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone ~* '^\+?[0-9\s\-\(\)]{7,20}$'),
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

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

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

-- Create triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);

-- Insert sample data
INSERT INTO public.clients (tenant_id, name, industry, company_size, email, phone, status) 
SELECT 
  t.id,
  unnest(ARRAY['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Local Business']),
  unnest(ARRAY['Technology', 'Retail', 'Healthcare', 'Manufacturing']),
  unnest(ARRAY['51-200', '11-50', '201-1000', '1-10']),
  unnest(ARRAY['contact@acme.com', 'info@techstart.com', 'hello@global.com', 'owner@local.biz']),
  unnest(ARRAY['+1-555-0101', '+1-555-0102', '+1-555-0103', '+1-555-0104']),
  'active'
FROM public.tenants t WHERE t.subdomain = 'techserve';