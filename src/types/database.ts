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
  status: 'draft' | 'completed' | 'reviewed';
  completed_at?: string;
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