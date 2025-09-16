-- Add sample sales data using direct tenant lookup

-- First, let's get or create a default tenant
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Try to get the first available tenant
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    
    -- If no tenant exists, create one
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, plan) 
        VALUES ('Demo Company', 'demo-company', 'starter') 
        RETURNING id INTO default_tenant_id;
    END IF;
    
    -- Insert sample sales agents
    INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) VALUES
    (default_tenant_id, 'John', 'Smith', 'john.smith@company.com', '555-0101', 'JS001', 'platinum', 15.0),
    (default_tenant_id, 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0102', 'SJ002', 'gold', 12.0),
    (default_tenant_id, 'Mike', 'Davis', 'mike.davis@company.com', '555-0103', 'MD003', 'silver', 10.0),
    (default_tenant_id, 'Lisa', 'Wilson', 'lisa.wilson@company.com', '555-0104', 'LW004', 'bronze', 8.0)
    ON CONFLICT (tenant_id, agent_code) DO NOTHING;
    
    -- Insert sample commission structures
    INSERT INTO commission_structures (tenant_id, structure_name, commission_type, calculation_basis, base_rate, tier_rules, minimum_threshold, is_active) VALUES
    (default_tenant_id, 'Standard New Business', 'percentage', 'deal_value', 15.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 2}, {"tier": "gold", "bonus": 5}, {"tier": "platinum", "bonus": 10}]'::jsonb, 1000, true),
    (default_tenant_id, 'Renewal Commission', 'percentage', 'deal_value', 5.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 1}, {"tier": "gold", "bonus": 2}, {"tier": "platinum", "bonus": 3}]'::jsonb, 500, true),
    (default_tenant_id, 'Upsell Commission', 'percentage', 'deal_value', 10.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 2}, {"tier": "gold", "bonus": 4}, {"tier": "platinum", "bonus": 6}]'::jsonb, 1000, true)
    ON CONFLICT (tenant_id, structure_name) DO NOTHING;
    
    -- Insert sample commission transactions
    INSERT INTO commission_transactions (tenant_id, agent_id, amount, rate, status, transaction_type, calculation_basis) VALUES
    (default_tenant_id, (SELECT id FROM sales_agents WHERE agent_code = 'JS001' AND tenant_id = default_tenant_id LIMIT 1), 7500.00, 15.0, 'paid', 'new_business', 'deal_value'),
    (default_tenant_id, (SELECT id FROM sales_agents WHERE agent_code = 'SJ002' AND tenant_id = default_tenant_id LIMIT 1), 3600.00, 12.0, 'approved', 'renewal', 'deal_value'),
    (default_tenant_id, (SELECT id FROM sales_agents WHERE agent_code = 'MD003' AND tenant_id = default_tenant_id LIMIT 1), 2000.00, 10.0, 'paid', 'upsell', 'deal_value'),
    (default_tenant_id, (SELECT id FROM sales_agents WHERE agent_code = 'LW004' AND tenant_id = default_tenant_id LIMIT 1), 1200.00, 8.0, 'pending', 'new_business', 'deal_value');
    
    -- Update sales agents with additional data
    UPDATE sales_agents SET 
        quota_monthly = CASE agent_code
            WHEN 'JS001' THEN 50000
            WHEN 'SJ002' THEN 35000
            WHEN 'MD003' THEN 30000
            WHEN 'LW004' THEN 25000
            ELSE COALESCE(quota_monthly, 0)
        END,
        quota_quarterly = CASE agent_code
            WHEN 'JS001' THEN 150000
            WHEN 'SJ002' THEN 105000
            WHEN 'MD003' THEN 90000
            WHEN 'LW004' THEN 75000
            ELSE COALESCE(quota_quarterly, 0)
        END,
        quota_annual = CASE agent_code
            WHEN 'JS001' THEN 600000
            WHEN 'SJ002' THEN 420000
            WHEN 'MD003' THEN 360000
            WHEN 'LW004' THEN 300000
            ELSE COALESCE(quota_annual, 0)
        END,
        performance_score = CASE agent_code
            WHEN 'JS001' THEN 95.2
            WHEN 'SJ002' THEN 87.8
            WHEN 'MD003' THEN 76.5
            WHEN 'LW004' THEN 68.3
            ELSE COALESCE(performance_score, 0)
        END,
        territory = CASE agent_code
            WHEN 'JS001' THEN '{"region": "North", "states": ["NY", "NJ", "CT"]}'::jsonb
            WHEN 'SJ002' THEN '{"region": "South", "states": ["TX", "FL", "GA"]}'::jsonb
            WHEN 'MD003' THEN '{"region": "West", "states": ["CA", "WA", "OR"]}'::jsonb
            WHEN 'LW004' THEN '{"region": "Midwest", "states": ["IL", "OH", "MI"]}'::jsonb
            ELSE COALESCE(territory, '{}'::jsonb)
        END,
        specializations = CASE agent_code
            WHEN 'JS001' THEN ARRAY['Enterprise', 'Cybersecurity']
            WHEN 'SJ002' THEN ARRAY['SMB', 'Cloud Services'] 
            WHEN 'MD003' THEN ARRAY['Healthcare', 'Compliance']
            WHEN 'LW004' THEN ARRAY['Manufacturing', 'Retail']
            ELSE COALESCE(specializations, ARRAY[]::text[])
        END
    WHERE tenant_id = default_tenant_id AND agent_code IN ('JS001', 'SJ002', 'MD003', 'LW004');
    
END $$;