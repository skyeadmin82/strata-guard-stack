-- Insert sample ticket templates for new tenants
INSERT INTO public.ticket_templates (tenant_id, name, description, category, priority, estimated_hours, title_template, description_template, default_assignee_id, custom_fields, is_active, usage_count, created_by)
SELECT 
  t.id as tenant_id,
  'Password Reset Request' as name,
  'Template for user password reset requests' as description,
  'access' as category,
  'medium' as priority,
  0.5 as estimated_hours,
  'Password Reset Request for {{client_name}}' as title_template,
  'User {{contact_name}} from {{client_name}} is requesting a password reset for their account.

Details:
- User: {{contact_name}}
- Email: {{contact_email}}
- Company: {{client_name}}
- Requested: {{current_date}}

Please reset the password and provide new credentials to the user.' as description_template,
  NULL as default_assignee_id,
  '{}'::jsonb as custom_fields,
  true as is_active,
  0 as usage_count,
  u.id as created_by
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
WHERE NOT EXISTS (SELECT 1 FROM ticket_templates WHERE tenant_id = t.id)
LIMIT 1;

INSERT INTO public.ticket_templates (tenant_id, name, description, category, priority, estimated_hours, title_template, description_template, default_assignee_id, custom_fields, is_active, usage_count, created_by)
SELECT 
  t.id as tenant_id,
  'Network Connectivity Issue' as name,
  'Template for network connectivity problems' as description,
  'network' as category,
  'high' as priority,
  2.0 as estimated_hours,
  'Network Connectivity Issue - {{client_name}}' as title_template,
  'Network connectivity issue reported by {{client_name}}.

Issue Details:
- Client: {{client_name}}
- Contact: {{contact_name}}
- Location: {{client_location}}
- Issue Description: Network connectivity problems affecting business operations
- Priority: High
- Reported: {{current_date}}

Next Steps:
1. Remote diagnosis
2. On-site visit if required
3. Resolution and testing
4. Documentation and follow-up' as description_template,
  NULL as default_assignee_id,
  '{}'::jsonb as custom_fields,
  true as is_active,
  0 as usage_count,
  u.id as created_by
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
WHERE NOT EXISTS (SELECT 1 FROM ticket_templates WHERE tenant_id = t.id)
LIMIT 1;

INSERT INTO public.ticket_templates (tenant_id, name, description, category, priority, estimated_hours, title_template, description_template, default_assignee_id, custom_fields, is_active, usage_count, created_by)
SELECT 
  t.id as tenant_id,
  'Software Installation Request' as name,
  'Template for software installation requests' as description,
  'software' as category,
  'medium' as priority,
  1.5 as estimated_hours,
  'Software Installation - {{software_name}} for {{client_name}}' as title_template,
  'Software installation request from {{client_name}}.

Installation Details:
- Client: {{client_name}}
- Contact: {{contact_name}}
- Software: {{software_name}}
- Number of licenses: {{license_count}}
- Installation type: {{installation_type}}
- Requested: {{current_date}}

Requirements:
- Verify licensing
- Schedule installation
- User training if required
- Documentation update' as description_template,
  NULL as default_assignee_id,
  '{"software_name": "", "license_count": "", "installation_type": ""}'::jsonb as custom_fields,
  true as is_active,
  0 as usage_count,
  u.id as created_by
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'admin'
WHERE NOT EXISTS (SELECT 1 FROM ticket_templates WHERE tenant_id = t.id)
LIMIT 1;