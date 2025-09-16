-- Add sample sales data

DO $$
DECLARE
    default_tenant_id UUID;
    sample_agent_id UUID;
BEGIN
    -- Get the first available tenant
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    
    -- If no tenant exists, create one
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, plan) 
        VALUES ('Demo Company', 'demo-company', 'starter') 
        RETURNING id INTO default_tenant_id;
    END IF;
    
    -- Insert sample sales agents if they don't exist
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'JS001') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'John', 'Smith', 'john.smith@company.com', '555-0101', 'JS001', 'platinum', 15.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'SJ002') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0102', 'SJ002', 'gold', 12.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'MD003') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'Mike', 'Davis', 'mike.davis@company.com', '555-0103', 'MD003', 'silver', 10.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'LW004') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'Lisa', 'Wilson', 'lisa.wilson@company.com', '555-0104', 'LW004', 'bronze', 8.0);
    END IF;
    
    -- Insert sample commission structures if they don't exist
    IF NOT EXISTS (SELECT 1 FROM commission_structures WHERE tenant_id = default_tenant_id AND structure_name = 'Standard New Business') THEN
        INSERT INTO commission_structures (tenant_id, structure_name, commission_type, calculation_basis, base_rate, tier_rules, minimum_threshold, is_active) 
        VALUES (default_tenant_id, 'Standard New Business', 'percentage', 'deal_value', 15.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 2}, {"tier": "gold", "bonus": 5}, {"tier": "platinum", "bonus": 10}]'::jsonb, 1000, true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM commission_structures WHERE tenant_id = default_tenant_id AND structure_name = 'Renewal Commission') THEN
        INSERT INTO commission_structures (tenant_id, structure_name, commission_type, calculation_basis, base_rate, tier_rules, minimum_threshold, is_active) 
        VALUES (default_tenant_id, 'Renewal Commission', 'percentage', 'deal_value', 5.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 1}, {"tier": "gold", "bonus": 2}, {"tier": "platinum", "bonus": 3}]'::jsonb, 500, true);
    END IF;
    
    -- Insert sample commission transactions
    SELECT id INTO sample_agent_id FROM sales_agents WHERE agent_code = 'JS001' AND tenant_id = default_tenant_id LIMIT 1;
    IF sample_agent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM commission_transactions WHERE tenant_id = default_tenant_id AND agent_id = sample_agent_id AND amount = 7500.00) THEN
        INSERT INTO commission_transactions (tenant_id, agent_id, amount, rate, status, transaction_type, calculation_basis) 
        VALUES (default_tenant_id, sample_agent_id, 7500.00, 15.0, 'paid', 'new_business', 'deal_value');
    END IF;
    
    SELECT id INTO sample_agent_id FROM sales_agents WHERE agent_code = 'SJ002' AND tenant_id = default_tenant_id LIMIT 1;
    IF sample_agent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM commission_transactions WHERE tenant_id = default_tenant_id AND agent_id = sample_agent_id AND amount = 3600.00) THEN
        INSERT INTO commission_transactions (tenant_id, agent_id, amount, rate, status, transaction_type, calculation_basis) 
        VALUES (default_tenant_id, sample_agent_id, 3600.00, 12.0, 'approved', 'renewal', 'deal_value');
    END IF;
    
END $$;