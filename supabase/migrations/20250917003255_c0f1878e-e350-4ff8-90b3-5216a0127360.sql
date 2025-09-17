-- Add comprehensive sample data for the current user's tenant

DO $$
DECLARE
    user_tenant_id UUID;
    agent1_id UUID;
    agent2_id UUID;
    agent3_id UUID;
    lead1_id UUID;
    lead2_id UUID;
    lead3_id UUID;
BEGIN
    -- Get the current user's tenant ID
    SELECT tenant_id INTO user_tenant_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
    
    -- Only proceed if we have a tenant ID
    IF user_tenant_id IS NOT NULL THEN
        
        -- Get existing agent IDs or create them for this tenant
        SELECT id INTO agent1_id FROM sales_agents WHERE tenant_id = user_tenant_id ORDER BY created_at LIMIT 1;
        SELECT id INTO agent2_id FROM sales_agents WHERE tenant_id = user_tenant_id ORDER BY created_at OFFSET 1 LIMIT 1;
        SELECT id INTO agent3_id FROM sales_agents WHERE tenant_id = user_tenant_id ORDER BY created_at OFFSET 2 LIMIT 1;
        
        -- If no agents exist, create sample agents
        IF agent1_id IS NULL THEN
            INSERT INTO sales_agents (
                tenant_id, first_name, last_name, email, phone, agent_code, 
                tier, commission_rate, status, agent_type
            ) VALUES (
                user_tenant_id, 'John', 'Smith', 'john.smith@company.com', '555-0101', 
                'AGENT001', 'platinum', 15.0, 'active', 'internal'
            ) RETURNING id INTO agent1_id;
        END IF;
        
        IF agent2_id IS NULL THEN
            INSERT INTO sales_agents (
                tenant_id, first_name, last_name, email, phone, agent_code, 
                tier, commission_rate, status, agent_type
            ) VALUES (
                user_tenant_id, 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0102', 
                'AGENT002', 'gold', 12.0, 'active', 'internal'
            ) RETURNING id INTO agent2_id;
        END IF;
        
        IF agent3_id IS NULL THEN
            INSERT INTO sales_agents (
                tenant_id, first_name, last_name, email, phone, agent_code, 
                tier, commission_rate, status, agent_type
            ) VALUES (
                user_tenant_id, 'Mike', 'Davis', 'mike.davis@company.com', '555-0103', 
                'AGENT003', 'silver', 10.0, 'active', 'internal'
            ) RETURNING id INTO agent3_id;
        END IF;
        
        -- Add sample leads with only existing columns
        INSERT INTO sales_leads (
            tenant_id, company_name, contact_name, email, phone, website,
            industry, company_size, status, temperature, score, estimated_value,
            budget_range, decision_timeline, interested_services, assigned_agent_id
        ) VALUES (
            user_tenant_id, 'TechFlow Industries', 'Michael Roberts', 'mike@techflow.com', 
            '555-9001', 'techflow.com', 'Technology', '50-200', 'qualified', 'hot', 85, 125000,
            '$100K-$200K', '1-3 months', ARRAY['Cloud Migration', 'Security Assessment'], agent1_id
        ) RETURNING id INTO lead1_id;
        
        INSERT INTO sales_leads (
            tenant_id, company_name, contact_name, email, phone, website,
            industry, company_size, status, temperature, score, estimated_value,
            budget_range, decision_timeline, interested_services, assigned_agent_id
        ) VALUES (
            user_tenant_id, 'Global Manufacturing', 'Sarah Chen', 'sarah@globalmfg.com', 
            '555-9002', 'globalmfg.com', 'Manufacturing', '200-500', 'contacted', 'warm', 72, 200000,
            '$150K-$300K', '3-6 months', ARRAY['ERP Integration', 'Backup Solutions'], agent2_id
        ) RETURNING id INTO lead2_id;
        
        INSERT INTO sales_leads (
            tenant_id, company_name, contact_name, email, phone,
            industry, company_size, status, temperature, score, estimated_value,
            budget_range, decision_timeline, interested_services
        ) VALUES (
            user_tenant_id, 'StartUp Dynamics', 'Alex Johnson', 'alex@startup.com', '555-9003',
            'Software', '10-50', 'new', 'cold', 45, 45000,
            '$30K-$75K', '6-12 months', ARRAY['Basic IT Support', 'Email Hosting']
        ) RETURNING id INTO lead3_id;
        
        -- Add sample deals
        INSERT INTO sales_deals (
            tenant_id, deal_name, lead_id, assigned_agent_id, stage, deal_value, 
            probability, commission_rate, expected_close_date, deal_type
        ) VALUES (
            user_tenant_id, 'TechFlow Cloud Migration', lead1_id, agent1_id, 'proposal', 125000, 
            75, 15.0, (CURRENT_DATE + INTERVAL '15 days'), 'new_business'
        );
        
        INSERT INTO sales_deals (
            tenant_id, deal_name, lead_id, assigned_agent_id, stage, deal_value, 
            probability, commission_rate, expected_close_date, deal_type
        ) VALUES (
            user_tenant_id, 'Global Mfg ERP Project', lead2_id, agent2_id, 'negotiation', 200000, 
            60, 12.0, (CURRENT_DATE + INTERVAL '45 days'), 'new_business'
        );
        
        -- Add closed won deal for analytics
        INSERT INTO sales_deals (
            tenant_id, deal_name, assigned_agent_id, stage, deal_value, probability, 
            commission_rate, expected_close_date, actual_close_date, deal_type
        ) VALUES (
            user_tenant_id, 'Acme Corp IT Overhaul', agent3_id, 'closed_won', 85000, 100, 
            10.0, (CURRENT_DATE - INTERVAL '5 days'), (CURRENT_DATE - INTERVAL '3 days'), 'new_business'
        );
        
        -- Add sample commission transactions
        INSERT INTO commission_transactions (
            tenant_id, agent_id, amount, rate, status, transaction_type, 
            calculation_basis, payment_date, notes
        ) VALUES (
            user_tenant_id, agent1_id, 18750, 15.0, 'pending', 'deal_commission',
            'deal_value', CURRENT_DATE + INTERVAL '30 days', 'Commission for TechFlow deal'
        );
        
        INSERT INTO commission_transactions (
            tenant_id, agent_id, amount, rate, status, transaction_type, 
            calculation_basis, payment_date, notes
        ) VALUES (
            user_tenant_id, agent3_id, 8500, 10.0, 'paid', 'deal_commission',
            'deal_value', CURRENT_DATE - INTERVAL '1 day', 'Commission for Acme Corp deal'
        );
        
        INSERT INTO commission_transactions (
            tenant_id, agent_id, amount, status, transaction_type, 
            calculation_basis, payment_date, notes
        ) VALUES (
            user_tenant_id, agent2_id, 2500, 'approved', 'monthly_bonus',
            'performance_tier', CURRENT_DATE + INTERVAL '15 days', 'Gold tier performance bonus'
        );
        
    END IF;
    
END $$;