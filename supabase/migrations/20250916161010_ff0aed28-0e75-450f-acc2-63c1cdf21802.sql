-- Fix the security definer view issue by recreating client_stats view
-- Drop and recreate the client_stats view without security definer

DROP VIEW IF EXISTS public.client_stats;

-- Recreate the client_stats view without security definer (default behavior)
CREATE VIEW public.client_stats AS
SELECT 
    c.id,
    c.name,
    c.health_score,
    c.risk_level,
    c.last_activity_at,
    c.satisfaction_rating,
    COALESCE(contact_count.count, 0::bigint) AS contact_count,
    COALESCE(contract_stats.total_value, 0::numeric) AS total_contract_value,
    COALESCE(contract_stats.active_count, 0::bigint) AS active_contracts,
    COALESCE(ticket_stats.open_count, 0::bigint) AS open_tickets,
    COALESCE(ticket_stats.total_count, 0::bigint) AS total_tickets,
    COALESCE(activity_stats.recent_count, 0::bigint) AS recent_activities,
    COALESCE(assessment_stats.avg_score, 0::numeric) AS avg_assessment_score
FROM clients c
LEFT JOIN (
    SELECT client_id, count(*) AS count
    FROM contacts
    WHERE is_active = true
    GROUP BY client_id
) contact_count ON c.id = contact_count.client_id
LEFT JOIN (
    SELECT client_id, sum(total_value) AS total_value, count(*) AS active_count
    FROM contracts
    WHERE status = 'active'::contract_status
    GROUP BY client_id
) contract_stats ON c.id = contract_stats.client_id
LEFT JOIN (
    SELECT client_id,
           count(*) FILTER (WHERE status = ANY (ARRAY['submitted'::ticket_status, 'in_progress'::ticket_status, 'pending_client'::ticket_status, 'in_review'::ticket_status])) AS open_count,
           count(*) AS total_count
    FROM support_tickets
    GROUP BY client_id
) ticket_stats ON c.id = ticket_stats.client_id
LEFT JOIN (
    SELECT client_id, count(*) AS recent_count
    FROM client_activities
    WHERE created_at >= now() - INTERVAL '30 days'
    GROUP BY client_id
) activity_stats ON c.id = activity_stats.client_id
LEFT JOIN (
    SELECT client_id, avg(percentage_score) AS avg_score
    FROM assessments
    WHERE status = 'completed'::response_status
    GROUP BY client_id
) assessment_stats ON c.id = assessment_stats.client_id;