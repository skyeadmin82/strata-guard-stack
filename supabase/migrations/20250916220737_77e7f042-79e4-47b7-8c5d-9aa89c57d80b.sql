-- Create sales enums and add sample data

-- Create enums (skip if they exist)
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deal_stage AS ENUM ('qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns to existing sales_agents table if they don't exist
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS territory JSONB DEFAULT '{}';
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze';
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS quota_monthly NUMERIC DEFAULT 0;
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS quota_quarterly NUMERIC DEFAULT 0;
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS quota_annual NUMERIC DEFAULT 0;
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS max_leads INTEGER DEFAULT 50;
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS current_lead_count INTEGER DEFAULT 0;
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE sales_agents ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 0;

-- Add columns to existing sales_leads table if they don't exist
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS status lead_status DEFAULT 'new';
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Add columns to existing sales_deals table if they don't exist  
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS stage deal_stage DEFAULT 'qualification';

-- Create lead distribution rules table
CREATE TABLE IF NOT EXISTS lead_distribution_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    conditions JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE lead_distribution_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for new table
CREATE POLICY "Tenant access to lead distribution rules" ON lead_distribution_rules FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Insert sample data (only if tables are empty to avoid duplicates)
INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, territory, specializations, tier, quota_monthly, quota_quarterly, quota_annual, commission_rate, max_leads, performance_score)
SELECT * FROM (VALUES
    (get_current_user_tenant_id(), 'John', 'Smith', 'john.smith@company.com', '555-0101', '{"region": "North", "states": ["NY", "NJ", "CT"]}'::jsonb, ARRAY['Enterprise', 'Cybersecurity'], 'platinum', 50000::numeric, 150000::numeric, 600000::numeric, 15.0::numeric, 75, 95.2::numeric),
    (get_current_user_tenant_id(), 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0102', '{"region": "South", "states": ["TX", "FL", "GA"]}'::jsonb, ARRAY['SMB', 'Cloud Services'], 'gold', 35000::numeric, 105000::numeric, 420000::numeric, 12.0::numeric, 60, 87.8::numeric),
    (get_current_user_tenant_id(), 'Mike', 'Davis', 'mike.davis@company.com', '555-0103', '{"region": "West", "states": ["CA", "WA", "OR"]}'::jsonb, ARRAY['Healthcare', 'Compliance'], 'silver', 30000::numeric, 90000::numeric, 360000::numeric, 10.0::numeric, 50, 76.5::numeric),
    (get_current_user_tenant_id(), 'Lisa', 'Wilson', 'lisa.wilson@company.com', '555-0104', '{"region": "Midwest", "states": ["IL", "OH", "MI"]}'::jsonb, ARRAY['Manufacturing', 'Retail'], 'bronze', 25000::numeric, 75000::numeric, 300000::numeric, 8.0::numeric, 40, 68.3::numeric)
) AS v(tenant_id, first_name, last_name, email, phone, territory, specializations, tier, quota_monthly, quota_quarterly, quota_annual, commission_rate, max_leads, performance_score)
WHERE NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = get_current_user_tenant_id());

-- Insert sample commission structures
INSERT INTO commission_structures (tenant_id, structure_name, commission_type, calculation_basis, base_rate, tier_rules, minimum_threshold, is_active)
SELECT * FROM (VALUES
    (get_current_user_tenant_id(), 'Standard New Business', 'percentage', 'deal_value', 15.0::numeric, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 2}, {"tier": "gold", "bonus": 5}, {"tier": "platinum", "bonus": 10}]'::jsonb, 1000::numeric, true),
    (get_current_user_tenant_id(), 'Renewal Commission', 'percentage', 'deal_value', 5.0::numeric, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 1}, {"tier": "gold", "bonus": 2}, {"tier": "platinum", "bonus": 3}]'::jsonb, 500::numeric, true),
    (get_current_user_tenant_id(), 'Upsell Commission', 'percentage', 'deal_value', 10.0::numeric, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 2}, {"tier": "gold", "bonus": 4}, {"tier": "platinum", "bonus": 6}]'::jsonb, 1000::numeric, true)
) AS v(tenant_id, structure_name, commission_type, calculation_basis, base_rate, tier_rules, minimum_threshold, is_active)
WHERE NOT EXISTS (SELECT 1 FROM commission_structures WHERE tenant_id = get_current_user_tenant_id());

-- Insert sample leads
INSERT INTO sales_leads (tenant_id, company_name, contact_name, email, phone, source, status, estimated_value, probability, notes)
SELECT * FROM (VALUES
    (get_current_user_tenant_id(), 'Acme Corporation', 'Robert Martinez', 'r.martinez@acme.com', '555-1001', 'website', 'new'::lead_status, 25000::numeric, 20, 'Interested in cybersecurity assessment'),
    (get_current_user_tenant_id(), 'TechStart Inc', 'Jennifer Lee', 'j.lee@techstart.com', '555-1002', 'referral', 'contacted'::lead_status, 15000::numeric, 40, 'Cloud migration project'),
    (get_current_user_tenant_id(), 'Global Manufacturing', 'David Chen', 'd.chen@globalmanuf.com', '555-1003', 'trade_show', 'qualified'::lead_status, 45000::numeric, 60, 'Enterprise security overhaul'),
    (get_current_user_tenant_id(), 'Healthcare Plus', 'Amanda Rodriguez', 'a.rodriguez@healthplus.com', '555-1004', 'cold_call', 'proposal'::lead_status, 35000::numeric, 75, 'HIPAA compliance solution')
) AS v(tenant_id, company_name, contact_name, email, phone, source, status, estimated_value, probability, notes)
WHERE NOT EXISTS (SELECT 1 FROM sales_leads WHERE tenant_id = get_current_user_tenant_id());

-- Insert sample deals
INSERT INTO sales_deals (tenant_id, agent_id, deal_name, deal_value, probability, stage, expected_close_date, commission_rate, notes)
SELECT v.tenant_id, a.id, v.deal_name, v.deal_value, v.probability, v.stage, v.expected_close_date, v.commission_rate, v.notes
FROM (VALUES
    (get_current_user_tenant_id(), 'john.smith@company.com', 'Enterprise Security Package', 50000::numeric, 80, 'negotiation'::deal_stage, CURRENT_DATE + INTERVAL '15 days', 15.0::numeric, 'Large enterprise deal, high priority'),
    (get_current_user_tenant_id(), 'sarah.johnson@company.com', 'Cloud Migration Project', 30000::numeric, 65, 'proposal'::deal_stage, CURRENT_DATE + INTERVAL '30 days', 12.0::numeric, 'SMB cloud transformation'),
    (get_current_user_tenant_id(), 'mike.davis@company.com', 'Compliance Audit Services', 20000::numeric, 90, 'closed_won'::deal_stage, CURRENT_DATE - INTERVAL '5 days', 10.0::numeric, 'Successfully closed healthcare compliance deal'),
    (get_current_user_tenant_id(), 'lisa.wilson@company.com', 'Retail Security Assessment', 15000::numeric, 45, 'needs_analysis'::deal_stage, CURRENT_DATE + INTERVAL '45 days', 8.0::numeric, 'Retail chain security evaluation')
) AS v(tenant_id, email, deal_name, deal_value, probability, stage, expected_close_date, commission_rate, notes)
LEFT JOIN sales_agents a ON a.email = v.email AND a.tenant_id = v.tenant_id
WHERE NOT EXISTS (SELECT 1 FROM sales_deals WHERE tenant_id = get_current_user_tenant_id());

-- Insert sample lead distribution rules
INSERT INTO lead_distribution_rules (tenant_id, rule_name, rule_type, conditions, priority, is_active)
SELECT * FROM (VALUES
    (get_current_user_tenant_id(), 'Enterprise Leads to Top Performers', 'top_performer', '{"min_deal_value": 40000, "specialization": "Enterprise"}'::jsonb, 1, true),
    (get_current_user_tenant_id(), 'Territory-Based Assignment', 'territory', '{"match_by": "state"}'::jsonb, 2, true),
    (get_current_user_tenant_id(), 'Specialization Matching', 'specialization', '{"match_required": true}'::jsonb, 3, true),
    (get_current_user_tenant_id(), 'Capacity-Based Fallback', 'capacity', '{"max_load_percentage": 80}'::jsonb, 4, true),
    (get_current_user_tenant_id(), 'Round Robin Default', 'round_robin', '{}'::jsonb, 5, true)
) AS v(tenant_id, rule_name, rule_type, conditions, priority, is_active)
WHERE NOT EXISTS (SELECT 1 FROM lead_distribution_rules WHERE tenant_id = get_current_user_tenant_id());