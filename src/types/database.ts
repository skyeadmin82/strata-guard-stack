export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  industry?: string | null;
  company_size?: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+' | null;
  website?: string | null;
  address?: Record<string, any> | null;
  phone?: string | null;
  email?: string | null;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Contact {
  id: string;
  tenant_id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  is_primary: boolean;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Contract {
  id: string;
  tenant_id: string;
  client_id: string;
  name: string;
  contract_type: 'msp' | 'project' | 'support' | 'consulting';
  status: 'draft' | 'active' | 'expired' | 'terminated';
  start_date: string;
  end_date?: string;
  value?: number;
  currency: string;
  billing_frequency?: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  terms?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Ticket {
  id: string;
  tenant_id: string;
  client_id: string;
  contact_id?: string;
  assigned_to?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  category?: 'hardware' | 'software' | 'network' | 'security' | 'other';
  resolution?: string;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}


export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface FormValidationError {
  field: string;
  message: string;
}

// Contract Management Types
export interface ContractTemplate {
  id: string;
  tenant_id: string;
  name: string;
  contract_type: 'msp' | 'project' | 'support' | 'consulting';
  template_content: Record<string, any>;
  pricing_rules: Record<string, any>;
  required_fields: string[];
  default_values: Record<string, any>;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PricingRule {
  id: string;
  tenant_id: string;
  name: string;
  pricing_type: 'fixed' | 'tiered' | 'usage' | 'hybrid';
  base_price: number;
  currency: 'USD' | 'EUR' | 'GBP';
  pricing_tiers: Record<string, any>;
  discount_rules: Record<string, any>;
  tax_rules: Record<string, any>;
  conditions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ContractExtended extends Contract {
  template_id?: string;
  pricing_rule_id?: string;
  calculated_value?: number;
  discount_amount?: number;
  tax_amount?: number;
  payment_terms: 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt';
  auto_renewal: boolean;
  renewal_notice_days?: number;
  cancellation_notice_days?: number;
  version: number;
  parent_contract_id?: string;
}

export interface ContractPricingHistory {
  id: string;
  contract_id: string;
  tenant_id: string;
  change_type: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  change_reason?: string;
  calculation_details: Record<string, any>;
  validation_errors?: Record<string, any>;
  changed_by?: string;
  changed_at: string;
}

export interface ContractApproval {
  id: string;
  contract_id: string;
  tenant_id: string;
  approver_id?: string;
  approval_level: number;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  comments?: string;
  timeout_at?: string;
  approved_at?: string;
  created_at: string;
}

export interface ContractErrorLog {
  id: string;
  tenant_id?: string;
  contract_id?: string;
  error_type: string;
  error_code?: string;
  error_message: string;
  error_details?: Record<string, any>;
  context?: Record<string, any>;
  severity: string;
  resolved: boolean;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ContractPayment {
  id: string;
  contract_id: string;
  tenant_id: string;
  invoice_number?: string;
  amount_due: number;
  amount_paid?: number;
  currency: 'USD' | 'EUR' | 'GBP';
  due_date: string;
  payment_status: string;
  payment_method?: string;
  transaction_reference?: string;
  payment_errors?: Record<string, any>;
  reconciliation_status?: string;
  created_at: string;
  paid_at?: string;
}

// Assessment Engine Types
export interface AssessmentTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  version: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  scoring_rules: Record<string, any>;
  threshold_rules: Record<string, any>;
  conditional_logic: Record<string, any>;
  validation_rules: Record<string, any>;
  estimated_duration?: number;
  passing_score?: number;
  max_score?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentQuestion {
  id: string;
  tenant_id: string;
  template_id: string;
  section?: string;
  question_number: number;
  question_type: 'text' | 'number' | 'boolean' | 'single_choice' | 'multiple_choice' | 'scale' | 'matrix';
  question_text: string;
  description?: string;
  options: Array<{value: any; label: string}>;
  validation_rules: Record<string, any>;
  scoring_weight: number;
  max_points: number;
  required: boolean;
  conditional_logic: Record<string, any>;
  help_text?: string;
  created_at: string;
}

export interface Assessment {
  id: string;
  tenant_id: string;
  client_id: string;
  assessed_by: string;
  assessment_type: 'security' | 'infrastructure' | 'compliance' | 'general';
  title: string;
  description?: string;
  overall_score: number;
  findings: any[];
  recommendations: any[];
  status: 'draft' | 'completed' | 'reviewed' | 'in_progress' | 'validated' | 'flagged';
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Additional fields for assessment execution
  assessor_id?: string;
  template_id?: string;
  started_at?: string;
  last_saved_at?: string;
  current_question?: number;
  total_score?: number;
  max_possible_score?: number;
  percentage_score?: number;
  session_data?: Record<string, any>;
  validation_errors?: Array<any>;
  recovery_data?: Record<string, any>;
}

// Proposal System Types
export interface ProposalTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  template_content: Record<string, any>;
  default_terms?: string;
  default_validity_days: number;
  pricing_structure: Record<string, any>;
  required_fields: string[];
  validation_rules: Record<string, any>;
  is_active: boolean;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  tenant_id: string;
  client_id: string;
  template_id?: string;
  proposal_number: string;
  title: string;
  description?: string;
  content: Record<string, any>;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  total_amount?: number;
  currency: 'USD' | 'EUR' | 'GBP';
  tax_amount: number;
  discount_amount: number;
  final_amount?: number;
  valid_until?: string;
  created_date: string;
  sent_date?: string;
  viewed_date?: string;
  accepted_date?: string;
  terms_and_conditions?: string;
  payment_terms?: string;
  delivery_terms?: string;
  view_count: number;
  last_viewed_at?: string;
  tracking_pixel_id: string;
  validation_errors: Array<any>;
  generation_errors: Array<any>;
  delivery_errors: Array<any>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalItem {
  id: string;
  tenant_id: string;
  proposal_id: string;
  item_order: number;
  item_type: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  total_price: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ProposalVersion {
  id: string;
  tenant_id: string;
  proposal_id: string;
  version_number: number;
  content_snapshot: Record<string, any>;
  changes_summary?: string;
  change_type?: string;
  created_by?: string;
  created_at: string;
}

export interface ProposalApproval {
  id: string;
  tenant_id: string;
  proposal_id: string;
  approver_id: string;
  approval_level: number;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  comments?: string;
  approved_at?: string;
  timeout_at?: string;
  notification_sent: boolean;
  notification_errors: Array<any>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  proposal_id: string;
  client_id: string;
  transaction_id?: string;
  external_transaction_id?: string;
  payment_method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal' | 'pcbancard';
  payment_processor: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  processing_fee: number;
  net_amount?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  initiated_at: string;
  processed_at?: string;
  completed_at?: string;
  card_last_four?: string;
  card_brand?: string;
  card_token?: string;
  error_code?: string;
  error_message?: string;
  error_details: Record<string, any>;
  retry_count: number;
  max_retries: number;
  audit_trail: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalComment {
  id: string;
  tenant_id: string;
  proposal_id: string;
  user_id?: string;
  client_contact_id?: string;
  parent_comment_id?: string;
  content: string;
  comment_type: string;
  is_internal: boolean;
  is_moderated: boolean;
  moderation_status: string;
  moderation_notes?: string;
  attachments: Array<any>;
  created_at: string;
  updated_at: string;
}

export interface ProposalSignature {
  id: string;
  tenant_id: string;
  proposal_id: string;
  signer_id?: string;
  signer_email: string;
  signer_name: string;
  signature_type: 'electronic' | 'digital' | 'wet_signature' | 'api_signature';
  signature_data?: Record<string, any>;
  signature_image_url?: string;
  ip_address?: string;
  user_agent?: string;
  location_data?: Record<string, any>;
  verification_code?: string;
  is_verified: boolean;
  verification_method?: string;
  requested_at: string;
  signed_at?: string;
  expires_at?: string;
  delivery_attempts: number;
  delivery_errors: Array<any>;
  created_at: string;
}

export interface ProposalTracking {
  id: string;
  tenant_id: string;
  proposal_id: string;
  event_type: string;
  event_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  timezone?: string;
  created_at: string;
}

export interface ProposalNotification {
  id: string;
  tenant_id: string;
  proposal_id: string;
  notification_type: string;
  recipient_email: string;
  subject: string;
  content?: string;
  status: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  delivery_attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  error_details: Record<string, any>;
  created_at: string;
}

export interface AssessmentResponse {
  id: string;
  tenant_id: string;
  assessment_id: string;
  question_id: string;
  response_value?: string;
  response_data: Record<string, any>;
  score: number;
  auto_saved: boolean;
  validation_status: string;
  validation_errors: Array<any>;
  created_at: string;
  updated_at: string;
}

export interface AssessmentOpportunity {
  id: string;
  tenant_id: string;
  assessment_id: string;
  client_id: string;
  opportunity_type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'identified' | 'qualified' | 'proposal_sent' | 'won' | 'lost' | 'cancelled';
  estimated_value?: number;
  currency: string;
  threshold_data: Record<string, any>;
  detection_rules: Record<string, any>;
  assigned_to?: string;
  due_date?: string;
  follow_up_date?: string;
  automation_errors: Array<any>;
  created_at: string;
  updated_at: string;
}

export interface AssessmentReport {
  id: string;
  tenant_id: string;
  assessment_id: string;
  report_type: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'retrying';
  generation_started_at?: string;
  generation_completed_at?: string;
  report_data: Record<string, any>;
  export_formats: Array<string>;
  file_path?: string;
  error_details: Record<string, any>;
  retry_count: number;
  max_retries: number;
  email_recipients: Array<string>;
  email_sent: boolean;
  email_errors: Array<any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentErrorLog {
  id: string;
  tenant_id: string;
  assessment_id?: string;
  error_type: string;
  error_code?: string;
  error_message: string;
  error_details: Record<string, any>;
  context: Record<string, any>;
  severity: string;
  resolved: boolean;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}