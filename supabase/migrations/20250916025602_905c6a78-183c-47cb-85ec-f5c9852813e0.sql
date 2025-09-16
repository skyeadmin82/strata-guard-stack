-- Create enums for user roles and tenant plans
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'technician');
CREATE TYPE public.tenant_plan AS ENUM ('starter', 'professional', 'enterprise');

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  plan tenant_plan NOT NULL DEFAULT 'starter',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table (extends auth.users for multi-tenancy)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id, tenant_id)
);

-- Create error_logs table for comprehensive error tracking
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  environment TEXT NOT NULL DEFAULT 'production',
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Create security definer function to check if user has role
CREATE OR REPLACE FUNCTION public.user_has_role(_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() 
    AND role = _role
  );
$$;

-- RLS Policies for tenants table
CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (id = public.get_current_user_tenant_id());

CREATE POLICY "Admins can update their tenant"
ON public.tenants FOR UPDATE
TO authenticated
USING (id = public.get_current_user_tenant_id() AND public.user_has_role('admin'));

-- RLS Policies for users table
CREATE POLICY "Users can view users in their tenant"
ON public.users FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage users in their tenant"
ON public.users FOR ALL
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id() AND public.user_has_role('admin'));

-- RLS Policies for error_logs table
CREATE POLICY "Users can view error logs in their tenant"
ON public.error_logs FOR SELECT
TO authenticated
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Users can insert error logs for their tenant"
ON public.error_logs FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_current_user_tenant_id());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo tenant
INSERT INTO public.tenants (name, subdomain, plan, settings) VALUES 
('TechServe Solutions', 'techserve', 'professional', '{"theme": "blue", "features": ["ticketing", "monitoring", "billing"]}');

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_error_logs_tenant_id ON public.error_logs(tenant_id);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);