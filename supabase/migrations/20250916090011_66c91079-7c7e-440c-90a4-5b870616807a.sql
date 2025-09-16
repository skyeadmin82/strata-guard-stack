-- Fix security issues from the linter

-- Drop the security definer view and recreate as a regular view  
DROP VIEW IF EXISTS public.client_stats;

-- Create client stats view without security definer (users will see data they have access to via RLS)
CREATE VIEW public.client_stats AS
SELECT 
  c.id,
  c.name,
  c.health_score,
  c.last_activity_at,
  c.risk_level,
  c.satisfaction_rating,
  COALESCE(ticket_stats.total_tickets, 0) as total_tickets,
  COALESCE(ticket_stats.open_tickets, 0) as open_tickets,
  COALESCE(contract_stats.active_contracts, 0) as active_contracts,
  COALESCE(contract_stats.total_value, 0) as total_contract_value,
  COALESCE(contact_stats.contact_count, 0) as contact_count,
  COALESCE(assessment_stats.avg_score, 0) as avg_assessment_score,
  COALESCE(activity_stats.recent_activities, 0) as recent_activities
FROM public.clients c
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'in_review', 'in_progress', 'pending_client')) as open_tickets
  FROM public.support_tickets 
  GROUP BY client_id
) ticket_stats ON c.id = ticket_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as active_contracts,
    COALESCE(SUM(total_value), 0) as total_value
  FROM public.contracts 
  WHERE status = 'active'
  GROUP BY client_id
) contract_stats ON c.id = contract_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as contact_count
  FROM public.contacts 
  WHERE is_active = true
  GROUP BY client_id
) contact_stats ON c.id = contact_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    AVG(percentage_score) as avg_score
  FROM public.assessments 
  WHERE status = 'completed'
  GROUP BY client_id
) assessment_stats ON c.id = assessment_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as recent_activities
  FROM public.client_activities 
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY client_id
) activity_stats ON c.id = activity_stats.client_id;

-- Fix search_path for functions
CREATE OR REPLACE FUNCTION public.update_client_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clients 
  SET last_activity_at = now() 
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;