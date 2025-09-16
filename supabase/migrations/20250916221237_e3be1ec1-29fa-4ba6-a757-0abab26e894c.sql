-- Simple sample data creation
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Get or create tenant
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, plan) 
        VALUES ('Demo Company', 'demo-company', 'starter') 
        RETURNING id INTO default_tenant_id;
    END IF;
    
    -- Insert sample sales agents only
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'DEMO001') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'John', 'Smith', 'john.smith@company.com', '555-0101', 'DEMO001', 'platinum', 15.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'DEMO002') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0102', 'DEMO002', 'gold', 12.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'DEMO003') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'Mike', 'Davis', 'mike.davis@company.com', '555-0103', 'DEMO003', 'silver', 10.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_agents WHERE tenant_id = default_tenant_id AND agent_code = 'DEMO004') THEN
        INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) 
        VALUES (default_tenant_id, 'Lisa', 'Wilson', 'lisa.wilson@company.com', '555-0104', 'DEMO004', 'bronze', 8.0);
    END IF;
    
END $$;