-- Drop existing problematic policies and recreate them properly
DO $$ 
BEGIN
    -- Drop and recreate tenant policies
    DROP POLICY IF EXISTS "Admins can view their tenant" ON public.tenants;
    DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        CREATE POLICY "Admins can view their tenant" ON public.tenants
        FOR SELECT USING (id = get_current_user_tenant_id());

        CREATE POLICY "Admins can update their tenant" ON public.tenants
        FOR UPDATE USING (id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
    END IF;

    -- Fix users table policies
    DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Admins can insert users in their tenant" ON public.users;
    DROP POLICY IF EXISTS "Admins can delete users in their tenant" ON public.users;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE POLICY "Users can view profiles in their tenant" ON public.users
        FOR SELECT USING (tenant_id = get_current_user_tenant_id());

        CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth_user_id = auth.uid());

        CREATE POLICY "Admins can insert users in their tenant" ON public.users
        FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

        CREATE POLICY "Admins can delete users in their tenant" ON public.users
        FOR DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
    END IF;

    -- Enable RLS on critical tables that need it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'error_logs') THEN
        ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Tenant can view error logs" ON public.error_logs;
        CREATE POLICY "Tenant can view error logs" ON public.error_logs
        FOR SELECT USING (tenant_id = get_current_user_tenant_id());
    END IF;

END $$;