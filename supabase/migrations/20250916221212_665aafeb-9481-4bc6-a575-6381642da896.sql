-- Add sample sales data using existing tenant

-- Insert sample sales agents
INSERT INTO sales_agents (tenant_id, first_name, last_name, email, phone, agent_code, tier, commission_rate) VALUES
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', 'John', 'Smith', 'john.smith@company.com', '555-0101', 'JS001', 'platinum', 15.0),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', 'Sarah', 'Johnson', 'sarah.johnson@company.com', '555-0102', 'SJ002', 'gold', 12.0),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', 'Mike', 'Davis', 'mike.davis@company.com', '555-0103', 'MD003', 'silver', 10.0),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', 'Lisa', 'Wilson', 'lisa.wilson@company.com', '555-0104', 'LW004', 'bronze', 8.0)
ON CONFLICT (tenant_id, agent_code) DO NOTHING;

-- Insert sample commission structures
INSERT INTO commission_structures (tenant_id, structure_name, commission_type, calculation_basis, base_rate, tier_rules, minimum_threshold, is_active) VALUES
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', 'Standard New Business', 'percentage', 'deal_value', 15.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 2}, {"tier": "gold", "bonus": 5}, {"tier": "platinum", "bonus": 10}]'::jsonb, 1000, true),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', 'Renewal Commission', 'percentage', 'deal_value', 5.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 1}, {"tier": "gold", "bonus": 2}, {"tier": "platinum", "bonus": 3}]'::jsonb, 500, true),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', 'Upsell Commission', 'percentage', 'deal_value', 10.0, '[{"tier": "bronze", "bonus": 0}, {"tier": "silver", "bonus": 2}, {"tier": "gold", "bonus": 4}, {"tier": "platinum", "bonus": 6}]'::jsonb, 1000, true)
ON CONFLICT (tenant_id, structure_name) DO NOTHING;

-- Insert sample commission transactions
INSERT INTO commission_transactions (tenant_id, agent_id, amount, rate, status, transaction_type, calculation_basis) VALUES
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', (SELECT id FROM sales_agents WHERE agent_code = 'JS001' AND tenant_id = '6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa' LIMIT 1), 7500.00, 15.0, 'paid', 'new_business', 'deal_value'),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', (SELECT id FROM sales_agents WHERE agent_code = 'SJ002' AND tenant_id = '6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa' LIMIT 1), 3600.00, 12.0, 'approved', 'renewal', 'deal_value'),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', (SELECT id FROM sales_agents WHERE agent_code = 'MD003' AND tenant_id = '6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa' LIMIT 1), 2000.00, 10.0, 'paid', 'upsell', 'deal_value'),
('6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa', (SELECT id FROM sales_agents WHERE agent_code = 'LW004' AND tenant_id = '6aa5af5f-a19a-41b1-8e08-fa5d48b0f3fa' LIMIT 1), 1200.00, 8.0, 'pending', 'new_business', 'deal_value');