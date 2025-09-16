-- Fix Critical RLS Security Issues (Final - Drop existing policies first)

DO $$ 
BEGIN
    -- Enable RLS and create policies for existing tables only
    
    -- Tenants table - secure access
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        DROP POLICY IF EXISTS "Admins can view their tenant" ON public.tenants;
        DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
        
        CREATE POLICY "Admins can view their tenant" ON public.tenants
        FOR SELECT USING (id = get_current_user_tenant_id());

        CREATE POLICY "Admins can update their tenant" ON public.tenants
        FOR UPDATE USING (id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
    END IF;

    -- Users table - secure profile access
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.users;
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
        DROP POLICY IF EXISTS "Admins can insert users in their tenant" ON public.users;
        DROP POLICY IF EXISTS "Admins can delete users in their tenant" ON public.users;
        
        CREATE POLICY "Users can view profiles in their tenant" ON public.users
        FOR SELECT USING (tenant_id = get_current_user_tenant_id());

        CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth_user_id = auth.uid());

        CREATE POLICY "Admins can insert users in their tenant" ON public.users
        FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

        CREATE POLICY "Admins can delete users in their tenant" ON public.users
        FOR DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
    END IF;

    -- Core business tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
        DROP POLICY IF EXISTS "Users can manage tickets in their tenant" ON public.support_tickets;
        CREATE POLICY "Users can manage tickets in their tenant" ON public.support_tickets
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposals') THEN
        DROP POLICY IF EXISTS "Users can manage proposals in their tenant" ON public.proposals;
        CREATE POLICY "Users can manage proposals in their tenant" ON public.proposals
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposal_items') THEN
        DROP POLICY IF EXISTS "Users can manage proposal items in their tenant" ON public.proposal_items;
        CREATE POLICY "Users can manage proposal items in their tenant" ON public.proposal_items
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    -- Additional tables with RLS
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_invoice_schedules') THEN
        ALTER TABLE public.recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant access to recurring invoice schedules" ON public.recurring_invoice_schedules;
        CREATE POLICY "Tenant access to recurring invoice schedules" ON public.recurring_invoice_schedules
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sla_rules') THEN
        ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant access to SLA rules" ON public.sla_rules;
        CREATE POLICY "Tenant access to SLA rules" ON public.sla_rules
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_tracking_entries') THEN
        ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Tenant access to time tracking entries" ON public.time_tracking_entries;
        CREATE POLICY "Tenant access to time tracking entries" ON public.time_tracking_entries
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
        ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can access their own settings" ON public.user_settings;
        CREATE POLICY "Users can access their own settings" ON public.user_settings
        FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
    END IF;

END $$;