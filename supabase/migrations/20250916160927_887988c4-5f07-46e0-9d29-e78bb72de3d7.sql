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

-- Add some sample proposal templates for testing
INSERT INTO public.proposal_templates (
    tenant_id,
    name,
    description,
    template_type,
    content,
    variables,
    default_terms,
    default_payment_terms,
    is_active,
    created_by
) VALUES 
(
    (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1),
    'Standard IT Services Proposal',
    'A comprehensive template for IT service proposals including managed services, support, and maintenance.',
    'service',
    '{"sections": [{"title": "Executive Summary", "content": "Our comprehensive IT services solution is designed to meet your business needs."}, {"title": "Scope of Work", "content": "We will provide the following services: [INSERT_SERVICES]"}, {"title": "Deliverables", "content": "All deliverables will be completed according to the agreed timeline."}]}',
    '{"client_name": "Client Name", "services": "IT Services", "duration": "12 months"}',
    'This proposal is valid for 30 days. All services are subject to our standard terms and conditions.',
    'Net 30 days',
    true,
    (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
) ON CONFLICT DO NOTHING,
(
    (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1),
    'Project-Based Proposal',
    'Template for one-time project engagements with clear deliverables and milestones.',
    'project',
    '{"sections": [{"title": "Project Overview", "content": "This project will deliver [PROJECT_OUTCOME]"}, {"title": "Timeline", "content": "The project will be completed in [DURATION]"}, {"title": "Investment", "content": "Total project investment: [TOTAL_AMOUNT]"}]}',
    '{"project_name": "Project Name", "duration": "3 months", "total_amount": "$10,000"}',
    'Payment terms: 50% upfront, 50% upon completion. This proposal expires in 14 days.',
    '50% upfront, 50% on completion',
    true,
    (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
) ON CONFLICT DO NOTHING;