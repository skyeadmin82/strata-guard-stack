-- Fix missing user profile by creating a profile creation function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Create profile for existing authenticated user
DO $$
DECLARE
  tenant_record tenants%ROWTYPE;
  auth_user_record auth.users%ROWTYPE;
BEGIN
  -- Get the authenticated user record
  SELECT * INTO auth_user_record FROM auth.users WHERE id = '94cd0702-72ca-4d3f-afe6-4d121a3112b0';
  
  IF FOUND THEN
    -- Create a default tenant
    INSERT INTO public.tenants (name, subdomain, plan)
    VALUES ('Demo Company', 'demo-company', 'starter'::tenant_plan)
    RETURNING * INTO tenant_record;

    -- Create user profile
    INSERT INTO public.users (
      auth_user_id,
      email,
      first_name,
      last_name,
      tenant_id,
      role
    ) VALUES (
      auth_user_record.id,
      auth_user_record.email,
      'Demo',
      'User',
      tenant_record.id,
      'admin'::user_role
    );
  END IF;
END $$;