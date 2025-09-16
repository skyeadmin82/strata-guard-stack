-- Create enums for assessment system
CREATE TYPE public.assessment_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE public.question_type AS ENUM ('text', 'number', 'boolean', 'single_choice', 'multiple_choice', 'scale', 'matrix');
CREATE TYPE public.response_status AS ENUM ('in_progress', 'completed', 'validated', 'flagged');
CREATE TYPE public.opportunity_status AS ENUM ('identified', 'qualified', 'proposal_sent', 'won', 'lost', 'cancelled');
CREATE TYPE public.opportunity_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.report_status AS ENUM ('pending', 'generating', 'completed', 'failed', 'retrying');

-- Assessment templates table
CREATE TABLE public.assessment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status assessment_status DEFAULT 'draft',
  scoring_rules JSONB DEFAULT '{}',
  threshold_rules JSONB DEFAULT '{}',
  conditional_logic JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  estimated_duration INTEGER, -- in minutes
  passing_score NUMERIC,
  max_score NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment questions table
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  template_id UUID NOT NULL,
  section TEXT,
  question_number INTEGER NOT NULL,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  description TEXT,
  options JSONB DEFAULT '[]', -- for choice questions
  validation_rules JSONB DEFAULT '{}',
  scoring_weight NUMERIC DEFAULT 1,
  max_points NUMERIC DEFAULT 1,
  required BOOLEAN DEFAULT false,
  conditional_logic JSONB DEFAULT '{}',
  help_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment instances (actual assessments taken by clients)
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  template_id UUID NOT NULL,
  client_id UUID NOT NULL,
  assessor_id UUID,
  status response_status DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_question INTEGER DEFAULT 1,
  total_score NUMERIC DEFAULT 0,
  max_possible_score NUMERIC DEFAULT 0,
  percentage_score NUMERIC DEFAULT 0,
  session_data JSONB DEFAULT '{}',
  validation_errors JSONB DEFAULT '[]',
  recovery_data JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment responses table
CREATE TABLE public.assessment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  question_id UUID NOT NULL,
  response_value TEXT,
  response_data JSONB DEFAULT '{}',
  score NUMERIC DEFAULT 0,
  auto_saved BOOLEAN DEFAULT false,
  validation_status TEXT DEFAULT 'pending',
  validation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment opportunities table
CREATE TABLE public.assessment_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  client_id UUID NOT NULL,
  opportunity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority opportunity_priority DEFAULT 'medium',
  status opportunity_status DEFAULT 'identified',
  estimated_value NUMERIC,
  currency TEXT DEFAULT 'USD',
  threshold_data JSONB DEFAULT '{}',
  detection_rules JSONB DEFAULT '{}',
  assigned_to UUID,
  due_date DATE,
  follow_up_date DATE,
  automation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment reports table
CREATE TABLE public.assessment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  report_data JSONB DEFAULT '{}',
  export_formats JSONB DEFAULT '["html"]',
  file_path TEXT,
  error_details JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  email_recipients JSONB DEFAULT '[]',
  email_sent BOOLEAN DEFAULT false,
  email_errors JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment error logs table
CREATE TABLE public.assessment_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assessment_id UUID,
  error_type TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_details JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error',
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage assessment templates in their tenant" 
ON public.assessment_templates FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage assessment questions in their tenant" 
ON public.assessment_questions FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage assessments in their tenant" 
ON public.assessments FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage assessment responses in their tenant" 
ON public.assessment_responses FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage assessment opportunities in their tenant" 
ON public.assessment_opportunities FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage assessment reports in their tenant" 
ON public.assessment_reports FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage assessment error logs in their tenant" 
ON public.assessment_error_logs FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX idx_assessment_templates_tenant_id ON public.assessment_templates(tenant_id);
CREATE INDEX idx_assessment_templates_status ON public.assessment_templates(status);
CREATE INDEX idx_assessment_questions_template_id ON public.assessment_questions(template_id);
CREATE INDEX idx_assessments_client_id ON public.assessments(client_id);
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_assessment_responses_assessment_id ON public.assessment_responses(assessment_id);
CREATE INDEX idx_assessment_opportunities_client_id ON public.assessment_opportunities(client_id);
CREATE INDEX idx_assessment_opportunities_status ON public.assessment_opportunities(status);
CREATE INDEX idx_assessment_reports_assessment_id ON public.assessment_reports(assessment_id);

-- Create updated_at triggers
CREATE TRIGGER update_assessment_templates_updated_at
BEFORE UPDATE ON public.assessment_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
BEFORE UPDATE ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_responses_updated_at
BEFORE UPDATE ON public.assessment_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_opportunities_updated_at
BEFORE UPDATE ON public.assessment_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_reports_updated_at
BEFORE UPDATE ON public.assessment_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.assessment_templates (tenant_id, name, description, category, scoring_rules, threshold_rules) 
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'IT Infrastructure Assessment', 'Comprehensive evaluation of IT infrastructure', 'Infrastructure', 
   '{"total_possible": 100, "sections": {"security": 30, "network": 25, "hardware": 25, "software": 20}}',
   '{"opportunities": {"security_upgrade": {"threshold": 60, "priority": "high"}, "network_improvement": {"threshold": 70, "priority": "medium"}}}'),
  ('00000000-0000-0000-0000-000000000000', 'Cybersecurity Readiness Assessment', 'Evaluate cybersecurity posture and vulnerabilities', 'Security',
   '{"total_possible": 120, "weighted_sections": {"policies": 0.3, "technical": 0.4, "training": 0.3}}',
   '{"opportunities": {"security_training": {"threshold": 50, "priority": "high"}, "policy_update": {"threshold": 60, "priority": "medium"}}}');

INSERT INTO public.assessment_questions (tenant_id, template_id, section, question_number, question_type, question_text, options, max_points, required)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  t.id,
  'Security',
  1,
  'scale',
  'How would you rate your current network security measures?',
  '[{"value": 1, "label": "Poor"}, {"value": 2, "label": "Fair"}, {"value": 3, "label": "Good"}, {"value": 4, "label": "Excellent"}]',
  4,
  true
FROM public.assessment_templates t WHERE t.name = 'IT Infrastructure Assessment';