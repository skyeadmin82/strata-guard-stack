-- Enhanced Authentication & Security Tables
CREATE TYPE lockout_reason AS ENUM ('failed_attempts', 'security_violation', 'admin_action', 'suspicious_activity');
CREATE TYPE auth_event_type AS ENUM ('login_success', 'login_failed', 'password_reset_requested', 'password_reset_completed', 'account_locked', 'account_unlocked', '2fa_enabled', '2fa_disabled', 'session_expired');
CREATE TYPE ticket_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'in_progress', 'pending_client', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE request_type AS ENUM ('access_request', 'service_request', 'change_request', 'incident_report', 'general_inquiry');
CREATE TYPE file_scan_status AS ENUM ('pending', 'scanning', 'clean', 'infected', 'error');
CREATE TYPE booking_status AS ENUM ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE message_status AS ENUM ('draft', 'sent', 'delivered', 'read', 'failed', 'bounced');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE data_export_status AS ENUM ('requested', 'processing', 'completed', 'failed', 'expired');
CREATE TYPE session_status AS ENUM ('active', 'expired', 'terminated', 'locked');

-- User Authentication Security
CREATE TABLE user_auth_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Account Lockout
    is_locked BOOLEAN DEFAULT FALSE,
    lockout_reason lockout_reason,
    lockout_until TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    
    -- Password Management
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    password_reset_attempts INTEGER DEFAULT 0,
    last_password_change TIMESTAMP WITH TIME ZONE,
    password_history JSONB DEFAULT '[]'::jsonb,
    
    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    backup_codes JSONB DEFAULT '[]'::jsonb,
    last_2fa_verification TIMESTAMP WITH TIME ZONE,
    
    -- Session Management
    max_concurrent_sessions INTEGER DEFAULT 3,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id)
);

-- Authentication Events Log
CREATE TABLE auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    event_type auth_event_type NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    device_fingerprint TEXT,
    
    error_code TEXT,
    error_message TEXT,
    additional_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    session_token TEXT NOT NULL UNIQUE,
    status session_status DEFAULT 'active',
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_data JSONB,
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terminated_reason TEXT,
    terminated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    ticket_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'draft',
    priority ticket_priority DEFAULT 'medium',
    category TEXT,
    subcategory TEXT,
    
    -- Validation & Approval
    validation_errors JSONB DEFAULT '[]'::jsonb,
    required_fields_completed BOOLEAN DEFAULT FALSE,
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- SLA Tracking
    sla_due_date TIMESTAMP WITH TIME ZONE,
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolution_target TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    internal_notes TEXT,
    client_satisfaction_rating INTEGER CHECK (client_satisfaction_rating >= 1 AND client_satisfaction_rating <= 5),
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, ticket_number)
);

-- File Uploads
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- File Information
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    
    -- Virus Scanning
    scan_status file_scan_status DEFAULT 'pending',
    scan_result JSONB,
    scan_started_at TIMESTAMP WITH TIME ZONE,
    scan_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Access Control
    is_public BOOLEAN DEFAULT FALSE,
    access_permissions JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,
    
    -- Relationships
    related_entity_type TEXT, -- 'ticket', 'request', etc.
    related_entity_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Requests
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    request_number TEXT NOT NULL,
    request_type request_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'draft',
    priority ticket_priority DEFAULT 'medium',
    
    -- Validation & Workflow
    validation_errors JSONB DEFAULT '[]'::jsonb,
    required_approvals INTEGER DEFAULT 0,
    received_approvals INTEGER DEFAULT 0,
    approval_workflow JSONB DEFAULT '{}'::jsonb,
    
    -- Business Impact
    business_justification TEXT,
    estimated_cost DECIMAL(10,2),
    estimated_effort_hours INTEGER,
    impact_assessment JSONB,
    
    -- Scheduling
    requested_completion_date DATE,
    scheduled_start_date TIMESTAMP WITH TIME ZONE,
    scheduled_end_date TIMESTAMP WITH TIME ZONE,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, request_number)
);

-- Service Catalog
CREATE TABLE service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    availability_schedule JSONB, -- Working hours, blackout dates
    max_concurrent_requests INTEGER DEFAULT 10,
    current_active_requests INTEGER DEFAULT 0,
    
    -- Pricing & SLA
    base_price DECIMAL(10,2),
    pricing_model TEXT, -- 'fixed', 'hourly', 'monthly'
    sla_response_hours INTEGER,
    sla_resolution_hours INTEGER,
    
    -- Requirements
    required_fields JSONB DEFAULT '[]'::jsonb,
    approval_required BOOLEAN DEFAULT FALSE,
    required_permissions TEXT[],
    
    -- Automation
    auto_assignment_rules JSONB,
    workflow_template JSONB,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking System
CREATE TABLE service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    service_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
    
    booking_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status booking_status DEFAULT 'requested',
    
    -- Scheduling with Conflict Prevention
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    
    -- Resources
    assigned_technician UUID REFERENCES users(id) ON DELETE SET NULL,
    required_resources JSONB DEFAULT '[]'::jsonb,
    location_type TEXT, -- 'onsite', 'remote', 'office'
    location_details JSONB,
    
    -- Conflict Detection
    conflicts_checked_at TIMESTAMP WITH TIME ZONE,
    has_conflicts BOOLEAN DEFAULT FALSE,
    conflict_details JSONB DEFAULT '[]'::jsonb,
    
    -- Confirmation & Reminders
    confirmation_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Rescheduling
    original_booking_id UUID REFERENCES service_bookings(id) ON DELETE SET NULL,
    reschedule_reason TEXT,
    reschedule_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, booking_number),
    
    -- Prevent overlapping bookings for same resource
    EXCLUDE USING gist (
        assigned_technician WITH =,
        tsrange(start_time, end_time) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'completed'))
);

-- Messages & Communication
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Participants
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type TEXT DEFAULT 'user', -- 'user', 'system', 'client'
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_type TEXT DEFAULT 'user',
    
    -- Message Content
    subject TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'direct', -- 'direct', 'broadcast', 'notification'
    thread_id UUID,
    
    -- Status & Delivery
    status message_status DEFAULT 'draft',
    delivery_attempts INTEGER DEFAULT 0,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    read_receipt_requested BOOLEAN DEFAULT FALSE,
    
    -- Error Handling
    delivery_errors JSONB DEFAULT '[]'::jsonb,
    bounce_reason TEXT,
    bounce_details JSONB,
    
    -- Relationships
    related_entity_type TEXT, -- 'ticket', 'booking', etc.
    related_entity_id UUID,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Types
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Event Preferences
    ticket_updates JSONB DEFAULT '{"email": true, "in_app": true}'::jsonb,
    booking_reminders JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
    system_alerts JSONB DEFAULT '{"email": true, "in_app": true}'::jsonb,
    promotional JSONB DEFAULT '{"email": false, "sms": false}'::jsonb,
    
    -- Timing Preferences
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT DEFAULT 'UTC',
    frequency_limits JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id)
);

-- Data Export Requests
CREATE TABLE data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    export_type TEXT NOT NULL, -- 'tickets', 'reports', 'audit_logs', etc.
    export_format TEXT DEFAULT 'csv', -- 'csv', 'json', 'pdf'
    
    -- Filters & Parameters
    date_range JSONB,
    filters JSONB DEFAULT '{}'::jsonb,
    include_sensitive_data BOOLEAN DEFAULT FALSE,
    
    -- Status & Results
    status data_export_status DEFAULT 'requested',
    progress_percentage INTEGER DEFAULT 0,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    -- File Information
    file_path TEXT,
    file_size BIGINT,
    download_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    
    -- Audit Trail
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    error_message TEXT,
    error_details JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Access & Rate Limiting
CREATE TABLE api_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    token_preview TEXT NOT NULL, -- First/last few characters for display
    
    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
    allowed_ips INET[],
    allowed_origins TEXT[],
    
    -- Rate Limiting
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    current_hour_count INTEGER DEFAULT 0,
    current_day_count INTEGER DEFAULT 0,
    last_reset_hour TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reset_day DATE DEFAULT CURRENT_DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Actor Information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    -- Action Details
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
    resource_type TEXT NOT NULL, -- 'ticket', 'user', 'file', etc.
    resource_id UUID,
    resource_name TEXT,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    api_endpoint TEXT,
    http_method TEXT,
    
    -- Risk Assessment
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
    risk_factors TEXT[],
    
    -- Metadata
    additional_context JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help Articles & Documentation
CREATE TABLE help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- Organization
    category TEXT NOT NULL,
    subcategory TEXT,
    tags TEXT[],
    
    -- Visibility & Access
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    visibility_level TEXT DEFAULT 'all', -- 'all', 'clients', 'internal'
    required_permissions TEXT[],
    
    -- Content Management
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES help_articles(id) ON DELETE SET NULL,
    content_hash TEXT,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    not_helpful_votes INTEGER DEFAULT 0,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, slug)
);

-- Create indexes for better performance
CREATE INDEX idx_user_auth_security_user_id ON user_auth_security(user_id);
CREATE INDEX idx_user_auth_security_tenant_lockout ON user_auth_security(tenant_id, is_locked);
CREATE INDEX idx_auth_events_user_type ON auth_events(user_id, event_type);
CREATE INDEX idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX idx_user_sessions_user_status ON user_sessions(user_id, status);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_support_tickets_client_status ON support_tickets(client_id, status);
CREATE INDEX idx_support_tickets_assigned_status ON support_tickets(assigned_to, status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_file_uploads_scan_status ON file_uploads(scan_status);
CREATE INDEX idx_service_requests_client_status ON service_requests(client_id, status);
CREATE INDEX idx_service_bookings_time_range ON service_bookings USING gist (tsrange(start_time, end_time));
CREATE INDEX idx_service_bookings_technician_time ON service_bookings(assigned_technician, start_time);
CREATE INDEX idx_messages_recipient_status ON messages(recipient_id, status);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_help_articles_category_published ON help_articles(category, is_published);

-- Enable Row Level Security
ALTER TABLE user_auth_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage their own auth security" ON user_auth_security FOR ALL USING (
  tenant_id = get_current_user_tenant_id() AND user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view auth events in their tenant" ON auth_events FOR SELECT USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can manage their own sessions" ON user_sessions FOR ALL USING (
  tenant_id = get_current_user_tenant_id() AND user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage tickets in their tenant" ON support_tickets FOR ALL USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can manage file uploads in their tenant" ON file_uploads FOR ALL USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can manage service requests in their tenant" ON service_requests FOR ALL USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can view service catalog in their tenant" ON service_catalog FOR SELECT USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can manage service bookings in their tenant" ON service_bookings FOR ALL USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can manage messages in their tenant" ON messages FOR ALL USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can manage their notification preferences" ON notification_preferences FOR ALL USING (
  tenant_id = get_current_user_tenant_id() AND user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage data export requests in their tenant" ON data_export_requests FOR ALL USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can manage their API tokens" ON api_access_tokens FOR ALL USING (
  tenant_id = get_current_user_tenant_id() AND user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view audit logs in their tenant" ON audit_logs FOR SELECT USING (
  tenant_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can view help articles in their tenant" ON help_articles FOR SELECT USING (
  tenant_id = get_current_user_tenant_id() AND is_published = TRUE
);

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_user_auth_security_updated_at BEFORE UPDATE ON user_auth_security FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON service_catalog FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_data_export_requests_updated_at BEFORE UPDATE ON data_export_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_api_access_tokens_updated_at BEFORE UPDATE ON api_access_tokens FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_help_articles_updated_at BEFORE UPDATE ON help_articles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();