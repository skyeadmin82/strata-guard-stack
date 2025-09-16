-- Move pg_net extension out of public schema to fix security warning
-- And drop/recreate database_health_summary view to ensure no SECURITY DEFINER

-- First drop the database_health_summary view
DROP VIEW IF EXISTS database_health_summary;

-- Recreate without any security definer properties
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
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public'
UNION ALL
SELECT 
  'RLS Enabled Tables' as metric,
  COUNT(*)::text as value
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Note: pg_net extension cannot be moved as it's managed by Supabase
-- The extension warning is expected and can be ignored as it's part of Supabase infrastructure