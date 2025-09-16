-- Create scheduled_assessments table for assessment scheduling
CREATE TABLE public.scheduled_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  template_id UUID NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_to UUID NULL,
  notes TEXT NULL,
  frequency TEXT CHECK (frequency IN ('once', 'weekly', 'monthly', 'quarterly', 'annually')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'overdue', 'completed', 'cancelled')),
  notification_sent BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 3,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage scheduled assessments in their tenant" 
ON public.scheduled_assessments 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create action_items table for assessment-generated tasks
CREATE TABLE public.action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assessment_id UUID NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  assigned_to TEXT NULL,
  due_date DATE NULL,
  estimated_effort INTEGER NULL, -- hours
  estimated_value NUMERIC NULL, -- dollars
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  findings TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage action items in their tenant" 
ON public.action_items 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create assessment_reports table for report generation tracking
CREATE TABLE public.assessment_reports_extended (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'comprehensive',
  file_format TEXT NOT NULL DEFAULT 'pdf' CHECK (file_format IN ('pdf', 'html', 'csv', 'excel')),
  file_path TEXT NULL,
  file_size_bytes BIGINT NULL,
  generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  generated_at TIMESTAMP WITH TIME ZONE NULL,
  downloaded_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE NULL,
  error_message TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessment_reports_extended ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage assessment reports in their tenant" 
ON public.assessment_reports_extended 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create triggers for updated_at
CREATE TRIGGER update_scheduled_assessments_updated_at
  BEFORE UPDATE ON public.scheduled_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_reports_extended_updated_at
  BEFORE UPDATE ON public.assessment_reports_extended
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();