-- Add comprehensive sample data for enterprise-ready sales dashboard

DO $$
DECLARE
    default_tenant_id UUID;
    agent1_id UUID;
    agent2_id UUID;
    agent3_id UUID;
    lead1_id UUID;
    lead2_id UUID;
    lead3_id UUID;
    deal1_id UUID;
    deal2_id UUID;
BEGIN
    -- Get existing tenant
    SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    
    -- Get existing agent IDs
    SELECT id INTO agent1_id FROM sales_agents WHERE agent_code = 'DEMO001' LIMIT 1;
    SELECT id INTO agent2_id FROM sales_agents WHERE agent_code = 'DEMO002' LIMIT 1;
    SELECT id INTO agent3_id FROM sales_agents WHERE agent_code = 'DEMO003' LIMIT 1;
    
    -- Add sample leads
    IF NOT EXISTS (SELECT 1 FROM sales_leads WHERE tenant_id = default_tenant_id AND company_name = 'TechFlow Industries') THEN
        INSERT INTO sales_leads (
            tenant_id, company_name, contact_name, email, phone, website,
            industry, company_size, status, temperature, score, estimated_value,
            budget_range, decision_timeline, interested_services,
            assigned_agent_id, lead_source, last_contact_at
        ) VALUES (
            default_tenant_id, 'TechFlow Industries', 'Michael Roberts', 'mike@techflow.com', '555-9001', 'techflow.com',
            'Technology', '50-200', 'qualified', 'hot', 85, 125000,
            '$100K-$200K', '1-3 months', ARRAY['Cloud Migration', 'Security Assessment', 'Network Monitoring'],
            agent1_id, 'Website', NOW() - INTERVAL '2 days'
        ) RETURNING id INTO lead1_id;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_leads WHERE tenant_id = default_tenant_id AND company_name = 'Global Manufacturing') THEN
        INSERT INTO sales_leads (
            tenant_id, company_name, contact_name, email, phone, website,
            industry, company_size, status, temperature, score, estimated_value,
            budget_range, decision_timeline, interested_services,
            assigned_agent_id, lead_source, last_contact_at
        ) VALUES (
            default_tenant_id, 'Global Manufacturing', 'Sarah Chen', 'sarah@globalmfg.com', '555-9002', 'globalmfg.com',
            'Manufacturing', '200-500', 'contacted', 'warm', 72, 200000,
            '$150K-$300K', '3-6 months', ARRAY['ERP Integration', 'Backup Solutions', 'IT Support'],
            agent2_id, 'Referral', NOW() - INTERVAL '1 week'
        ) RETURNING id INTO lead2_id;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_leads WHERE tenant_id = default_tenant_id AND company_name = 'StartUp Dynamics') THEN
        INSERT INTO sales_leads (
            tenant_id, company_name, contact_name, email, phone,
            industry, company_size, status, temperature, score, estimated_value,
            budget_range, decision_timeline, interested_services,
            lead_source, last_contact_at
        ) VALUES (
            default_tenant_id, 'StartUp Dynamics', 'Alex Johnson', 'alex@startup.com', '555-9003',
            'Software', '10-50', 'new', 'cold', 45, 45000,
            '$30K-$75K', '6-12 months', ARRAY['Basic IT Support', 'Email Hosting'],
            'Cold Call', NOW() - INTERVAL '3 days'
        ) RETURNING id INTO lead3_id;
    END IF;
    
    -- Add sample deals
    IF NOT EXISTS (SELECT 1 FROM sales_deals WHERE tenant_id = default_tenant_id AND deal_name = 'TechFlow Cloud Migration') THEN
        INSERT INTO sales_deals (
            tenant_id, deal_name, client_id, lead_id, assigned_agent_id,
            stage, deal_value, probability, commission_rate, commission_amount,
            expected_close_date, created_at, deal_type, deal_source
        ) VALUES (
            default_tenant_id, 'TechFlow Cloud Migration', NULL, lead1_id, agent1_id,
            'proposal', 125000, 75, 15.0, 18750,
            (CURRENT_DATE + INTERVAL '15 days'), NOW() - INTERVAL '5 days',
            'new_business', 'inbound_lead'
        ) RETURNING id INTO deal1_id;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM sales_deals WHERE tenant_id = default_tenant_id AND deal_name = 'Global Mfg ERP Project') THEN
        INSERT INTO sales_deals (
            tenant_id, deal_name, client_id, lead_id, assigned_agent_id,
            stage, deal_value, probability, commission_rate, commission_amount,
            expected_close_date, created_at, deal_type, deal_source
        ) VALUES (
            default_tenant_id, 'Global Mfg ERP Project', NULL, lead2_id, agent2_id,
            'negotiation', 200000, 60, 12.0, 24000,
            (CURRENT_DATE + INTERVAL '45 days'), NOW() - INTERVAL '2 weeks',
            'new_business', 'referral'
        ) RETURNING id INTO deal2_id;
    END IF;
    
    -- Add closed won deal for analytics
    IF NOT EXISTS (SELECT 1 FROM sales_deals WHERE tenant_id = default_tenant_id AND deal_name = 'Acme Corp IT Overhaul') THEN
        INSERT INTO sales_deals (
            tenant_id, deal_name, assigned_agent_id,
            stage, deal_value, probability, commission_rate, commission_amount,
            expected_close_date, actual_close_date, created_at, deal_type, deal_source
        ) VALUES (
            default_tenant_id, 'Acme Corp IT Overhaul', agent3_id,
            'closed_won', 85000, 100, 10.0, 8500,
            (CURRENT_DATE - INTERVAL '5 days'), (CURRENT_DATE - INTERVAL '3 days'),
            NOW() - INTERVAL '3 weeks', 'new_business', 'cold_outreach'
        );
    END IF;
    
    -- Add sample commission transactions
    IF NOT EXISTS (SELECT 1 FROM commission_transactions WHERE tenant_id = default_tenant_id AND deal_id = deal1_id) THEN
        INSERT INTO commission_transactions (
            tenant_id, agent_id, deal_id, amount, rate, status,
            transaction_type, calculation_basis, commission_period_start, commission_period_end,
            payment_date, notes
        ) VALUES (
            default_tenant_id, agent1_id, deal1_id, 18750, 15.0, 'pending',
            'deal_commission', 'deal_value', DATE_TRUNC('month', CURRENT_DATE), 
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
            CURRENT_DATE + INTERVAL '30 days', 'Commission for TechFlow deal'
        );
    END IF;
    
    -- Add paid commission for closed deal
    INSERT INTO commission_transactions (
        tenant_id, agent_id, amount, rate, status,
        transaction_type, calculation_basis, commission_period_start, commission_period_end,
        payment_date, approved_at, approved_by, notes
    ) VALUES (
        default_tenant_id, agent3_id, 8500, 10.0, 'paid',
        'deal_commission', 'deal_value', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
        CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '2 days', 
        (SELECT id FROM users WHERE tenant_id = default_tenant_id LIMIT 1),
        'Commission paid for Acme Corp deal'
    ) ON CONFLICT DO NOTHING;
    
    -- Add monthly bonus commission
    INSERT INTO commission_transactions (
        tenant_id, agent_id, amount, status,
        transaction_type, calculation_basis, commission_period_start, commission_period_end,
        payment_date, approved_at, notes
    ) VALUES (
        default_tenant_id, agent2_id, 2500, 'approved',
        'monthly_bonus', 'performance_tier', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
        CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE - INTERVAL '1 day',
        'Gold tier performance bonus for exceeding targets'
    ) ON CONFLICT DO NOTHING;
    
END $$;