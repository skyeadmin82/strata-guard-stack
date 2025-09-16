-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  contact_id UUID NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'submitted',
  created_by UUID,
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  sla_due_date TIMESTAMP WITH TIME ZONE,
  actual_hours DECIMAL DEFAULT 0,
  estimated_hours DECIMAL,
  auto_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage support tickets in their tenant"
  ON public.support_tickets
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- Create trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for new ticket handling
CREATE TRIGGER handle_new_support_ticket
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_ticket();

-- Create SLA rules table
CREATE TABLE IF NOT EXISTS public.sla_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  priority TEXT NOT NULL,
  response_time_hours INTEGER NOT NULL DEFAULT 24,
  resolution_time_hours INTEGER NOT NULL DEFAULT 72,
  escalation_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on SLA rules
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for SLA rules
CREATE POLICY "Users can manage SLA rules in their tenant"
  ON public.sla_rules
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- Create ticket templates table
CREATE TABLE IF NOT EXISTS public.ticket_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  title_template TEXT NOT NULL,
  description_template TEXT,
  default_assignee_id UUID,
  estimated_hours DECIMAL,
  custom_fields JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on ticket templates
ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ticket templates
CREATE POLICY "Users can manage ticket templates in their tenant"
  ON public.ticket_templates
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- Create time tracking table
CREATE TABLE IF NOT EXISTS public.time_tracking_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  hours_worked DECIMAL NOT NULL,
  description TEXT,
  billable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on time tracking
ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for time tracking
CREATE POLICY "Users can manage time tracking entries in their tenant"
  ON public.time_tracking_entries
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id());

-- Create trigger for time tracking updates
CREATE TRIGGER update_ticket_time_tracking_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.time_tracking_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_time_tracking();