-- Create missing tables for financial management
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  due_date DATE,
  issued_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  tax_calculation_details JSONB DEFAULT '{}',
  validation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  account_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  payment_reference TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  gateway_response JSONB DEFAULT '{}',
  fraud_score DECIMAL(5,2),
  fraud_flags TEXT[],
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  credit_note_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  transaction_number TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  description TEXT,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_anomalies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  detected_value DECIMAL(12,2),
  expected_range_min DECIMAL(12,2),
  expected_range_max DECIMAL(12,2),
  confidence_score DECIMAL(5,2),
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'resolved', 'false_positive')),
  related_transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create missing email tables
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject_template TEXT NOT NULL,
  html_template TEXT,
  text_template TEXT,
  template_variables JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  category TEXT,
  sender_name TEXT,
  sender_email TEXT,
  reply_to TEXT,
  is_system_template BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT DEFAULT 'standard' CHECK (campaign_type IN ('standard', 'ab_test', 'drip', 'trigger')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed', 'cancelled')),
  send_immediately BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'UTC',
  send_optimization JSONB DEFAULT '{}',
  ab_test_config JSONB DEFAULT '{}',
  ab_test_winner TEXT,
  recipient_criteria JSONB DEFAULT '{}',
  recipient_count INTEGER DEFAULT 0,
  sender_config JSONB DEFAULT '{}',
  delivery_settings JSONB DEFAULT '{}',
  rate_limit_per_hour INTEGER DEFAULT 1000,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  send_errors JSONB DEFAULT '[]',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.email_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  merge_fields JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  source TEXT,
  tags TEXT[],
  preferences JSONB DEFAULT '{}',
  email_verified BOOLEAN DEFAULT false,
  email_validation_status TEXT,
  validation_errors JSONB DEFAULT '[]',
  total_sends INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id),
  recipient_email TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  device_type TEXT,
  browser TEXT,
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create missing settings tables  
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, user_id, category)
);

-- Enable RLS on new tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage invoices in their tenant" ON public.invoices
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage invoice line items in their tenant" ON public.invoice_line_items
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage payments in their tenant" ON public.payments
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage credit notes in their tenant" ON public.credit_notes
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage financial transactions in their tenant" ON public.financial_transactions
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage financial anomalies in their tenant" ON public.financial_anomalies
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage email templates in their tenant" ON public.email_templates
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage email campaigns in their tenant" ON public.email_campaigns
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage email recipients in their tenant" ON public.email_recipients
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage email analytics in their tenant" ON public.email_analytics
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage their settings in their tenant" ON public.user_settings
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_email_campaigns_tenant_id ON public.email_campaigns(tenant_id);
CREATE INDEX idx_email_recipients_tenant_id ON public.email_recipients(tenant_id);
CREATE INDEX idx_email_recipients_email ON public.email_recipients(email);
CREATE INDEX idx_user_settings_tenant_user ON public.user_settings(tenant_id, user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();