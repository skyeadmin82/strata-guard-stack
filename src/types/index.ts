export type Environment = 'demo' | 'production';

export type UserRole = 'admin' | 'manager' | 'technician';

export type TenantPlan = 'starter' | 'professional' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: TenantPlan;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ErrorLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  context: Record<string, any>;
  environment: Environment;
  url?: string;
  user_agent?: string;
  created_at: string;
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<any>;
}