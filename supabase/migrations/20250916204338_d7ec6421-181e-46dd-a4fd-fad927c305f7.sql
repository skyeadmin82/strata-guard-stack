-- Fix the security definer views by recreating them with security_invoker=on
-- This ensures views respect RLS policies of the querying user rather than the creator

-- Fix client_stats view
DROP VIEW IF EXISTS client_stats;
CREATE VIEW client_stats 
WITH (security_invoker=on) AS
SELECT 
  c.id,
  c.name,
  c.health_score,
  c.risk_level,
  c.last_activity_at,
  c.satisfaction_rating,
  COALESCE(contact_count.count, 0) AS contact_count,
  COALESCE(contract_stats.total_value, 0) AS total_contract_value,
  COALESCE(contract_stats.active_count, 0) AS active_contracts,
  COALESCE(ticket_stats.open_count, 0) AS open_tickets,
  COALESCE(ticket_stats.total_count, 0) AS total_tickets,
  COALESCE(activity_stats.recent_count, 0) AS recent_activities,
  COALESCE(assessment_stats.avg_score, 0) AS avg_assessment_score
FROM clients c
LEFT JOIN (
  SELECT 
    client_id, 
    COUNT(*) as count
  FROM contacts 
  WHERE is_active = true 
  GROUP BY client_id
) contact_count ON c.id = contact_count.client_id
LEFT JOIN (
  SELECT 
    client_id,
    SUM(total_value) as total_value,
    COUNT(*) as active_count
  FROM contracts 
  WHERE status = 'active'
  GROUP BY client_id
) contract_stats ON c.id = contract_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'in_progress', 'pending_client', 'in_review')) as open_count,
    COUNT(*) as total_count
  FROM support_tickets 
  GROUP BY client_id
) ticket_stats ON c.id = ticket_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as recent_count
  FROM client_activities 
  WHERE created_at >= now() - interval '30 days'
  GROUP BY client_id
) activity_stats ON c.id = activity_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    AVG(percentage_score) as avg_score
  FROM assessments 
  WHERE status = 'completed'
  GROUP BY client_id
) assessment_stats ON c.id = assessment_stats.client_id;

-- Fix database_health_summary view  
DROP VIEW IF EXISTS database_health_summary;
CREATE VIEW database_health_summary 
WITH (security_invoker=on) AS
SELECT 'Total Tables' as metric, count(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 'Foreign Key Constraints' as metric, count(*)::text as value
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
UNION ALL
SELECT 'RLS Enabled Tables' as metric, count(*)::text as value
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;