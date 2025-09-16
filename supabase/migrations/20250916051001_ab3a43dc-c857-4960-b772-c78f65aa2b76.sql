-- Field Service Management Database Schema

-- Work Orders table
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  work_order_number TEXT NOT NULL,
  client_id UUID,
  assigned_technician_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT,
  location_address TEXT,
  location_coordinates JSONB, -- {lat, lng}
  scheduled_start_time TIMESTAMP WITH TIME ZONE,
  scheduled_end_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  estimated_duration_minutes INTEGER DEFAULT 60,
  service_type TEXT,
  equipment_details JSONB DEFAULT '{}',
  customer_signature JSONB,
  technician_signature JSONB,
  completion_notes TEXT,
  photo_attachments JSONB DEFAULT '[]',
  required_parts JSONB DEFAULT '[]',
  used_parts JSONB DEFAULT '[]',
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_sync', 'conflict')),
  offline_created_at TIMESTAMP WITH TIME ZONE,
  local_id TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time Tracking table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  work_order_id UUID,
  technician_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('work', 'travel', 'break', 'lunch')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  location_start JSONB, -- {lat, lng, address}
  location_end JSONB,
  notes TEXT,
  billable BOOLEAN DEFAULT true,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_sync', 'conflict')),
  offline_created_at TIMESTAMP WITH TIME ZONE,
  local_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parts Inventory table
CREATE TABLE public.parts_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  manufacturer TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  max_stock_level INTEGER DEFAULT 100,
  unit_cost DECIMAL(10,2),
  location TEXT,
  barcode TEXT,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_sync', 'conflict')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Field Service Photos table
CREATE TABLE public.field_service_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  work_order_id UUID,
  technician_id UUID NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'during', 'after', 'damage', 'completion', 'parts', 'other')),
  file_path TEXT,
  file_size INTEGER,
  compressed_file_path TEXT,
  compressed_file_size INTEGER,
  caption TEXT,
  location_coordinates JSONB,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_sync', 'conflict')),
  offline_created_at TIMESTAMP WITH TIME ZONE,
  local_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mobile Sync Queue table
CREATE TABLE public.sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'work_order', 'time_entry', 'photo', etc.
  entity_id UUID,
  local_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  data JSONB NOT NULL,
  priority INTEGER DEFAULT 1, -- 1 = high, 2 = medium, 3 = low
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Device Sessions table for offline tracking
CREATE TABLE public.device_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  session_token TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  offline_data_size BIGINT DEFAULT 0,
  battery_level INTEGER,
  data_usage_mb DECIMAL(10,2) DEFAULT 0,
  location_last_known JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Communication Messages table
CREATE TABLE public.field_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice', 'location', 'photo', 'emergency')),
  content TEXT,
  file_path TEXT,
  location_data JSONB,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  read_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_sync', 'conflict')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_service_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant access to work orders" ON public.work_orders FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to time entries" ON public.time_entries FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to parts inventory" ON public.parts_inventory FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to field service photos" ON public.field_service_photos FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to sync queue" ON public.sync_queue FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to device sessions" ON public.device_sessions FOR ALL USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "Tenant access to field messages" ON public.field_messages FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Indexes for performance
CREATE INDEX idx_work_orders_tenant_status ON public.work_orders (tenant_id, status);
CREATE INDEX idx_work_orders_technician ON public.work_orders (assigned_technician_id, status);
CREATE INDEX idx_work_orders_sync_status ON public.work_orders (sync_status);
CREATE INDEX idx_time_entries_work_order ON public.time_entries (work_order_id);
CREATE INDEX idx_time_entries_technician ON public.time_entries (technician_id);
CREATE INDEX idx_sync_queue_priority ON public.sync_queue (priority, sync_status);
CREATE INDEX idx_field_messages_recipient ON public.field_messages (recipient_id, delivery_status);

-- Triggers for updated_at
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_inventory_updated_at BEFORE UPDATE ON public.parts_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_field_service_photos_updated_at BEFORE UPDATE ON public.field_service_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sync_queue_updated_at BEFORE UPDATE ON public.sync_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_device_sessions_updated_at BEFORE UPDATE ON public.device_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_field_messages_updated_at BEFORE UPDATE ON public.field_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();