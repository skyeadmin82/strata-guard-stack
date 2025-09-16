-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run recurring invoice generation daily at 9 AM
SELECT cron.schedule(
  'generate-recurring-invoices-daily',
  '0 9 * * *', -- 9 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://ghczhzfywivhrcvncffl.supabase.co/functions/v1/generate-recurring-invoices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3poemZ5d2l2aHJjdm5jZmZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk4ODc1OCwiZXhwIjoyMDczNTY0NzU4fQ.uUNvykJQdvEGqJ_X_ue7OWq3TwEgYdLD7s4Z5QFJrpo"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "'||now()||'"}'::jsonb
    ) as request_id;
  $$
);

-- Also create a manual trigger function for testing
CREATE OR REPLACE FUNCTION public.trigger_recurring_invoice_generation()
RETURNS TABLE(request_id bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    net.http_post(
        url:='https://ghczhzfywivhrcvncffl.supabase.co/functions/v1/generate-recurring-invoices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3poemZ5d2l2aHJjdm5jZmZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk4ODc1OCwiZXhwIjoyMDczNTY0NzU4fQ.uUNvykJQdvEGqJ_X_ue7OWq3TwEgYdLD7s4Z5QFJrpo"}'::jsonb,
        body:='{"trigger": "manual", "timestamp": "'||now()||'"}'::jsonb
    ) as request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;