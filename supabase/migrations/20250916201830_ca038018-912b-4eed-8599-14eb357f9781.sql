-- Insert demo tickets data with proper columns
WITH demo_clients AS (
  SELECT id, tenant_id FROM clients LIMIT 5
),
demo_users AS (
  SELECT id, tenant_id FROM users WHERE role IN ('technician', 'admin') LIMIT 3
)
INSERT INTO support_tickets (
  tenant_id,
  client_id,
  ticket_number,
  title,
  description,
  status,
  priority,
  category,
  subcategory,
  assigned_to,
  estimated_hours,
  created_at,
  updated_at
)
SELECT 
  dc.tenant_id,
  dc.id as client_id,
  'TK-' || LPAD(floor(random() * 9999 + 1)::text, 4, '0') as ticket_number,
  CASE 
    WHEN random() < 0.15 THEN 'Email server down - urgent assistance needed'
    WHEN random() < 0.25 THEN 'Slow network performance in accounting department'
    WHEN random() < 0.35 THEN 'Password reset request for multiple users'
    WHEN random() < 0.45 THEN 'Backup system showing error messages'
    WHEN random() < 0.55 THEN 'Software installation request for new employee'
    WHEN random() < 0.65 THEN 'Printer not working in marketing department'
    WHEN random() < 0.75 THEN 'VPN connection issues for remote workers'
    WHEN random() < 0.85 THEN 'Database performance optimization needed'
    ELSE 'Security audit and compliance review'
  END as title,
  CASE 
    WHEN random() < 0.15 THEN 'Users cannot access email since this morning. Error shows connection timeout. Critical business impact.'
    WHEN random() < 0.25 THEN 'Network speeds have been slow for the past week, affecting productivity in the accounting team.'
    WHEN random() < 0.35 THEN 'Need password resets for 5 users who forgot their credentials after returning from vacation.'
    WHEN random() < 0.45 THEN 'Backup system showing "Failed to connect to storage" errors for the past 3 days.'
    WHEN random() < 0.55 THEN 'New employee needs Office 365 and accounting software installed on workstation before Monday.'
    WHEN random() < 0.65 THEN 'Main printer in marketing department stopped working. Shows paper jam error but no jam found.'
    WHEN random() < 0.75 THEN 'Remote employees cannot connect to VPN since yesterday. Multiple users affected.'
    WHEN random() < 0.85 THEN 'Database queries running slow, affecting customer portal performance. Needs optimization.'
    ELSE 'Annual security audit scheduled. Need comprehensive review of all systems and compliance check.'
  END as description,
  CASE 
    WHEN random() < 0.25 THEN 'draft'
    WHEN random() < 0.45 THEN 'open'
    WHEN random() < 0.65 THEN 'in_progress'
    WHEN random() < 0.8 THEN 'resolved'
    ELSE 'closed'
  END::ticket_status as status,
  CASE 
    WHEN random() < 0.1 THEN 'critical'
    WHEN random() < 0.3 THEN 'high'
    WHEN random() < 0.7 THEN 'medium'
    ELSE 'low'
  END::ticket_priority as priority,
  CASE 
    WHEN random() < 0.2 THEN 'Infrastructure'
    WHEN random() < 0.4 THEN 'Software'
    WHEN random() < 0.6 THEN 'Hardware'
    WHEN random() < 0.8 THEN 'Security'
    ELSE 'General Support'
  END as category,
  CASE 
    WHEN random() < 0.3 THEN 'Server Issues'
    WHEN random() < 0.5 THEN 'User Account'
    WHEN random() < 0.7 THEN 'Installation'
    ELSE 'Troubleshooting'
  END as subcategory,
  du.id as assigned_to,
  CASE 
    WHEN random() < 0.3 THEN 2
    WHEN random() < 0.6 THEN 4
    WHEN random() < 0.8 THEN 8
    ELSE 16
  END as estimated_hours,
  now() - (random() * interval '30 days') as created_at,
  now() - (random() * interval '25 days') as updated_at
FROM demo_clients dc
CROSS JOIN demo_users du
WHERE random() < 0.7  -- Create tickets for most combinations
LIMIT 25;