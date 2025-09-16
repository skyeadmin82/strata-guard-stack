-- Create comprehensive sales agent management system

-- Sales Agents table
CREATE TABLE IF NOT EXISTS public.sales_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  
  -- Agent Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Agent Details
  agent_code TEXT NOT NULL,
  agent_type TEXT DEFAULT 'internal' CHECK (agent_type IN ('internal', 'external', 'partner', 'affiliate')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Commission Settings
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Base commission percentage
  commission_structure JSONB DEFAULT '{
    "new_business": 15,
    "renewal": 5,
    "upsell": 10,
    "referral": 5,
    "tier_bonuses": {
      "bronze": 0,
      "silver": 2,
      "gold": 5,
      "platinum": 10
    }
  }',
  
  -- Performance Metrics
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commission_earned DECIMAL(10,2) DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  average_deal_size DECIMAL(10,2) DEFAULT 0,
  
  -- Settings
  lead_assignment_enabled BOOLEAN DEFAULT true,
  max_active_leads INTEGER DEFAULT 50,
  specializations TEXT[], -- ['Security', 'Cloud', 'Backup', etc.]
  territory TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  onboarded_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, agent_code),
  UNIQUE(tenant_id, email)
);

-- Sales Leads table
CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  assigned_agent_id UUID,
  
  -- Lead Information
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Lead Details
  source TEXT, -- 'Website', 'Referral', 'Cold Call', 'Marketing', 'Partner'
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'proposal', 'negotiation', 
    'won', 'lost', 'recycled'
  )),
  score INTEGER DEFAULT 0, -- Lead scoring 0-100
  temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('cold', 'warm', 'hot')),
  
  -- Business Information
  industry TEXT,
  company_size TEXT,
  annual_revenue TEXT,
  pain_points TEXT[],
  interested_services TEXT[],
  budget_range TEXT,
  decision_timeline TEXT,
  
  -- Tracking
  assigned_at TIMESTAMPTZ,
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_reason TEXT,
  
  -- Value
  estimated_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Activities table
CREATE TABLE IF NOT EXISTS public.sales_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_id UUID,
  lead_id UUID,
  
  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'demo', 'proposal_sent', 
    'follow_up', 'note', 'task'
  )),
  subject TEXT,
  description TEXT,
  outcome TEXT,
  next_action TEXT,
  next_action_date DATE,
  
  -- Metadata
  duration_minutes INTEGER,
  location TEXT,
  attendees TEXT[],
  attachments JSONB,
  
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Deals/Opportunities table
CREATE TABLE IF NOT EXISTS public.sales_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_id UUID,
  lead_id UUID,
  client_id UUID,
  
  -- Deal Information
  deal_name TEXT NOT NULL,
  deal_type TEXT CHECK (deal_type IN ('new_business', 'renewal', 'upsell', 'cross_sell')),
  stage TEXT DEFAULT 'qualification' CHECK (stage IN (
    'qualification', 'needs_analysis', 'proposal', 
    'negotiation', 'closed_won', 'closed_lost'
  )),
  
  -- Financial
  deal_value DECIMAL(10,2) NOT NULL,
  recurring_value DECIMAL(10,2),
  one_time_value DECIMAL(10,2),
  contract_length_months INTEGER,
  probability INTEGER DEFAULT 50, -- Win probability percentage
  weighted_value DECIMAL(10,2), -- deal_value * probability / 100
  
  -- Commission
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT false,
  commission_paid_date DATE,
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  start_date DATE,
  
  -- Competition
  competitors TEXT[],
  competitive_notes TEXT,
  win_loss_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission Transactions table
CREATE TABLE IF NOT EXISTS public.commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_id UUID,
  deal_id UUID,
  
  -- Transaction Details
  transaction_type TEXT CHECK (transaction_type IN (
    'commission', 'bonus', 'spiff', 'adjustment', 'clawback'
  )),
  amount DECIMAL(10,2) NOT NULL,
  rate DECIMAL(5,2),
  calculation_basis TEXT, -- How it was calculated
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'paid', 'cancelled'
  )),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Payment
  payment_date DATE,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Period
  commission_period_start DATE,
  commission_period_end DATE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Goals/Quotas table
CREATE TABLE IF NOT EXISTS public.sales_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agent_id UUID,
  
  -- Goal Details
  goal_type TEXT CHECK (goal_type IN (
    'revenue', 'deals', 'activities', 'new_clients'
  )),
  period_type TEXT CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Targets
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'achieved', 'missed', 'cancelled'
  )),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Distribution Rules table
CREATE TABLE IF NOT EXISTS public.lead_distribution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Rule Configuration
  rule_name TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN (
    'round_robin', 'top_performer', 'territory', 
    'specialization', 'capacity', 'weighted'
  )),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  
  -- Conditions
  conditions JSONB DEFAULT '{
    "lead_source": [],
    "industry": [],
    "company_size": [],
    "territory": [],
    "lead_score_min": null,
    "lead_score_max": null
  }',
  
  -- Assignment Settings
  assignment_settings JSONB DEFAULT '{
    "eligible_agents": [],
    "weight_factors": {
      "performance": 0.4,
      "capacity": 0.3,
      "specialization": 0.3
    },
    "max_leads_per_agent": 50,
    "reassign_after_days": 7
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Reports Configuration
CREATE TABLE IF NOT EXISTS public.sales_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  report_name TEXT NOT NULL,
  report_type TEXT, -- 'pipeline', 'commission', 'activity', 'forecast'
  frequency TEXT, -- 'daily', 'weekly', 'monthly'
  recipients TEXT[],
  configuration JSONB,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_agents_tenant ON public.sales_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_agents_status ON public.sales_agents(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_agent ON public.sales_leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_tenant ON public.sales_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_deals_agent ON public.sales_deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_deals_stage ON public.sales_deals(stage);
CREATE INDEX IF NOT EXISTS idx_sales_deals_tenant ON public.sales_deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_agent ON public.sales_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_lead ON public.sales_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_tenant ON public.sales_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_agent ON public.commission_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commission_tenant ON public.commission_transactions(tenant_id);

-- Enable RLS
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distribution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Use proper tenant isolation
CREATE POLICY "Users can manage sales agents in their tenant" ON public.sales_agents
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage sales leads in their tenant" ON public.sales_leads
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage sales activities in their tenant" ON public.sales_activities
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage sales deals in their tenant" ON public.sales_deals
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage commission transactions in their tenant" ON public.commission_transactions
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage sales goals in their tenant" ON public.sales_goals
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage lead distribution rules in their tenant" ON public.lead_distribution_rules
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage sales report templates in their tenant" ON public.sales_report_templates
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Create triggers to update weighted_value automatically
CREATE OR REPLACE FUNCTION public.update_deal_weighted_value()
RETURNS TRIGGER AS $$
BEGIN
  NEW.weighted_value = (NEW.deal_value * NEW.probability / 100.0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_deals_weighted_value
  BEFORE INSERT OR UPDATE OF deal_value, probability ON public.sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deal_weighted_value();

-- Create function to auto-calculate commission amount
CREATE OR REPLACE FUNCTION public.update_deal_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commission_rate IS NOT NULL AND NEW.deal_value IS NOT NULL THEN
    NEW.commission_amount = (NEW.deal_value * NEW.commission_rate / 100.0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_deals_commission
  BEFORE INSERT OR UPDATE OF deal_value, commission_rate ON public.sales_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deal_commission();