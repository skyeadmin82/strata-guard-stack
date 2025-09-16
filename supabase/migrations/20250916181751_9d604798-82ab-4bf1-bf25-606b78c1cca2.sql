-- Move extensions to proper schema (if possible)
-- Note: pg_cron and pg_net often need to be in public schema for functionality
-- This is a standard configuration for Supabase cron jobs

-- Add some missing invoice fields that the edge function expects
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS recurring_schedule_id UUID REFERENCES public.recurring_invoice_schedules(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS billing_period_start DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS billing_period_end DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sent_date TIMESTAMP WITH TIME ZONE;