-- Create sales tables with sample data and commission structures

-- Ensure we have the necessary enums
CREATE TYPE IF NOT EXISTS lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE IF NOT EXISTS deal_stage AS ENUM ('qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Sales agents table (if not exists)
CREATE TABLE IF NOT EXISTS sales_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    territory JSONB DEFAULT '{}',
    specializations TEXT[] DEFAULT '{}',
    tier TEXT DEFAULT 'bronze',
    quota_monthly NUMERIC DEFAULT 0,
    quota_quarterly NUMERIC DEFAULT 0,
    quota_annual NUMERIC DEFAULT 0,
    commission_rate NUMERIC DEFAULT 10.0,
    max_leads INTEGER DEFAULT 50,
    current_lead_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE DEFAULT CURRENT_DATE,
    performance_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales leads table (if not exists)  
CREATE TABLE IF NOT EXISTS sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    source TEXT DEFAULT 'website',
    status lead_status DEFAULT 'new',
    assigned_agent_id UUID REFERENCES sales_agents(id),
    estimated_value NUMERIC DEFAULT 0,
    probability INTEGER DEFAULT 10,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales deals table (if not exists)
CREATE TABLE IF NOT EXISTS sales_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lead_id UUID REFERENCES sales_leads(id),
    agent_id UUID REFERENCES sales_agents(id),
    client_id UUID,
    deal_name TEXT NOT NULL,
    deal_value NUMERIC NOT NULL,
    probability INTEGER DEFAULT 50,
    weighted_value NUMERIC GENERATED ALWAYS AS (deal_value * probability / 100.0) STORED,
    stage deal_stage DEFAULT 'qualification',
    expected_close_date DATE,
    actual_close_date DATE,
    commission_rate NUMERIC DEFAULT 10.0,
    commission_amount NUMERIC GENERATED ALWAYS AS (deal_value * commission_rate / 100.0) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead distribution rules table
CREATE TABLE IF NOT EXISTS lead_distribution_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'round_robin', 'top_performer', 'territory', 'specialization', 'capacity', 'weighted'
    conditions JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_distribution_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Tenant access to sales agents" ON sales_agents FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to sales leads" ON sales_leads FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to sales deals" ON sales_deals FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to lead distribution rules" ON lead_distribution_rules FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Insert sample sales agents
INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, territory, specializations, tier, quota_monthly, quota_quarterly, quota_annual, commission_rate, max_leads, performance_score) VALUES
((SELECT get_current_user_tenant_id()), 'John', 'Smith', 'john.smith@company.com', '555-0101', '{"region": "North", "states": ["NY", "NJ", "CT"]}', ARRAY['Enterprise', 'Cybersecurity'], 'platinum', 50000, 150000, 600000, 15.0, 75, 95.2),
((SELECT get_current_user_tenant_id()), 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0102', '{"region": "South", "states": ["TX", "FL", "GA"]}', ARRAY['SMB', 'Cloud Services'], 'gold', 35000, 105000, 420000, 12.0, 60, 87.8),
((SELECT get_current_user_tenant_id()), 'Mike', 'Davis', 'mike.davis@company.com', '555-0103', '{"region": "West", "states": ["CA", "WA", "OR"]}', ARRAY['Healthcare', 'Compliance'], 'silver', 30000, 90000, 360000, 10.0, 50, 76.5),
((SELECT get_current_user_tenant_id()), 'Lisa', 'Wilson', 'lisa.wilson@company.com', '555-0104', '{"region": "Midwest", "states": ["IL", "OH", "MI"]}', ARRAY['Manufacturing', 'Retail'], 'bronze', 25000, 75000, 300000, 8.0, 40, 68.3);

-- Insert sample commission structures
INSERT INTO commission_structures (tenant_id, structure_name, commission_type, calculation_basis, base_rate, tier_rules, minimum_threshold, is_active) VALUES
((SELECT get_current_user_tenant_id()), 'Standard New Business', 'percentage', 'deal_value', 15.0, '[
  {"tier": "bronze", "bonus": 0},
  {"tier": "silver", "bonus": 2}, 
  {"tier": "gold", "bonus": 5},
  {"tier": "platinum", "bonus": 10}
]'::jsonb, 1000, true),
((SELECT get_current_user_tenant_id()), 'Renewal Commission', 'percentage', 'deal_value', 5.0, '[
  {"tier": "bronze", "bonus": 0},
  {"tier": "silver", "bonus": 1},
  {"tier": "gold", "bonus": 2},
  {"tier": "platinum", "bonus": 3}
]'::jsonb, 500, true),
((SELECT get_current_user_tenant_id()), 'Upsell Commission', 'percentage', 'deal_value', 10.0, '[
  {"tier": "bronze", "bonus": 0},
  {"tier": "silver", "bonus": 2},
  {"tier": "gold", "bonus": 4},
  {"tier": "platinum", "bonus": 6}
]'::jsonb, 1000, true);

-- Insert sample leads
INSERT INTO sales_leads (tenant_id, company_name, contact_name, email, phone, source, status, estimated_value, probability, notes) VALUES
((SELECT get_current_user_tenant_id()), 'Acme Corporation', 'Robert Martinez', 'r.martinez@acme.com', '555-1001', 'website', 'new', 25000, 20, 'Interested in cybersecurity assessment'),
((SELECT get_current_user_tenant_id()), 'TechStart Inc', 'Jennifer Lee', 'j.lee@techstart.com', '555-1002', 'referral', 'contacted', 15000, 40, 'Cloud migration project'),
((SELECT get_current_user_tenant_id()), 'Global Manufacturing', 'David Chen', 'd.chen@globalmanuf.com', '555-1003', 'trade_show', 'qualified', 45000, 60, 'Enterprise security overhaul'),
((SELECT get_current_user_tenant_id()), 'Healthcare Plus', 'Amanda Rodriguez', 'a.rodriguez@healthplus.com', '555-1004', 'cold_call', 'proposal', 35000, 75, 'HIPAA compliance solution');

-- Insert sample deals
INSERT INTO sales_deals (tenant_id, agent_id, deal_name, deal_value, probability, stage, expected_close_date, commission_rate, notes) VALUES
((SELECT get_current_user_tenant_id()), (SELECT id FROM sales_agents WHERE email = 'john.smith@company.com' LIMIT 1), 'Enterprise Security Package', 50000, 80, 'negotiation', CURRENT_DATE + INTERVAL '15 days', 15.0, 'Large enterprise deal, high priority'),
((SELECT get_current_user_tenant_id()), (SELECT id FROM sales_agents WHERE email = 'sarah.johnson@company.com' LIMIT 1), 'Cloud Migration Project', 30000, 65, 'proposal', CURRENT_DATE + INTERVAL '30 days', 12.0, 'SMB cloud transformation'),
((SELECT get_current_user_tenant_id()), (SELECT id FROM sales_agents WHERE email = 'mike.davis@company.com' LIMIT 1), 'Compliance Audit Services', 20000, 90, 'closed_won', CURRENT_DATE - INTERVAL '5 days', 10.0, 'Successfully closed healthcare compliance deal'),
((SELECT get_current_user_tenant_id()), (SELECT id FROM sales_agents WHERE email = 'lisa.wilson@company.com' LIMIT 1), 'Retail Security Assessment', 15000, 45, 'needs_analysis', CURRENT_DATE + INTERVAL '45 days', 8.0, 'Retail chain security evaluation');

-- Insert sample lead distribution rules
INSERT INTO lead_distribution_rules (tenant_id, rule_name, rule_type, conditions, priority, is_active) VALUES
((SELECT get_current_user_tenant_id()), 'Enterprise Leads to Top Performers', 'top_performer', '{"min_deal_value": 40000, "specialization": "Enterprise"}', 1, true),
((SELECT get_current_user_tenant_id()), 'Territory-Based Assignment', 'territory', '{"match_by": "state"}', 2, true),
((SELECT get_current_user_tenant_id()), 'Specialization Matching', 'specialization', '{"match_required": true}', 3, true),
((SELECT get_current_user_tenant_id()), 'Capacity-Based Fallback', 'capacity', '{"max_load_percentage": 80}', 4, true),
((SELECT get_current_user_tenant_id()), 'Round Robin Default', 'round_robin', '{}', 5, true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_agents_updated_at BEFORE UPDATE ON sales_agents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sales_leads_updated_at BEFORE UPDATE ON sales_leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sales_deals_updated_at BEFORE UPDATE ON sales_deals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lead_distribution_rules_updated_at BEFORE UPDATE ON lead_distribution_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();