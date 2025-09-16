-- Create recurring invoice schedules table
CREATE TABLE public.recurring_invoice_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  client_id UUID NOT NULL,
  contract_id UUID NULL,
  proposal_id UUID NULL,
  
  -- Schedule details
  invoice_title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Recurring settings
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semi_annually', 'annually', 'weekly', 'bi_weekly')),
  start_date DATE NOT NULL,
  end_date DATE NULL, -- NULL for indefinite
  next_billing_date DATE NOT NULL,
  last_billed_date DATE NULL,
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  auto_send BOOLEAN DEFAULT true,
  payment_terms_days INTEGER DEFAULT 30,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.users(id),
  
  -- Billing history tracking
  total_invoices_generated INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(10,2) DEFAULT 0,
  
  -- Email settings
  send_reminders BOOLEAN DEFAULT true,
  reminder_days_before JSONB DEFAULT '[7, 3, 1]'::jsonb
);

-- Create generated invoices tracking table
CREATE TABLE public.recurring_invoice_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  recurring_schedule_id UUID NOT NULL REFERENCES public.recurring_invoice_schedules(id) ON DELETE CASCADE,
  invoice_id UUID NULL, -- Will reference invoices table when created
  
  -- Generation details
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'sent', 'paid', 'failed', 'cancelled')),
  
  -- Timestamps
  scheduled_date DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NULL,
  sent_at TIMESTAMP WITH TIME ZONE NULL,
  paid_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Error tracking
  generation_attempts INTEGER DEFAULT 0,
  last_error TEXT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoice_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage recurring schedules in their tenant" 
ON public.recurring_invoice_schedules 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view recurring history in their tenant" 
ON public.recurring_invoice_history 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX idx_recurring_schedules_tenant_client ON public.recurring_invoice_schedules(tenant_id, client_id);
CREATE INDEX idx_recurring_schedules_next_billing ON public.recurring_invoice_schedules(next_billing_date, status);
CREATE INDEX idx_recurring_schedules_contract ON public.recurring_invoice_schedules(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_recurring_schedules_proposal ON public.recurring_invoice_schedules(proposal_id) WHERE proposal_id IS NOT NULL;

CREATE INDEX idx_recurring_history_schedule ON public.recurring_invoice_history(recurring_schedule_id);
CREATE INDEX idx_recurring_history_scheduled_date ON public.recurring_invoice_history(scheduled_date, status);

-- Create function to calculate next billing date
CREATE OR REPLACE FUNCTION public.calculate_next_billing_date(
  current_date DATE,
  frequency TEXT
) RETURNS DATE AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN RETURN current_date + INTERVAL '1 week';
    WHEN 'bi_weekly' THEN RETURN current_date + INTERVAL '2 weeks';
    WHEN 'monthly' THEN RETURN current_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN RETURN current_date + INTERVAL '3 months';
    WHEN 'semi_annually' THEN RETURN current_date + INTERVAL '6 months';
    WHEN 'annually' THEN RETURN current_date + INTERVAL '1 year';
    ELSE RETURN current_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-create recurring schedule from signed proposal
CREATE OR REPLACE FUNCTION public.create_recurring_from_proposal()
RETURNS TRIGGER AS $$
DECLARE
  schedule_frequency TEXT;
  schedule_start_date DATE;
BEGIN
  -- Only process when proposal status changes to 'accepted' or 'approved'
  IF (NEW.status IN ('accepted', 'approved')) AND (OLD.status != NEW.status) THEN
    
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
    INSERT INTO public.recurring_invoice_schedules (
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
      NEW.description || ' (Auto-generated from accepted proposal)',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create recurring schedules from proposals
CREATE TRIGGER trigger_create_recurring_from_proposal
  AFTER UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_recurring_from_proposal();

-- Update timestamp trigger
CREATE TRIGGER update_recurring_schedules_updated_at
  BEFORE UPDATE ON public.recurring_invoice_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();