-- Fix remaining security issues for client_stats and database_health_summary

DO $$ 
BEGIN
    -- Handle client_stats (view) - Create a security definer function to control access
    IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'client_stats') THEN
        -- Drop the existing view
        DROP VIEW IF EXISTS public.client_stats;
        
        -- Create a security definer function that only returns data for the user's tenant
        CREATE OR REPLACE FUNCTION public.get_client_stats()
        RETURNS TABLE (
            id uuid,
            name text,
            health_score integer,
            risk_level text,
            last_activity_at timestamp with time zone,
            total_tickets bigint,
            open_tickets bigint,
            active_contracts bigint,
            total_contract_value numeric,
            satisfaction_rating integer,
            contact_count bigint,
            recent_activities bigint,
            avg_assessment_score numeric
        ) 
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        SELECT 
            c.id,
            c.name,
            c.health_score,
            c.risk_level,
            c.last_activity_at,
            COALESCE(t.ticket_count, 0) as total_tickets,
            COALESCE(t.open_count, 0) as open_tickets,
            COALESCE(con.contract_count, 0) as active_contracts,
            COALESCE(con.total_value, 0) as total_contract_value,
            c.satisfaction_rating,
            COALESCE(contacts.contact_count, 0) as contact_count,
            COALESCE(activities.activity_count, 0) as recent_activities,
            COALESCE(assess.avg_score, 0) as avg_assessment_score
        FROM public.clients c
        LEFT JOIN (
            SELECT client_id, COUNT(*) as ticket_count, COUNT(*) FILTER (WHERE status = 'open') as open_count
            FROM public.support_tickets 
            WHERE tenant_id = get_current_user_tenant_id()
            GROUP BY client_id
        ) t ON c.id = t.client_id
        LEFT JOIN (
            SELECT client_id, COUNT(*) as contract_count, SUM(total_value) as total_value
            FROM public.contracts 
            WHERE tenant_id = get_current_user_tenant_id() AND status = 'active'
            GROUP BY client_id
        ) con ON c.id = con.client_id
        LEFT JOIN (
            SELECT client_id, COUNT(*) as contact_count
            FROM public.contacts 
            WHERE tenant_id = get_current_user_tenant_id()
            GROUP BY client_id
        ) contacts ON c.id = contacts.client_id
        LEFT JOIN (
            SELECT client_id, COUNT(*) as activity_count
            FROM public.client_activities 
            WHERE tenant_id = get_current_user_tenant_id() 
            AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY client_id
        ) activities ON c.id = activities.client_id
        LEFT JOIN (
            SELECT client_id, AVG(percentage_score) as avg_score
            FROM public.assessments 
            WHERE tenant_id = get_current_user_tenant_id() 
            AND status = 'completed'
            GROUP BY client_id
        ) assess ON c.id = assess.client_id
        WHERE c.tenant_id = get_current_user_tenant_id()
        ORDER BY c.name;
        $$;
        
        -- Create a view that uses the security definer function
        CREATE VIEW public.client_stats AS 
        SELECT * FROM public.get_client_stats();
    END IF;

    -- Handle database_health_summary table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'database_health_summary') THEN
        -- Enable RLS on the table
        ALTER TABLE public.database_health_summary ENABLE ROW LEVEL SECURITY;
        
        -- Create admin-only policy
        CREATE POLICY "Admins can view database health summary" ON public.database_health_summary
        FOR SELECT USING (user_has_role('admin'::user_role));
        
    ELSIF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'database_health_summary') THEN
        -- If it's a view, drop and recreate with security
        DROP VIEW IF EXISTS public.database_health_summary;
        
        -- Create a security definer function for admin-only access
        CREATE OR REPLACE FUNCTION public.get_database_health_summary()
        RETURNS TABLE (
            table_name text,
            row_count bigint,
            size_bytes bigint,
            last_updated timestamp with time zone,
            health_status text
        ) 
        LANGUAGE sql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        SELECT 
            schemaname || '.' || tablename as table_name,
            n_tup_ins + n_tup_upd + n_tup_del as row_count,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
            GREATEST(last_vacuum, last_autovacuum, last_analyze, last_autoanalyze) as last_updated,
            CASE 
                WHEN n_dead_tup::float / GREATEST(n_live_tup, 1) > 0.2 THEN 'needs_maintenance'
                WHEN pg_total_relation_size(schemaname||'.'||tablename) > 1073741824 THEN 'large_table'
                ELSE 'healthy'
            END as health_status
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND user_has_role('admin'::user_role))
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        $$;
        
        -- Create a view that uses the security definer function
        CREATE VIEW public.database_health_summary AS 
        SELECT * FROM public.get_database_health_summary();
    END IF;

END $$;