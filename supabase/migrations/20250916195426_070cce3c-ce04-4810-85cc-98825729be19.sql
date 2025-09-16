-- Create QBO integration tables
CREATE TABLE IF NOT EXISTS qbo_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL, -- QBO Company ID
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  company_name TEXT,
  company_info JSONB,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  sync_settings JSONB DEFAULT '{
    "sync_clients": true,
    "sync_invoices": true,
    "sync_payments": true,
    "sync_products": true,
    "auto_sync": true,
    "sync_frequency": "hourly"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, realm_id)
);

-- Create sync mapping table
CREATE TABLE IF NOT EXISTS qbo_sync_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'client', 'invoice', 'product', 'payment'
  local_id UUID NOT NULL,
  qbo_id TEXT NOT NULL,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, local_id),
  UNIQUE(tenant_id, entity_type, qbo_id)
);

-- Create sync log table
CREATE TABLE IF NOT EXISTS qbo_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  sync_direction TEXT, -- 'to_qbo', 'from_qbo'
  entity_type TEXT,
  entity_id TEXT,
  status TEXT, -- 'success', 'error', 'skipped'
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create QBO settings table
CREATE TABLE IF NOT EXISTS qbo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  default_income_account_id TEXT,
  default_expense_account_id TEXT,
  default_tax_code_id TEXT,
  invoice_terms_id TEXT,
  invoice_template_id TEXT,
  client_sync_rules JSONB DEFAULT '{
    "sync_as": "customer",
    "sync_contacts": true,
    "create_sub_customers": false
  }',
  invoice_sync_rules JSONB DEFAULT '{
    "auto_create": true,
    "auto_send": false,
    "include_time_entries": true,
    "group_by": "project"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance (skip if already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_qbo_connections_tenant') THEN
    CREATE INDEX idx_qbo_connections_tenant ON qbo_connections(tenant_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_qbo_mappings_lookup') THEN
    CREATE INDEX idx_qbo_mappings_lookup ON qbo_sync_mappings(tenant_id, entity_type, local_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_qbo_logs_tenant_date') THEN
    CREATE INDEX idx_qbo_logs_tenant_date ON qbo_sync_logs(tenant_id, created_at DESC);
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE qbo_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE qbo_sync_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE qbo_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qbo_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing first)
DROP POLICY IF EXISTS "Users can view own tenant QBO data" ON qbo_connections;
DROP POLICY IF EXISTS "Users can view own tenant QBO mappings" ON qbo_sync_mappings;
DROP POLICY IF EXISTS "Users can view own tenant QBO logs" ON qbo_sync_logs;
DROP POLICY IF EXISTS "Users can view own tenant QBO settings" ON qbo_settings;

CREATE POLICY "Users can view own tenant QBO data" ON qbo_connections
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view own tenant QBO mappings" ON qbo_sync_mappings
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view own tenant QBO logs" ON qbo_sync_logs
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view own tenant QBO settings" ON qbo_settings
  FOR ALL USING (tenant_id = get_current_user_tenant_id());