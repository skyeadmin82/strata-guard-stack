-- Fix security issues by recreating the client_stats view without SECURITY DEFINER
DROP VIEW IF EXISTS client_stats;

-- Recreate client_stats view as a regular view (not SECURITY DEFINER)
CREATE VIEW client_stats AS
SELECT 
    c.id,
    c.name,
    c.health_score,
    c.risk_level,
    c.last_activity_at,
    c.satisfaction_rating,
    COALESCE(contact_count.count, 0) as contact_count,
    COALESCE(contract_stats.total_value, 0) as total_contract_value,
    COALESCE(contract_stats.active_count, 0) as active_contracts,
    COALESCE(ticket_stats.open_count, 0) as open_tickets,
    COALESCE(ticket_stats.total_count, 0) as total_tickets,
    COALESCE(activity_stats.recent_count, 0) as recent_activities,
    COALESCE(assessment_stats.avg_score, 0) as avg_assessment_score
FROM clients c
LEFT JOIN (
    SELECT client_id, COUNT(*) as count
    FROM contacts 
    WHERE is_active = true
    GROUP BY client_id
) contact_count ON c.id = contact_count.client_id
LEFT JOIN (
    SELECT client_id, 
           SUM(total_value) as total_value,
           COUNT(*) as active_count
    FROM contracts 
    WHERE status = 'active'
    GROUP BY client_id
) contract_stats ON c.id = contract_stats.client_id
LEFT JOIN (
    SELECT client_id,
           COUNT(*) FILTER (WHERE status IN ('submitted', 'in_progress', 'waiting_for_customer')) as open_count,
           COUNT(*) as total_count
    FROM support_tickets
    GROUP BY client_id
) ticket_stats ON c.id = ticket_stats.client_id
LEFT JOIN (
    SELECT client_id, COUNT(*) as recent_count
    FROM client_activities
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY client_id
) activity_stats ON c.id = activity_stats.client_id
LEFT JOIN (
    SELECT client_id, AVG(percentage_score) as avg_score
    FROM assessments
    WHERE status = 'completed'
    GROUP BY client_id
) assessment_stats ON c.id = assessment_stats.client_id;