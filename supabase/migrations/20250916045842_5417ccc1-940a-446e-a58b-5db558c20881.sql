-- System Monitoring and Health Dashboard Schema

-- Performance Metrics Table
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  metric_type VARCHAR(100) NOT NULL, -- 'page_load', 'api_response', 'db_query', 'resource_usage'
  metric_name VARCHAR(255) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL, -- 'ms', 'seconds', 'bytes', 'percentage'
  
  -- Context
  page_url VARCHAR(500),
  api_endpoint VARCHAR(500),
  query_type VARCHAR(100),
  user_id UUID,
  session_id VARCHAR(255),
  
  -- Timing
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Additional metadata
  browser VARCHAR(100),
  device_type VARCHAR(50),
  connection_type VARCHAR(50),
  location_country VARCHAR(2),
  
  -- Aggregation helpers
  hour_bucket TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (date_trunc('hour', measured_at)) STORED,
  day_bucket DATE GENERATED ALWAYS AS (measured_at::date) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System Health Checks Table
CREATE TABLE public.system_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Service Info
  service_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- 'database', 'api', 'queue', 'storage', 'ssl_cert'
  endpoint_url VARCHAR(500),
  
  -- Health Status
  status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'maintenance')),
  response_time_ms INTEGER,
  status_code INTEGER,
  
  -- Detailed Results
  check_details JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Thresholds
  warning_threshold INTEGER DEFAULT 5000, -- ms
  critical_threshold INTEGER DEFAULT 10000, -- ms
  
  -- Timing
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_check_at TIMESTAMP WITH TIME ZONE,
  check_interval_seconds INTEGER DEFAULT 300, -- 5 minutes
  
  -- Alerting
  consecutive_failures INTEGER DEFAULT 0,
  last_alert_sent_at TIMESTAMP WITH TIME ZONE,
  alert_threshold INTEGER DEFAULT 3,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Error Tracking Table
CREATE TABLE public.error_logs_enhanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Error Details
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code VARCHAR(50),
  
  -- Categorization
  severity VARCHAR(50) DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category VARCHAR(100), -- 'frontend', 'backend', 'database', 'integration'
  subcategory VARCHAR(100),
  
  -- Context
  user_id UUID,
  session_id VARCHAR(255),
  page_url VARCHAR(500),
  api_endpoint VARCHAR(500),
  user_agent TEXT,
  browser VARCHAR(100),
  os VARCHAR(100),
  device_type VARCHAR(50),
  
  -- Location
  ip_address INET,
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Resolution Tracking
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  assigned_to UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_time_minutes INTEGER,
  
  -- Frequency Tracking
  occurrence_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Impact Assessment
  affected_users INTEGER DEFAULT 1,
  business_impact VARCHAR(50) DEFAULT 'low' CHECK (business_impact IN ('low', 'medium', 'high', 'critical')),
  
  -- SLA Tracking
  sla_target_minutes INTEGER,
  sla_breach BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Activity Monitoring Table
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- User Info
  user_id UUID,
  session_id VARCHAR(255) NOT NULL,
  
  -- Activity Details
  activity_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'page_view', 'feature_use', 'api_call'
  activity_name VARCHAR(255) NOT NULL,
  activity_details JSONB DEFAULT '{}',
  
  -- Context
  page_url VARCHAR(500),
  referrer_url VARCHAR(500),
  user_agent TEXT,
  ip_address INET,
  
  -- Device & Location
  browser VARCHAR(100),
  os VARCHAR(100),
  device_type VARCHAR(50),
  screen_resolution VARCHAR(20),
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Behavioral Analysis
  is_suspicious BOOLEAN DEFAULT false,
  risk_score INTEGER DEFAULT 0, -- 0-100
  anomaly_flags JSONB DEFAULT '[]',
  
  -- Timing
  duration_ms INTEGER,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Events Table
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- 'failed_login', 'suspicious_activity', 'data_breach_attempt'
  event_severity VARCHAR(50) DEFAULT 'medium' CHECK (event_severity IN ('low', 'medium', 'high', 'critical')),
  event_description TEXT NOT NULL,
  
  -- User Context
  user_id UUID,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  -- Attack Details
  attack_vector VARCHAR(100),
  attack_pattern VARCHAR(255),
  blocked BOOLEAN DEFAULT false,
  
  -- Response Actions
  actions_taken JSONB DEFAULT '[]',
  automated_response BOOLEAN DEFAULT false,
  
  -- Investigation
  investigated BOOLEAN DEFAULT false,
  investigated_by UUID,
  investigation_notes TEXT,
  false_positive BOOLEAN DEFAULT false,
  
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System Alerts Table
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Alert Details
  alert_type VARCHAR(100) NOT NULL, -- 'performance', 'error_rate', 'capacity', 'security'
  alert_level VARCHAR(50) DEFAULT 'warning' CHECK (alert_level IN ('info', 'warning', 'error', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Source
  source_type VARCHAR(100), -- 'health_check', 'error_log', 'performance_metric'
  source_id UUID,
  metric_name VARCHAR(255),
  current_value NUMERIC,
  threshold_value NUMERIC,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  auto_resolve BOOLEAN DEFAULT false,
  
  -- Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_channels JSONB DEFAULT '["email"]',
  escalation_level INTEGER DEFAULT 1,
  
  -- Timing
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Capacity Planning Table
CREATE TABLE public.capacity_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Resource Info
  resource_type VARCHAR(100) NOT NULL, -- 'cpu', 'memory', 'storage', 'bandwidth', 'connections'
  resource_name VARCHAR(255) NOT NULL,
  
  -- Usage Metrics
  current_usage NUMERIC NOT NULL,
  max_capacity NUMERIC NOT NULL,
  usage_percentage NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN max_capacity > 0 THEN (current_usage / max_capacity) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Thresholds
  warning_threshold NUMERIC DEFAULT 70,
  critical_threshold NUMERIC DEFAULT 85,
  
  -- Predictions
  predicted_exhaustion_date DATE,
  growth_trend VARCHAR(50), -- 'increasing', 'stable', 'decreasing'
  
  -- Additional Context
  measurement_details JSONB DEFAULT '{}',
  
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance Baselines Table
CREATE TABLE public.performance_baselines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Metric Info
  metric_type VARCHAR(100) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  
  -- Baseline Values
  baseline_value NUMERIC NOT NULL,
  standard_deviation NUMERIC,
  min_acceptable NUMERIC,
  max_acceptable NUMERIC,
  
  -- Calculation Period
  calculation_period VARCHAR(50) DEFAULT 'last_30_days',
  sample_size INTEGER,
  confidence_level NUMERIC DEFAULT 95.0,
  
  -- Validity
  is_active BOOLEAN DEFAULT true,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_baselines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage performance metrics in their tenant" 
ON public.performance_metrics FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage health checks in their tenant" 
ON public.system_health_checks FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage error logs in their tenant" 
ON public.error_logs_enhanced FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage user activity logs in their tenant" 
ON public.user_activity_logs FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage security events in their tenant" 
ON public.security_events FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage system alerts in their tenant" 
ON public.system_alerts FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage capacity metrics in their tenant" 
ON public.capacity_metrics FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage performance baselines in their tenant" 
ON public.performance_baselines FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX idx_performance_metrics_tenant_type ON public.performance_metrics(tenant_id, metric_type);
CREATE INDEX idx_performance_metrics_measured_at ON public.performance_metrics(measured_at);
CREATE INDEX idx_performance_metrics_hour_bucket ON public.performance_metrics(hour_bucket);
CREATE INDEX idx_performance_metrics_day_bucket ON public.performance_metrics(day_bucket);

CREATE INDEX idx_health_checks_tenant_service ON public.system_health_checks(tenant_id, service_name);
CREATE INDEX idx_health_checks_next_check ON public.system_health_checks(next_check_at);
CREATE INDEX idx_health_checks_status ON public.system_health_checks(status);

CREATE INDEX idx_error_logs_tenant_type ON public.error_logs_enhanced(tenant_id, error_type);
CREATE INDEX idx_error_logs_severity ON public.error_logs_enhanced(severity);
CREATE INDEX idx_error_logs_status ON public.error_logs_enhanced(status);
CREATE INDEX idx_error_logs_created_at ON public.error_logs_enhanced(created_at);

CREATE INDEX idx_activity_logs_tenant_user ON public.user_activity_logs(tenant_id, user_id);
CREATE INDEX idx_activity_logs_session ON public.user_activity_logs(session_id);
CREATE INDEX idx_activity_logs_occurred_at ON public.user_activity_logs(occurred_at);
CREATE INDEX idx_activity_logs_suspicious ON public.user_activity_logs(is_suspicious);

CREATE INDEX idx_security_events_tenant_type ON public.security_events(tenant_id, event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(event_severity);
CREATE INDEX idx_security_events_occurred_at ON public.security_events(occurred_at);

CREATE INDEX idx_system_alerts_tenant_status ON public.system_alerts(tenant_id, status);
CREATE INDEX idx_system_alerts_level ON public.system_alerts(alert_level);
CREATE INDEX idx_system_alerts_triggered_at ON public.system_alerts(triggered_at);

CREATE INDEX idx_capacity_metrics_tenant_type ON public.capacity_metrics(tenant_id, resource_type);
CREATE INDEX idx_capacity_metrics_usage_pct ON public.capacity_metrics(usage_percentage);
CREATE INDEX idx_capacity_metrics_measured_at ON public.capacity_metrics(measured_at);

-- Create triggers for updated_at
CREATE TRIGGER update_error_logs_enhanced_updated_at
  BEFORE UPDATE ON public.error_logs_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at
  BEFORE UPDATE ON public.system_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_baselines_updated_at
  BEFORE UPDATE ON public.performance_baselines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();