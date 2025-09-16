-- Add Foreign Key Constraints for Data Integrity (Based on Actual Schema)
-- Only create constraints for columns that actually exist

-- 1. Assessment system relationships
ALTER TABLE assessment_questions 
ADD CONSTRAINT fk_assessment_questions_template_id 
FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE CASCADE;

ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_template_id 
FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE RESTRICT;

ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE assessment_responses 
ADD CONSTRAINT fk_assessment_responses_assessment_id 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE assessment_responses 
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
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE assessment_opportunities 
ADD CONSTRAINT fk_assessment_opportunities_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 2. Client relationships
ALTER TABLE contacts 
ADD CONSTRAINT fk_contacts_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE client_activities 
ADD CONSTRAINT fk_client_activities_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 3. Contract relationships (if client_id exists)
-- ALTER TABLE contracts 
-- ADD CONSTRAINT fk_contracts_client_id 
-- FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 4. Add performance indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_client_template ON assessments(client_id, template_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_question ON assessment_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_opportunities_client ON assessment_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_client ON client_activities(client_id);

-- 5. Add unique constraint for primary contacts using partial index
CREATE UNIQUE INDEX IF NOT EXISTS unique_client_primary_contact 
ON contacts (client_id) WHERE is_primary = true;

-- 6. Create missing triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_assessments_updated_at 
BEFORE UPDATE ON assessments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_assessment_responses_updated_at 
BEFORE UPDATE ON assessment_responses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();