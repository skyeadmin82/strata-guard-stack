import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTenant } from './useTenant';

export interface IntegrationProvider {
  id: string;
  tenant_id: string;
  name: string;
  provider_type: string;
  description?: string;
  base_url?: string;
  auth_type: string;
  oauth_config: any;
  api_config: any;
  webhook_config: any;
  rate_limits: any;
  timeout_seconds: number;
  retry_config: any;
  status: string;
  version: string;
  deprecated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConnection {
  id: string;
  tenant_id: string;
  provider_id: string;
  name: string;
  description?: string;
  auth_status: string;
  credentials: any;
  oauth_state?: string;
  token_expires_at?: string;
  connection_status: string;
  last_health_check?: string;
  health_check_errors: any[];
  consecutive_failures: number;
  sync_enabled: boolean;
  sync_frequency: string;
  last_sync_at?: string;
  next_sync_at?: string;
  sync_status: string;
  field_mappings: any;
  sync_settings: any;
  error_count: number;
  last_error?: any;
  error_threshold: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  integration_providers?: IntegrationProvider;
}

export interface SyncJob {
  id: string;
  tenant_id: string;
  connection_id: string;
  job_type: string;
  sync_direction: string;
  priority: number;
  status: string;
  progress_percentage: number;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  sync_results: any;
  error_details: any[];
  conflict_resolution: any;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationAlert {
  id: string;
  tenant_id: string;
  connection_id?: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  context_data: any;
  affected_records: number;
  status: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  notification_sent: boolean;
  notification_channels: string[];
  created_at: string;
  updated_at: string;
}

export const useIntegrationPlatform = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [alerts, setAlerts] = useState<IntegrationAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers
  const fetchProviders = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_providers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load integration providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch connections
  const fetchConnections = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_connections')
        .select(`
          *,
          integration_providers (*)
        `)
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      setConnections(data?.map(conn => ({
        ...conn,
        health_check_errors: Array.isArray(conn.health_check_errors) ? conn.health_check_errors : [],
        field_mappings: conn.field_mappings || {},
        sync_settings: conn.sync_settings || {},
        last_error: conn.last_error || null,
        credentials: conn.credentials || {}
      })) || []);
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load integration connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch sync jobs
  const fetchSyncJobs = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('integration_sync_jobs')
        .select(`
          *,
          integration_connections (
            name,
            integration_providers (name, provider_type)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSyncJobs(data?.map(job => ({
        ...job,
        error_details: Array.isArray(job.error_details) ? job.error_details : [],
        sync_results: job.sync_results || {},
        conflict_resolution: job.conflict_resolution || {}
      })) || []);
    } catch (error: any) {
      console.error('Error fetching sync jobs:', error);
      setError(error.message);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('integration_alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['active', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts(data?.map(alert => ({
        ...alert,
        notification_channels: Array.isArray(alert.notification_channels) ? 
          alert.notification_channels.map(ch => String(ch)) : [],
        context_data: alert.context_data || {}
      })) || []);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      setError(error.message);
    }
  };

  // Create provider
  const createProvider = async (providerData: Partial<IntegrationProvider>) => {
    if (!tenantId) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_providers')
        .insert({
          name: providerData.name || '',
          provider_type: providerData.provider_type || '',
          auth_type: providerData.auth_type || 'oauth2',
          tenant_id: tenantId,
          ...providerData,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchProviders();
      toast({
        title: "Success",
        description: "Integration provider created successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating provider:', error);
      toast({
        title: "Error",
        description: "Failed to create integration provider",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create connection
  const createConnection = async (connectionData: Partial<IntegrationConnection>) => {
    if (!tenantId) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_connections')
        .insert({
          name: connectionData.name || '',
          tenant_id: tenantId,
          ...connectionData,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchConnections();
      toast({
        title: "Success",
        description: "Integration connection created successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating connection:', error);
      toast({
        title: "Error",
        description: "Failed to create integration connection",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update connection
  const updateConnection = async (connectionId: string, updates: Partial<IntegrationConnection>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_connections')
        .update(updates)
        .eq('id', connectionId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchConnections();
      toast({
        title: "Success",
        description: "Connection updated successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating connection:', error);
      toast({
        title: "Error",
        description: "Failed to update connection",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Trigger sync
  const triggerSync = async (connectionId: string, syncType = 'full_sync') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_sync_jobs')
        .insert({
          tenant_id: tenantId,
          connection_id: connectionId,
          job_type: syncType,
          sync_direction: 'bidirectional',
          priority: 5,
          status: 'queued',
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSyncJobs();
      toast({
        title: "Success",
        description: "Sync job queued successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error triggering sync:', error);
      toast({
        title: "Error",
        description: "Failed to trigger sync",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Perform health check
  const performHealthCheck = async (connectionId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('integration-monitoring/health-checks', {
        body: { connectionId }
      });

      if (error) throw error;
      
      await fetchConnections();
      toast({
        title: "Success",
        description: "Health check completed",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error performing health check:', error);
      toast({
        title: "Error",
        description: "Failed to perform health check",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { data, error } = await supabase
        .from('integration_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchAlerts();
      toast({
        title: "Success",
        description: "Alert acknowledged",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get OAuth URL for QuickBooks
  const getQuickBooksOAuthUrl = (connectionId: string) => {
    const state = crypto.randomUUID();
    const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';
    const clientId = 'your-quickbooks-client-id'; // This should come from environment
    const redirectUri = encodeURIComponent('your-redirect-uri'); // This should come from environment
    const scope = encodeURIComponent('com.intuit.quickbooks.accounting');
    
    // Store state in connection for verification
    updateConnection(connectionId, { oauth_state: state });
    
    return `${baseUrl}?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&response_type=code&access_type=offline&state=${state}`;
  };

  // Initialize data
  useEffect(() => {
    if (tenantId) {
      fetchProviders();
      fetchConnections();
      fetchSyncJobs();
      fetchAlerts();
    }
  }, [tenantId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!tenantId) return;

    const syncJobsSubscription = supabase
      .channel('sync_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_sync_jobs',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchSyncJobs();
        }
      )
      .subscribe();

    const alertsSubscription = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_alerts',  
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      syncJobsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, [tenantId]);

  return {
    // Data
    providers,
    connections,
    syncJobs,
    alerts,
    loading,
    error,
    
    // Actions
    createProvider,
    createConnection,
    updateConnection,
    triggerSync,
    performHealthCheck,
    acknowledgeAlert,
    getQuickBooksOAuthUrl,
    
    // Refresh functions
    fetchProviders,
    fetchConnections,
    fetchSyncJobs,
    fetchAlerts,
  };
};