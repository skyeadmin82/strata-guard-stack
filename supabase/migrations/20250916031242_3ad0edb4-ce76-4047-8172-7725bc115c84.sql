-- Fix missing user profile with unique subdomain
DO $$
DECLARE
  tenant_record tenants%ROWTYPE;
  auth_user_record auth.users%ROWTYPE;
  unique_subdomain text;
BEGIN
  -- Get the authenticated user record
  SELECT * INTO auth_user_record FROM auth.users WHERE id = '94cd0702-72ca-4d3f-afe6-4d121a3112b0';
  
  IF FOUND THEN
    -- Check if user profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth_user_record.id) THEN
      -- Generate a unique subdomain
      unique_subdomain := 'demo-' || substr(auth_user_record.id::text, 1, 8);
      
      -- Create a default tenant with unique subdomain
      INSERT INTO public.tenants (name, subdomain, plan)
      VALUES ('Demo Company', unique_subdomain, 'starter'::tenant_plan)
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
  END IF;
END $$;