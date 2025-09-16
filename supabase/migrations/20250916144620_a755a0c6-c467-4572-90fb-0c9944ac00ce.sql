-- Create default SLA rules for common priorities
INSERT INTO public.sla_rules (tenant_id, name, priority, response_time_hours, resolution_time_hours, escalation_rules, is_active, created_by)
SELECT 
  t.id as tenant_id,
  'Critical Priority SLA' as name,
  'critical' as priority,
  1 as response_time_hours,
  4 as resolution_time_hours,
  '[]'::jsonb as escalation_rules,
  true as is_active,
  u.id as created_by
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
LIMIT 1;

INSERT INTO public.sla_rules (tenant_id, name, priority, response_time_hours, resolution_time_hours, escalation_rules, is_active, created_by)
SELECT 
  t.id as tenant_id,
  'High Priority SLA' as name,
  'high' as priority,
  2 as response_time_hours,
  8 as resolution_time_hours,
  '[]'::jsonb as escalation_rules,
  true as is_active,
  u.id as created_by
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
LIMIT 1;

INSERT INTO public.sla_rules (tenant_id, name, priority, response_time_hours, resolution_time_hours, escalation_rules, is_active, created_by)
SELECT 
  t.id as tenant_id,
  'Medium Priority SLA' as name,
  'medium' as priority,
  4 as response_time_hours,
  24 as resolution_time_hours,
  '[]'::jsonb as escalation_rules,
  true as is_active,
  u.id as created_by
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
LIMIT 1;

INSERT INTO public.sla_rules (tenant_id, name, priority, response_time_hours, resolution_time_hours, escalation_rules, is_active, created_by)
SELECT 
  t.id as tenant_id,
  'Low Priority SLA' as name,
  'low' as priority,
  8 as response_time_hours,
  72 as resolution_time_hours,
  '[]'::jsonb as escalation_rules,
  true as is_active,
  u.id as created_by
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
LIMIT 1;

-- Update existing tickets to have SLA due dates
UPDATE public.support_tickets
SET sla_due_date = calculate_sla_due_date(priority::text, tenant_id)
WHERE sla_due_date IS NULL;