-- Comprehensive Financial Management Database Schema

-- Financial Accounts (Chart of Accounts)
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id UUID REFERENCES public.financial_accounts(id),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'overdue', 'paid', 'cancelled', 'refunded')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
  payment_terms TEXT DEFAULT 'net_30',
  notes TEXT,
  terms_conditions TEXT,
  payment_instructions TEXT,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  validation_errors JSONB DEFAULT '[]',
  tax_calculation_details JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoice Line Items
CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  account_id UUID REFERENCES public.financial_accounts(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Credit Notes
CREATE TABLE public.credit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  credit_note_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'applied', 'voided')),
  issue_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT NOT NULL,
  description TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id),
  payment_reference TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'check', 'card', 'bank_transfer', 'paypal', 'stripe', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
  gateway_transaction_id TEXT,
  gateway_response JSONB DEFAULT '{}',
  fraud_score DECIMAL(5,2),
  fraud_flags JSONB DEFAULT '[]',
  reconciliation_status TEXT DEFAULT 'unreconciled' CHECK (reconciliation_status IN ('unreconciled', 'matched', 'disputed', 'adjusted')),
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID,
  notes TEXT,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment Plans
CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  plan_name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  installments INTEGER NOT NULL,
  installment_amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'defaulted')),
  auto_debit BOOLEAN DEFAULT false,
  payment_method_id TEXT,
  failed_payment_count INTEGER DEFAULT 0,
  max_failed_payments INTEGER DEFAULT 3,
  grace_period_days INTEGER DEFAULT 7,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment Plan Installments
CREATE TABLE public.payment_plan_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  payment_plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'failed', 'waived')),
  payment_id UUID REFERENCES public.payments(id),
  paid_date DATE,
  late_fee_applied DECIMAL(10,2) DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial Transactions (General Ledger)
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  transaction_number TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invoice', 'payment', 'credit_note', 'adjustment', 'transfer', 'expense', 'refund')),
  reference_id UUID, -- Points to invoice, payment, etc.
  reference_type TEXT,
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'reversed', 'voided')),
  reversal_transaction_id UUID REFERENCES public.financial_transactions(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transaction Line Items (Double Entry)
CREATE TABLE public.transaction_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  transaction_id UUID NOT NULL REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id),
  debit_amount DECIMAL(12,2) DEFAULT 0,
  credit_amount DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Commission Structures
CREATE TABLE public.commission_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  structure_name TEXT NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'flat_rate', 'tiered', 'progressive')),
  base_rate DECIMAL(5,2),
  tier_rules JSONB DEFAULT '[]', -- For tiered commissions
  calculation_basis TEXT NOT NULL CHECK (calculation_basis IN ('gross_revenue', 'net_revenue', 'profit_margin')),
  minimum_threshold DECIMAL(12,2) DEFAULT 0,
  maximum_cap DECIMAL(12,2),
  payment_frequency TEXT DEFAULT 'monthly' CHECK (payment_frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Commission Calculations
CREATE TABLE public.commission_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  commission_structure_id UUID NOT NULL REFERENCES public.commission_structures(id),
  calculation_period_start DATE NOT NULL,
  calculation_period_end DATE NOT NULL,
  base_amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  adjustments DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'calculated' CHECK (status IN ('calculated', 'verified', 'approved', 'paid', 'disputed')),
  calculation_details JSONB DEFAULT '{}',
  verification_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial Reports Cache
CREATE TABLE public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('profit_loss', 'balance_sheet', 'cash_flow', 'aging_report', 'commission_report', 'tax_report')),
  report_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  generation_status TEXT NOT NULL DEFAULT 'generating' CHECK (generation_status IN ('generating', 'completed', 'failed', 'expired')),
  data_validation_errors JSONB DEFAULT '[]',
  file_path TEXT,
  file_format TEXT CHECK (file_format IN ('pdf', 'xlsx', 'csv', 'json')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  generated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit Log for Financial Data
CREATE TABLE public.financial_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'view')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_role TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  compliance_flags JSONB DEFAULT '[]',
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial Anomalies Detection
CREATE TABLE public.financial_anomalies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('unusual_amount', 'frequency_spike', 'pattern_deviation', 'duplicate_transaction', 'fraud_indicator')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  detected_value DECIMAL(12,2),
  expected_range_min DECIMAL(12,2),
  expected_range_max DECIMAL(12,2),
  confidence_score DECIMAL(5,2),
  related_transaction_id UUID REFERENCES public.financial_transactions(id),
  related_invoice_id UUID REFERENCES public.invoices(id),
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'resolved', 'false_positive', 'confirmed')),
  investigated_by UUID,
  investigated_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  auto_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_anomalies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant access to financial accounts" ON public.financial_accounts FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to invoices" ON public.invoices FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to invoice line items" ON public.invoice_line_items FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to credit notes" ON public.credit_notes FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to payments" ON public.payments FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to payment plans" ON public.payment_plans FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to payment plan installments" ON public.payment_plan_installments FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to financial transactions" ON public.financial_transactions FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to transaction line items" ON public.transaction_line_items FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to commission structures" ON public.commission_structures FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to commission calculations" ON public.commission_calculations FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to financial reports" ON public.financial_reports FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to financial audit log" ON public.financial_audit_log FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to financial anomalies" ON public.financial_anomalies FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Indexes for performance
CREATE INDEX idx_invoices_tenant_status ON public.invoices (tenant_id, status);
CREATE INDEX idx_invoices_due_date ON public.invoices (due_date) WHERE status NOT IN ('paid', 'cancelled');
CREATE INDEX idx_payments_tenant_status ON public.payments (tenant_id, status);
CREATE INDEX idx_payments_reconciliation ON public.payments (reconciliation_status);
CREATE INDEX idx_financial_transactions_tenant_date ON public.financial_transactions (tenant_id, transaction_date);
CREATE INDEX idx_financial_audit_log_tenant_table ON public.financial_audit_log (tenant_id, table_name, created_at);
CREATE INDEX idx_financial_anomalies_tenant_severity ON public.financial_anomalies (tenant_id, severity, status);

-- Unique constraints
CREATE UNIQUE INDEX idx_invoices_tenant_number ON public.invoices (tenant_id, invoice_number);
CREATE UNIQUE INDEX idx_credit_notes_tenant_number ON public.credit_notes (tenant_id, credit_note_number);
CREATE UNIQUE INDEX idx_financial_transactions_tenant_number ON public.financial_transactions (tenant_id, transaction_number);

-- Triggers for updated_at
CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoice_line_items_updated_at BEFORE UPDATE ON public.invoice_line_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_credit_notes_updated_at BEFORE UPDATE ON public.credit_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_plan_installments_updated_at BEFORE UPDATE ON public.payment_plan_installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commission_structures_updated_at BEFORE UPDATE ON public.commission_structures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commission_calculations_updated_at BEFORE UPDATE ON public.commission_calculations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_reports_updated_at BEFORE UPDATE ON public.financial_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_anomalies_updated_at BEFORE UPDATE ON public.financial_anomalies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();