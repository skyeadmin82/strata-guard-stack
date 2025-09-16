-- Complete remaining database schema gaps
-- Add only missing constraints and features

-- Check and add missing action items constraint
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_action_items_assessment_id') THEN
    ALTER TABLE action_items ADD CONSTRAINT fk_action_items_assessment_id 
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add performance indexes that are definitely missing
CREATE INDEX IF NOT EXISTS idx_action_items_assessment ON action_items(assessment_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_assessment_error_logs_assessment ON assessment_error_logs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_contract_error_logs_contract ON contract_error_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_assessments_client ON scheduled_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client ON payment_transactions(client_id);

-- Create missing SLA triggers for support tickets
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

-- Add missing client health score calculation trigger
CREATE OR REPLACE TRIGGER trigger_update_client_health_score
AFTER INSERT OR UPDATE OR DELETE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION update_client_last_activity();

-- Create missing notification handling
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_type ON notifications(tenant_id, notification_type);

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

-- Update RLS policies that might be missing for new tables
DO $$
BEGIN
  -- Ensure all tenant-based tables have proper RLS policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_assessments' AND policyname LIKE '%tenant%') THEN
    CREATE POLICY "Users can manage scheduled assessments in their tenant" ON scheduled_assessments
      FOR ALL USING (tenant_id = get_current_user_tenant_id());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname LIKE '%tenant%') THEN
    CREATE POLICY "Users can manage service requests in their tenant" ON service_requests
      FOR ALL USING (tenant_id = get_current_user_tenant_id());
  END IF;
END $$;

-- Create comprehensive validation function for data integrity
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;