-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_record tenants%ROWTYPE;
BEGIN
  -- Create a default tenant for the user if they don't have one
  INSERT INTO public.tenants (name, subdomain, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'company-' || substr(NEW.id::text, 1, 8)), ' ', '-')),
    'starter'::tenant_plan
  ) RETURNING * INTO tenant_record;

  -- Create user profile
  INSERT INTO public.users (
    auth_user_id,
    email,
    first_name,
    last_name,
    tenant_id,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    tenant_record.id,
    'admin'::user_role  -- First user becomes admin
  );

  RETURN NEW;
END;
$$;