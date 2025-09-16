-- Insert demo tickets data
WITH demo_clients AS (
  SELECT id, tenant_id FROM clients LIMIT 5
),
demo_users AS (
  SELECT id, tenant_id FROM users WHERE role IN ('technician', 'admin') LIMIT 3
)
INSERT INTO support_tickets (
  tenant_id,
  client_id,
  title,
  description,
  status,
  priority,
  environment,
  assigned_to,
  created_at,
  updated_at
)
SELECT 
  dc.tenant_id,
  dc.id as client_id,
  CASE 
    WHEN random() < 0.2 THEN 'Email server down - urgent assistance needed'
    WHEN random() < 0.4 THEN 'Slow network performance in accounting department'
    WHEN random() < 0.6 THEN 'Password reset request for multiple users'
    WHEN random() < 0.8 THEN 'Backup system showing error messages'
    ELSE 'Software installation request for new employee'
  END as title,
  CASE 
    WHEN random() < 0.2 THEN 'Users cannot access email since this morning. Error message shows connection timeout.'
    WHEN random() < 0.4 THEN 'Network speeds have been slow for the past week, affecting productivity.'
    WHEN random() < 0.6 THEN 'Need password resets for 5 users who forgot their credentials.'
    WHEN random() < 0.8 THEN 'Backup system showing "Failed to connect to storage" errors.'
    ELSE 'New employee needs Office 365 and accounting software installed on workstation.'
  END as description,
  CASE 
    WHEN random() < 0.3 THEN 'open'
    WHEN random() < 0.6 THEN 'in_progress'
    WHEN random() < 0.8 THEN 'resolved'
    ELSE 'closed'
  END as status,
  CASE 
    WHEN random() < 0.2 THEN 'critical'
    WHEN random() < 0.4 THEN 'high'
    WHEN random() < 0.7 THEN 'medium'
    ELSE 'low'
  END as priority,
  CASE 
    WHEN random() < 0.7 THEN 'production'
    ELSE 'demo'
  END as environment,
  du.id as assigned_to,
  now() - (random() * interval '30 days') as created_at,
  now() - (random() * interval '25 days') as updated_at
FROM demo_clients dc
CROSS JOIN demo_users du
WHERE random() < 0.6  -- Only create tickets for some combinations
LIMIT 20;