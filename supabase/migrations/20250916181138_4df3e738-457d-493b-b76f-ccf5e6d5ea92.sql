-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.calculate_next_billing_date(
  billing_date DATE,
  frequency TEXT
) RETURNS DATE AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN RETURN billing_date + INTERVAL '1 week';
    WHEN 'bi_weekly' THEN RETURN billing_date + INTERVAL '2 weeks';
    WHEN 'monthly' THEN RETURN billing_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN RETURN billing_date + INTERVAL '3 months';
    WHEN 'semi_annually' THEN RETURN billing_date + INTERVAL '6 months';
    WHEN 'annually' THEN RETURN billing_date + INTERVAL '1 year';
    ELSE RETURN billing_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix the trigger function search path
CREATE OR REPLACE FUNCTION public.create_recurring_from_proposal()
RETURNS TRIGGER AS $$
DECLARE
  schedule_frequency TEXT;
  schedule_start_date DATE;
BEGIN
  -- Only process when proposal status changes to 'accepted' or 'approved'
  IF (NEW.status IN ('accepted', 'approved')) AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Determine frequency based on proposal payment terms or default to monthly
    schedule_frequency := COALESCE(NEW.payment_terms, 'monthly');
    IF schedule_frequency NOT IN ('monthly', 'quarterly', 'semi_annually', 'annually', 'weekly', 'bi_weekly') THEN
      schedule_frequency := 'monthly';
    END IF;
    
    -- Set start date (next month from acceptance or custom start date)
    schedule_start_date := COALESCE(
      (NEW.terms_and_conditions::jsonb->>'recurring_start_date')::date,
      date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    );
    
    -- Create recurring schedule
    INSERT INTO recurring_invoice_schedules (
      tenant_id,
      client_id,
      proposal_id,
      invoice_title,
      description,
      amount,
      currency,
      frequency,
      start_date,
      next_billing_date,
      status,
      created_by
    ) VALUES (
      NEW.tenant_id,
      NEW.client_id,
      NEW.id,
      NEW.title || ' - Recurring Billing',
      COALESCE(NEW.description, '') || ' (Auto-generated from accepted proposal)',
      COALESCE(NEW.final_amount, NEW.total_amount, 0),
      NEW.currency,
      schedule_frequency,
      schedule_start_date,
      schedule_start_date,
      'active',
      NEW.created_by
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;