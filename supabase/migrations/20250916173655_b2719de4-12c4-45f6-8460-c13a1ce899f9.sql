-- Add remaining Foreign Key Constraints (Final - Valid Columns Only)

-- Contract relationships
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

-- Proposal relationships
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

-- Financial relationships
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE invoice_line_items 
ADD CONSTRAINT fk_invoice_line_items_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE credit_notes 
ADD CONSTRAINT fk_credit_notes_invoice_id 
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- Support system relationships
ALTER TABLE support_tickets 
ADD CONSTRAINT fk_support_tickets_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE time_tracking_entries 
ADD CONSTRAINT fk_time_tracking_entries_ticket_id 
FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;

-- Work order relationships
ALTER TABLE work_orders 
ADD CONSTRAINT fk_work_orders_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_work_order_id 
FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;

-- Email system relationships
ALTER TABLE email_campaigns 
ADD CONSTRAINT fk_email_campaigns_template_id 
FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;

ALTER TABLE email_sends 
ADD CONSTRAINT fk_email_sends_campaign_id 
FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_email_sends_recipient_id 
FOREIGN KEY (recipient_id) REFERENCES email_recipients(id) ON DELETE CASCADE;

-- Service bookings relationships
ALTER TABLE service_bookings 
ADD CONSTRAINT fk_service_bookings_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_service_bookings_service_id 
FOREIGN KEY (service_id) REFERENCES service_catalog(id) ON DELETE RESTRICT;

-- Workflow execution relationships
ALTER TABLE workflow_executions 
ADD CONSTRAINT fk_workflow_executions_workflow_id 
FOREIGN KEY (workflow_id) REFERENCES automation_workflows(id) ON DELETE CASCADE;

-- Add performance indexes (only with existing columns)
CREATE INDEX IF NOT EXISTS idx_contracts_client_status ON contracts(client_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_client_status ON proposals(client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(execution_status);

-- Create additional missing triggers
CREATE OR REPLACE TRIGGER update_contracts_updated_at 
BEFORE UPDATE ON contracts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_proposals_updated_at 
BEFORE UPDATE ON proposals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_work_orders_updated_at 
BEFORE UPDATE ON work_orders 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();