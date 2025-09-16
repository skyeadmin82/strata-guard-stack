-- Create missing table for scheduled assessments
CREATE TABLE IF NOT EXISTS public.scheduled_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  template_id UUID NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_to TEXT,
  notes TEXT,
  frequency TEXT CHECK (frequency IN ('once', 'weekly', 'monthly', 'quarterly', 'annually')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'overdue', 'completed', 'cancelled')),
  notification_sent BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_assessments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage scheduled assessments in their tenant"
ON public.scheduled_assessments 
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- Add update trigger
CREATE TRIGGER update_scheduled_assessments_updated_at
    BEFORE UPDATE ON public.scheduled_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();