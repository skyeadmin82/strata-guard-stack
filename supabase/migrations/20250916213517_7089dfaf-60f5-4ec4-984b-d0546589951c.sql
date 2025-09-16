-- Fix remaining critical RLS security issues
DO $$ 
BEGIN
    -- Enable RLS on client_stats table and add policy
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_stats') THEN
        ALTER TABLE public.client_stats ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Tenant access to client stats" ON public.client_stats
        FOR SELECT USING (id IN (SELECT id FROM public.clients WHERE tenant_id = get_current_user_tenant_id()));
    END IF;

    -- Enable RLS on database_health_summary table and restrict to admins
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'database_health_summary') THEN
        ALTER TABLE public.database_health_summary ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Admins can view database health" ON public.database_health_summary
        FOR SELECT USING (user_has_role('admin'::user_role));
    END IF;

END $$;