-- Fix Critical RLS Security Issues (Only for existing tables)
-- First check which tables exist and only apply RLS to existing ones

-- Enable RLS on existing tables that don't have it
DO $$ 
BEGIN
    -- Only enable RLS if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recurring_invoice_schedules') THEN
        ALTER TABLE public.recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to recurring invoice schedules" ON public.recurring_invoice_schedules
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposal_catalog') THEN
        ALTER TABLE public.proposal_catalog ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to proposal catalog" ON public.proposal_catalog
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_templates') THEN
        ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to email templates" ON public.email_templates
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_campaigns') THEN
        ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to email campaigns" ON public.email_campaigns
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_recipients') THEN
        ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to email recipients" ON public.email_recipients
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_analytics') THEN
        ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to email analytics" ON public.email_analytics
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sla_rules') THEN
        ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to SLA rules" ON public.sla_rules
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_tracking_entries') THEN
        ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to time tracking entries" ON public.time_tracking_entries
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
        ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can access their own settings" ON public.user_settings
        FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'data_export_requests') THEN
        ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can access their own data export requests" ON public.data_export_requests
        FOR ALL USING (requested_by IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_configurations') THEN
        ALTER TABLE public.integration_configurations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to integration configurations" ON public.integration_configurations
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_executions') THEN
        ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to workflow executions" ON public.workflow_executions
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
    END IF;

    -- Fix existing policies on core tables
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

    -- Secure tenants table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        CREATE POLICY "Admins can view their tenant" ON public.tenants
        FOR SELECT USING (id = get_current_user_tenant_id());

        CREATE POLICY "Admins can update their tenant" ON public.tenants
        FOR UPDATE USING (id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
    END IF;

    -- Secure users table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.users;
        CREATE POLICY "Users can view profiles in their tenant" ON public.users
        FOR SELECT USING (tenant_id = get_current_user_tenant_id());

        CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth_user_id = auth.uid());

        CREATE POLICY "Admins can insert users in their tenant" ON public.users
        FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

        CREATE POLICY "Admins can delete users in their tenant" ON public.users
        FOR DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
    END IF;

END $$;