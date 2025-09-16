-- Add Foreign Key Constraints for Data Integrity (Fixed Version)
-- This migration establishes proper relationships between tables

-- 1. Assessment system relationships
ALTER TABLE assessment_questions 
ADD CONSTRAINT fk_assessment_questions_template_id 
FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE CASCADE;

ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_template_id 
FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE RESTRICT,
ADD CONSTRAINT fk_assessments_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE assessment_responses 
ADD CONSTRAINT fk_assessment_responses_assessment_id 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_assessment_responses_question_id 
FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE;

ALTER TABLE assessment_reports 
ADD CONSTRAINT fk_assessment_reports_assessment_id 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE assessment_reports_extended 
ADD CONSTRAINT fk_assessment_reports_extended_assessment_id 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE assessment_opportunities 
ADD CONSTRAINT fk_assessment_opportunities_assessment_id 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_assessment_opportunities_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE action_items 
ADD CONSTRAINT fk_action_items_assessment_id 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

-- 2. Client relationships
ALTER TABLE contacts 
ADD CONSTRAINT fk_contacts_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_activities 
ADD CONSTRAINT fk_client_activities_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 3. Contract relationships
ALTER TABLE contracts 
ADD CONSTRAINT fk_contracts_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE contract_approvals 
ADD CONSTRAINT fk_contract_approvals_contract_id 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

ALTER TABLE contract_payments 
ADD CONSTRAINT fk_contract_payments_contract_id 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

ALTER TABLE contract_pricing_history 
ADD CONSTRAINT fk_contract_pricing_history_contract_id 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

ALTER TABLE contract_audit_trail 
ADD CONSTRAINT fk_contract_audit_trail_contract_id 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

-- 4. Proposal relationships
ALTER TABLE proposals 
ADD CONSTRAINT fk_proposals_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE proposal_items 
ADD CONSTRAINT fk_proposal_items_proposal_id 
FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;

ALTER TABLE proposal_versions 
ADD CONSTRAINT fk_proposal_versions_proposal_id 
FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;

ALTER TABLE proposal_approvals 
ADD CONSTRAINT fk_proposal_approvals_proposal_id 
FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;

ALTER TABLE proposal_comments 
ADD CONSTRAINT fk_proposal_comments_proposal_id 
FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;

ALTER TABLE proposal_signatures 
ADD CONSTRAINT fk_proposal_signatures_proposal_id 
FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;

ALTER TABLE proposal_tracking 
ADD CONSTRAINT fk_proposal_tracking_proposal_id 
FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;

ALTER TABLE proposal_notifications 
ADD CONSTRAINT fk_proposal_notifications_proposal_id 
FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;

-- 5. Financial relationships
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE invoice_line_items 
ADD CONSTRAINT fk_invoice_line_items_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_payments_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE payment_transactions 
ADD CONSTRAINT fk_payment_transactions_payment_id 
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;

ALTER TABLE credit_notes 
ADD CONSTRAINT fk_credit_notes_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_credit_notes_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- 6. Support system relationships
ALTER TABLE support_tickets 
ADD CONSTRAINT fk_support_tickets_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE time_tracking_entries 
ADD CONSTRAINT fk_time_tracking_entries_ticket_id 
FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;

-- 7. Email system relationships
ALTER TABLE email_campaigns 
ADD CONSTRAINT fk_email_campaigns_template_id 
FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;

ALTER TABLE email_sends 
ADD CONSTRAINT fk_email_sends_campaign_id 
FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_email_sends_recipient_id 
FOREIGN KEY (recipient_id) REFERENCES email_recipients(id) ON DELETE CASCADE;

-- 8. Work order relationships
ALTER TABLE work_orders 
ADD CONSTRAINT fk_work_orders_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_work_order_id 
FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;

-- 9. Service booking relationships
ALTER TABLE service_bookings 
ADD CONSTRAINT fk_service_bookings_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_service_bookings_service_id 
FOREIGN KEY (service_id) REFERENCES service_catalog(id) ON DELETE RESTRICT;

-- 10. Workflow execution relationships
ALTER TABLE workflow_executions 
ADD CONSTRAINT fk_workflow_executions_workflow_id 
FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id) ON DELETE CASCADE;

-- Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_client_template ON assessments(client_id, template_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_status ON contracts(client_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_client_status ON proposals(client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_status_assigned ON work_orders(status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(execution_status);

-- Add missing unique constraints where appropriate
CREATE UNIQUE INDEX unique_client_primary_contact ON contacts(client_id) WHERE is_primary = true;

-- Create missing triggers for updated_at columns
CREATE TRIGGER update_assessments_updated_at 
BEFORE UPDATE ON assessments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_responses_updated_at 
BEFORE UPDATE ON assessment_responses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
BEFORE UPDATE ON contracts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at 
BEFORE UPDATE ON proposals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at 
BEFORE UPDATE ON work_orders 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();