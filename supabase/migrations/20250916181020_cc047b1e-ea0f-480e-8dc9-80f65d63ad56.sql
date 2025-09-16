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