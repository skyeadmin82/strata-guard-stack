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