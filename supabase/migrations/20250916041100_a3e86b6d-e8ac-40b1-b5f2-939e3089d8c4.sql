-- AI Integration and Business Intelligence Tables

-- AI request/response tracking
CREATE TABLE public.ai_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  request_type TEXT NOT NULL, -- 'analysis', 'prediction', 'automation', 'chat'
  provider TEXT NOT NULL DEFAULT 'openai', -- 'openai', 'claude', 'fallback'
  model TEXT,
  prompt TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost NUMERIC(10,4) DEFAULT 0,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'timeout'
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  fallback_used BOOLEAN DEFAULT false,
  fallback_reason TEXT,
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  quality_score INTEGER, -- 1-10 rating
  context_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Business Intelligence reports and dashboards
CREATE TABLE public.bi_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_by UUID,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL, -- 'dashboard', 'chart', 'table', 'export'
  data_sources JSONB NOT NULL DEFAULT '[]', -- Array of table names and queries
  query_definition JSONB NOT NULL DEFAULT '{}',
  chart_config JSONB DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  schedule_config JSONB DEFAULT '{}', -- For automated reports
  export_formats TEXT[] DEFAULT ARRAY['pdf', 'csv', 'xlsx'],
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error'
  last_generated_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  generation_time_ms INTEGER,
  cache_ttl INTEGER DEFAULT 3600, -- Cache time in seconds
  is_public BOOLEAN DEFAULT false,
  access_permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation workflows
CREATE TABLE public.automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_by UUID,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL, -- 'scheduled', 'trigger', 'manual'
  trigger_config JSONB DEFAULT '{}', -- Event triggers, schedules, etc.
  steps JSONB NOT NULL DEFAULT '[]', -- Array of workflow steps
  conditions JSONB DEFAULT '{}', -- Execution conditions
  retry_config JSONB DEFAULT '{"max_attempts": 3, "delay_seconds": [60, 300, 900]}',
  timeout_seconds INTEGER DEFAULT 3600,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'paused'
  is_ai_powered BOOLEAN DEFAULT false,
  fallback_workflow_id UUID,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  next_execution_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  average_duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow execution history
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  triggered_by UUID,
  execution_status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER DEFAULT 0,
  current_step JSONB,
  execution_log JSONB DEFAULT '[]', -- Array of step results
  error_step INTEGER,
  error_message TEXT,
  error_details JSONB,
  retry_attempt INTEGER DEFAULT 1,
  rollback_completed BOOLEAN DEFAULT false,
  rollback_steps JSONB DEFAULT '[]',
  manual_intervention_required BOOLEAN DEFAULT false,
  intervention_message TEXT,
  context_data JSONB DEFAULT '{}'
);

-- Predictive analytics models
CREATE TABLE public.prediction_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_by UUID,
  name TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL, -- 'time_series', 'classification', 'regression', 'anomaly_detection'
  data_source TEXT NOT NULL, -- Table or view name
  features JSONB NOT NULL DEFAULT '[]', -- Input features
  target_column TEXT, -- What we're predicting
  training_config JSONB DEFAULT '{}',
  model_parameters JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}', -- Accuracy, precision, recall, etc.
  confidence_threshold NUMERIC(3,2) DEFAULT 0.70,
  status TEXT NOT NULL DEFAULT 'training', -- 'training', 'ready', 'failed', 'deprecated'
  last_trained_at TIMESTAMP WITH TIME ZONE,
  training_duration_ms INTEGER,
  training_data_count INTEGER DEFAULT 0,
  accuracy_score NUMERIC(5,4),
  fallback_method TEXT DEFAULT 'average', -- 'average', 'last_known', 'manual'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictions generated by models
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  model_id UUID NOT NULL,
  prediction_type TEXT NOT NULL, -- 'forecast', 'classification', 'anomaly'
  input_data JSONB NOT NULL,
  predicted_value JSONB NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL,
  probability_distribution JSONB, -- For classification models
  prediction_interval JSONB, -- For regression models
  actual_value JSONB, -- Filled in later for accuracy tracking
  is_accurate BOOLEAN, -- Determined after actual value is known
  deviation_percent NUMERIC(5,2), -- How far off the prediction was
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actual_recorded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- System monitoring and alerts
CREATE TABLE public.system_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  monitor_type TEXT NOT NULL, -- 'ai_failure_rate', 'workflow_failures', 'data_quality', 'performance'
  name TEXT NOT NULL,
  description TEXT,
  check_config JSONB NOT NULL DEFAULT '{}', -- What to monitor and thresholds
  alert_config JSONB DEFAULT '{}', -- How to alert (email, webhook, etc.)
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'alerting'
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_alert_at TIMESTAMP WITH TIME ZONE,
  alert_count INTEGER DEFAULT 0,
  check_interval_minutes INTEGER DEFAULT 5,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Monitor alerts
CREATE TABLE public.monitor_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  monitor_id UUID NOT NULL,
  alert_level TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data quality metrics
CREATE TABLE public.data_quality_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  column_name TEXT,
  metric_type TEXT NOT NULL, -- 'completeness', 'accuracy', 'consistency', 'validity'
  metric_value NUMERIC(5,2) NOT NULL, -- Percentage 0-100
  threshold_value NUMERIC(5,2) DEFAULT 90,
  is_passing BOOLEAN GENERATED ALWAYS AS (metric_value >= threshold_value) STORED,
  sample_size INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_ai_requests_tenant_status ON public.ai_requests(tenant_id, status);
CREATE INDEX idx_ai_requests_created_at ON public.ai_requests(created_at);
CREATE INDEX idx_ai_requests_provider_model ON public.ai_requests(provider, model);

CREATE INDEX idx_bi_reports_tenant_type ON public.bi_reports(tenant_id, report_type);
CREATE INDEX idx_bi_reports_status ON public.bi_reports(status);

CREATE INDEX idx_workflows_tenant_status ON public.automation_workflows(tenant_id, status);
CREATE INDEX idx_workflows_next_execution ON public.automation_workflows(next_execution_at) WHERE status = 'active';

CREATE INDEX idx_workflow_executions_workflow_status ON public.workflow_executions(workflow_id, execution_status);
CREATE INDEX idx_workflow_executions_started_at ON public.workflow_executions(started_at);

CREATE INDEX idx_prediction_models_tenant_status ON public.prediction_models(tenant_id, status);
CREATE INDEX idx_predictions_model_created ON public.predictions(model_id, created_at);

CREATE INDEX idx_system_monitors_tenant_status ON public.system_monitors(tenant_id, status);
CREATE INDEX idx_monitor_alerts_monitor_status ON public.monitor_alerts(monitor_id, status);

CREATE INDEX idx_data_quality_table_metric ON public.data_quality_metrics(table_name, metric_type, checked_at);

-- Enable Row Level Security
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage AI requests in their tenant" ON public.ai_requests
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage BI reports in their tenant" ON public.bi_reports
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage workflows in their tenant" ON public.automation_workflows
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view workflow executions in their tenant" ON public.workflow_executions
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage prediction models in their tenant" ON public.prediction_models
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage predictions in their tenant" ON public.predictions
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage system monitors in their tenant" ON public.system_monitors
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view monitor alerts in their tenant" ON public.monitor_alerts
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view data quality metrics in their tenant" ON public.data_quality_metrics
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Create triggers for updated_at columns
CREATE TRIGGER update_bi_reports_updated_at
  BEFORE UPDATE ON public.bi_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prediction_models_updated_at
  BEFORE UPDATE ON public.prediction_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_monitors_updated_at
  BEFORE UPDATE ON public.system_monitors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();