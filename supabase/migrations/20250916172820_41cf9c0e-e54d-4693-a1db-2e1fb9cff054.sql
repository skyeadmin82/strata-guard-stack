-- Create missing financial reports table referenced in ReportsHub
CREATE TABLE IF NOT EXISTS public.financial_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  period_start DATE,
  period_end DATE,
  file_format TEXT DEFAULT 'pdf',
  file_path TEXT,
  report_data JSONB DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create missing support_tickets table (referenced in many places but doesn't match tickets table)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'on_hold', 'resolved', 'closed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  created_by UUID,
  sla_due_date TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create missing time_tracking_entries table
CREATE TABLE IF NOT EXISTS public.time_tracking_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  description TEXT,
  hours_worked DECIMAL(5,2) NOT NULL,
  billable BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create missing notifications table (referenced in network requests)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage financial reports in their tenant" ON public.financial_reports
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage support tickets in their tenant" ON public.support_tickets
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage time tracking entries in their tenant" ON public.time_tracking_entries
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage notifications in their tenant" ON public.notifications
  FOR ALL USING (tenant_id = get_current_user_tenant_id() OR user_id IS NULL);

-- Create indexes
CREATE INDEX idx_financial_reports_tenant_id ON public.financial_reports(tenant_id);
CREATE INDEX idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_client_id ON public.support_tickets(client_id);
CREATE INDEX idx_time_tracking_entries_tenant_id ON public.time_tracking_entries(tenant_id);
CREATE INDEX idx_time_tracking_entries_ticket_id ON public.time_tracking_entries(ticket_id);
CREATE INDEX idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_financial_reports_updated_at BEFORE UPDATE ON public.financial_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();