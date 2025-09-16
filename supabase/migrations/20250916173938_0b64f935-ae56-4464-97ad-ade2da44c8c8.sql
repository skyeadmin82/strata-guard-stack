-- Fix Security Issues Detected by Linter

-- 1. Fix Security Definer View by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS database_health_summary CASCADE;

CREATE VIEW database_health_summary AS
SELECT 
  'Total Tables' as metric,
  COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Foreign Key Constraints' as metric,
  COUNT(*)::text as value
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
UNION ALL
SELECT 
  'RLS Enabled Tables' as metric,
  COUNT(*)::text as value
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- 2. Fix Function Search Path Issues by adding proper search_path
CREATE OR REPLACE FUNCTION calculate_sla_status(
  priority text,
  created_at timestamp with time zone,
  sla_due_date timestamp with time zone
) RETURNS text 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF sla_due_date IS NULL THEN
    RETURN 'no_sla';
  END IF;
  
  IF now() > sla_due_date THEN
    RETURN 'overdue';
  ELSIF now() > (sla_due_date - INTERVAL '4 hours') THEN
    RETURN 'due_soon';
  ELSE
    RETURN 'on_track';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION validate_tenant_data_integrity()
RETURNS TABLE(table_name TEXT, issue_description TEXT, record_count BIGINT) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for orphaned records
  RETURN QUERY
  SELECT 'clients'::TEXT, 'Clients without tenant_id'::TEXT, COUNT(*)::BIGINT
  FROM clients WHERE tenant_id IS NULL;
  
  RETURN QUERY
  SELECT 'assessments'::TEXT, 'Assessments with invalid client references'::TEXT, COUNT(*)::BIGINT
  FROM assessments a WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = a.client_id);
  
  RETURN QUERY
  SELECT 'contracts'::TEXT, 'Contracts with invalid client references'::TEXT, COUNT(*)::BIGINT
  FROM contracts co WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = co.client_id);
  
  RETURN QUERY
  SELECT 'proposals'::TEXT, 'Proposals with invalid client references'::TEXT, COUNT(*)::BIGINT
  FROM proposals p WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = p.client_id);
END;
$$;