-- Create sales enums and enhance existing tables

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

-- Create triggers for updated_at if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (will error if they exist, which is fine)
DO $$ 
BEGIN
    CREATE TRIGGER update_sales_agents_updated_at 
        BEFORE UPDATE ON sales_agents 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TRIGGER update_sales_leads_updated_at 
        BEFORE UPDATE ON sales_leads 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TRIGGER update_sales_deals_updated_at 
        BEFORE UPDATE ON sales_deals 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TRIGGER update_lead_distribution_rules_updated_at 
        BEFORE UPDATE ON lead_distribution_rules 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;