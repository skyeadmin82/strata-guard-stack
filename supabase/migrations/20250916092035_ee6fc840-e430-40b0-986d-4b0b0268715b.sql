-- Add time tracking entries table for ticket time management
CREATE TABLE IF NOT EXISTS public.time_tracking_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hours_worked DECIMAL(10,2) NOT NULL DEFAULT 0,
    billable BOOLEAN NOT NULL DEFAULT true,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage time entries in their tenant" ON public.time_tracking_entries
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Create indexes
CREATE INDEX idx_time_tracking_entries_ticket_id ON public.time_tracking_entries(ticket_id);
CREATE INDEX idx_time_tracking_entries_user_id ON public.time_tracking_entries(user_id);

-- Create update trigger
CREATE TRIGGER update_time_tracking_entries_updated_at
    BEFORE UPDATE ON public.time_tracking_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();