-- Final schema completion - only valid columns
-- Complete remaining database schema improvements

-- Add performance indexes for existing columns only
CREATE INDEX IF NOT EXISTS idx_action_items_assessment ON action_items(assessment_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_assessment_error_logs_assessment ON assessment_error_logs(assessment_id) WHERE assessment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contract_error_logs_contract ON contract_error_logs(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_assessments_client ON scheduled_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client ON payment_transactions(client_id);

-- Create SLA status calculation function
CREATE OR REPLACE FUNCTION calculate_sla_status(
  priority text,
  created_at timestamp with time zone,
  sla_due_date timestamp with time zone
) RETURNS text AS $$
BEGIN
  IF sla_due_date IS NULL THEN
    RETURN 'no_sla';
  END IF;
  
  IF now() > sla_due_date THEN
    RETURN 'overdue';
  ELSIF now() > (sla_due_date - INTERVAL '4 hours') THEN
    RETURN 'due_soon';
  ELSE
    RETURN 'on_track';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add missing email tracking indexes
CREATE INDEX IF NOT EXISTS idx_email_analytics_campaign_date ON email_analytics(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_bounces_recipient_date ON email_bounces(recipient_id, created_at);

-- Add missing field service indexes
CREATE INDEX IF NOT EXISTS idx_field_service_photos_work_order ON field_service_photos(work_order_id);
CREATE INDEX IF NOT EXISTS idx_field_messages_recipient ON field_messages(recipient_id);

-- Add missing audit and security indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action ON audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_auth_events_tenant_type ON auth_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_auth_security_user ON user_auth_security(user_id);

-- Create comprehensive data validation function
CREATE OR REPLACE FUNCTION validate_tenant_data_integrity()
RETURNS TABLE(table_name TEXT, issue_description TEXT, record_count BIGINT) AS $$
BEGIN
  -- Check for orphaned records
  RETURN QUERY
  SELECT 'clients'::TEXT, 'Clients without tenant_id'::TEXT, COUNT(*)::BIGINT
  FROM clients WHERE tenant_id IS NULL;
  
  RETURN QUERY
  SELECT 'assessments'::TEXT, 'Assessments with invalid client references'::TEXT, COUNT(*)::BIGINT
  FROM assessments a WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = a.client_id);
  
  RETURN QUERY
  SELECT 'contracts'::TEXT, 'Contracts with invalid client references'::TEXT, COUNT(*)::BIGINT
  FROM contracts co WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = co.client_id);
  
  RETURN QUERY
  SELECT 'proposals'::TEXT, 'Proposals with invalid client references'::TEXT, COUNT(*)::BIGINT
  FROM proposals p WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = p.client_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing unique constraints for data integrity
CREATE UNIQUE INDEX IF NOT EXISTS unique_assessment_template_name_per_tenant 
ON assessment_templates (tenant_id, name) WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS unique_email_template_name_per_tenant 
ON email_templates (tenant_id, name);

-- Create helpful database monitoring views
CREATE OR REPLACE VIEW database_health_summary AS
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
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
UNION ALL
SELECT 
  'RLS Enabled Tables' as metric,
  COUNT(*)::text as value
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Optimize existing triggers
CREATE OR REPLACE TRIGGER update_action_items_updated_at 
BEFORE UPDATE ON action_items 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();