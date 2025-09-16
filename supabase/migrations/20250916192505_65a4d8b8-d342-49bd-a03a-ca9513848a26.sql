-- Phase 1: Create sample data for demonstration and testing
-- Get the tenant ID for the demo company
DO $$
DECLARE
    demo_tenant_id uuid := '53ffcba2-59e1-4189-8271-600d5ada2a99';
    demo_user_id uuid;
BEGIN
    -- Get a user from the tenant for created_by fields
    SELECT id INTO demo_user_id FROM users WHERE tenant_id = demo_tenant_id LIMIT 1;

    -- Insert sample items into proposal_catalog
    INSERT INTO proposal_catalog (
      tenant_id,
      name,
      description,
      category,
      item_type,
      unit_price,
      cost_price,
      margin_percent,
      sku,
      qbo_sync_status,
      is_active
    ) VALUES 
      (demo_tenant_id, 'Network Security Assessment', 'Comprehensive cybersecurity evaluation and vulnerability assessment', 'Security Services', 'service', 2500.00, 1500.00, 40.0, 'NSA-001', 'pending', true),
      (demo_tenant_id, 'Managed IT Support - Business Hours', 'Remote and on-site IT support during business hours', 'Managed Services', 'service', 150.00, 75.00, 50.0, 'MIT-BH-001', 'pending', true),
      (demo_tenant_id, 'Cloud Migration Services', 'Complete migration to cloud infrastructure', 'Cloud Services', 'service', 5000.00, 3000.00, 40.0, 'CMS-001', 'pending', true),
      (demo_tenant_id, 'Firewall Configuration', 'Enterprise firewall setup and configuration', 'Network Infrastructure', 'service', 800.00, 400.00, 50.0, 'FW-CONFIG-001', 'pending', true),
      (demo_tenant_id, 'Monthly Backup Monitoring', 'Automated backup monitoring and reporting', 'Managed Services', 'subscription', 200.00, 50.00, 75.0, 'MBM-001', 'pending', true),
      (demo_tenant_id, 'Business Router - Enterprise Grade', 'High-performance business router', 'Hardware', 'product', 450.00, 300.00, 33.3, 'BR-ENT-001', 'pending', true),
      (demo_tenant_id, 'Server Maintenance Contract', 'Annual server maintenance and support', 'Support Services', 'subscription', 1200.00, 600.00, 50.0, 'SMC-001', 'pending', true),
      (demo_tenant_id, 'Data Recovery Service', 'Emergency data recovery and restoration', 'Emergency Services', 'service', 1500.00, 800.00, 46.7, 'DRS-001', 'pending', true);

    -- Insert sample items into service_catalog as well for backward compatibility
    IF demo_user_id IS NOT NULL THEN
        INSERT INTO service_catalog (
          tenant_id,
          name,
          description,
          category,
          base_price,
          pricing_model,
          sla_response_hours,
          sla_resolution_hours,
          is_active,
          created_by
        ) VALUES 
          (demo_tenant_id, 'Network Security Assessment', 'Comprehensive cybersecurity evaluation and vulnerability assessment', 'Security Services', 2500.00, 'fixed', 4, 72, true, demo_user_id),
          (demo_tenant_id, 'Managed IT Support - Business Hours', 'Remote and on-site IT support during business hours', 'Managed Services', 150.00, 'hourly', 1, 8, true, demo_user_id),
          (demo_tenant_id, 'Cloud Migration Services', 'Complete migration to cloud infrastructure', 'Cloud Services', 5000.00, 'project', 8, 168, true, demo_user_id),
          (demo_tenant_id, 'Server Maintenance Contract', 'Annual server maintenance and support', 'Support Services', 1200.00, 'subscription', 2, 24, true, demo_user_id);
    END IF;
END $$;

-- Create function to sync proposal items with catalog
CREATE OR REPLACE FUNCTION public.sync_proposal_item_with_catalog(
  p_tenant_id UUID,
  p_item_name TEXT,
  p_description TEXT,
  p_unit_price NUMERIC,
  p_category TEXT DEFAULT 'General Services'
) RETURNS UUID AS $$
DECLARE
  catalog_item_id UUID;
  existing_item_id UUID;
BEGIN
  -- Check if item already exists in catalog
  SELECT id INTO existing_item_id
  FROM proposal_catalog
  WHERE tenant_id = p_tenant_id 
  AND LOWER(name) = LOWER(p_item_name)
  LIMIT 1;
  
  IF existing_item_id IS NOT NULL THEN
    -- Update existing item with latest pricing
    UPDATE proposal_catalog
    SET 
      unit_price = p_unit_price,
      description = COALESCE(p_description, description),
      category = COALESCE(p_category, category),
      updated_at = now()
    WHERE id = existing_item_id;
    
    RETURN existing_item_id;
  ELSE
    -- Create new catalog item
    INSERT INTO proposal_catalog (
      tenant_id,
      name,
      description,
      category,
      item_type,
      unit_price,
      cost_price,
      margin_percent,
      sku,
      is_active
    ) VALUES (
      p_tenant_id,
      p_item_name,
      COALESCE(p_description, p_item_name),
      p_category,
      'service',
      p_unit_price,
      p_unit_price * 0.6, -- Assume 40% margin
      40.0,
      UPPER(LEFT(REPLACE(p_item_name, ' ', ''), 10)) || '-' || LPAD(FLOOR(RANDOM() * 999 + 1)::text, 3, '0'),
      true
    ) RETURNING id INTO catalog_item_id;
    
    RETURN catalog_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;