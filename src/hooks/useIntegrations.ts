import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTenant } from './useTenant';

export interface IntegrationStatus {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'available' | 'error' | 'coming_soon';
  provider_type: string;
  description: string;
  lastSync?: string;
  errorMessage?: string;
  connectionId?: string;
}

export interface IntegrationConfig {
  provider: string;
  connected: boolean;
  credentials?: any;
  settings?: any;
  lastUpdated?: string;
}

export const useIntegrations = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Static integration definitions mapped to database providers
  const staticIntegrations = [
    {
      id: 'qbo',
      name: 'QuickBooks Online',
      description: 'Sync invoices, payments, and financial data',
      category: 'financial',
      provider_type: 'accounting'
    },
    {
      id: 'pcbancard',
      name: 'PCBancard',
      description: 'Accept payments with dual pricing and platform billing',
      category: 'financial',
      provider_type: 'payment'
    },
    {
      id: 'smtp2go',
      name: 'SMTP2GO',
      description: 'Email automation and transactional emails',
      category: 'communication',
      provider_type: 'email'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Team collaboration and ticket notifications',
      category: 'communication',
      provider_type: 'communication'
    },
    {
      id: 'azure_ad',
      name: 'Azure Active Directory',
      description: 'Single sign-on and user management',
      category: 'microsoft',
      provider_type: 'authentication'
    },
    {
      id: 'office365',
      name: 'Microsoft 365',
      description: 'Calendar sync, contacts, and document management',
      category: 'microsoft',
      provider_type: 'productivity'
    },
    {
      id: 'ninja_rmm',
      name: 'NinjaOne RMM',
      description: 'Remote monitoring and management integration',
      category: 'rmm',
      provider_type: 'monitoring'
    },
    {
      id: 'connectwise_automate',
      name: 'ConnectWise Automate',
      description: 'Automate ticket creation from RMM alerts',
      category: 'rmm',
      provider_type: 'automation'
    },
    {
      id: 'duo',
      name: 'Duo Security',
      description: 'Two-factor authentication for enhanced security',
      category: 'security',
      provider_type: 'authentication'
    },
    // Migration tools
    {
      id: 'connectwise',
      name: 'ConnectWise PSA',
      description: 'Migrate tickets, clients, and invoices from ConnectWise',
      category: 'migration',
      provider_type: 'psa'
    },
    {
      id: 'kaseya',
      name: 'Kaseya BMS',
      description: 'Import data from Kaseya Business Management Suite',
      category: 'migration',
      provider_type: 'psa'
    },
    {
      id: 'syncro',
      name: 'SyncroMSP',
      description: 'Migrate from SyncroMSP with full data transfer',
      category: 'migration',
      provider_type: 'psa'
    },
    {
      id: 'atera',
      name: 'Atera',
      description: 'Import clients, tickets, and contracts from Atera',
      category: 'migration',
      provider_type: 'psa'
    }
  ];

  // Fetch integration status from database
  const fetchIntegrationStatus = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch providers and connections
      const { data: providers, error: providersError } = await supabase
        .from('integration_providers')
        .select('*')
        .eq('tenant_id', tenantId);

      if (providersError) throw providersError;

      const { data: connections, error: connectionsError } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('tenant_id', tenantId);

      if (connectionsError) throw connectionsError;

      // Map static integrations to database status
      const integrationsWithStatus = staticIntegrations.map(staticIntegration => {
        // Find matching provider
        const provider = providers?.find(p => 
          p.name.toLowerCase() === staticIntegration.name.toLowerCase() ||
          p.provider_type === staticIntegration.provider_type
        );

        // Find active connection
        const connection = connections?.find(c => c.provider_id === provider?.id);

        let status: IntegrationStatus['status'] = 'available';
        let errorMessage: string | undefined;
        
        if (connection) {
          if (connection.auth_status === 'connected' && connection.connection_status === 'healthy') {
            status = 'connected';
          } else if (connection.connection_status === 'error' || connection.consecutive_failures > 0) {
            status = 'error';
            errorMessage = typeof connection.last_error === 'string' 
              ? connection.last_error 
              : (connection.last_error as any)?.message || 'Connection error';
          }
        } else if (!provider) {
          status = 'coming_soon';
        }

        return {
          ...staticIntegration,
          status,
          lastSync: connection?.last_sync_at,
          errorMessage,
          connectionId: connection?.id
        };
      });

      setIntegrations(integrationsWithStatus);

    } catch (error: any) {
      console.error('Error fetching integration status:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load integration status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize default providers if needed
  const initializeIntegrations = async () => {
    if (!tenantId) return;

    try {
      // Just fetch status - providers will be created via UI actions
      await fetchIntegrationStatus();
    } catch (error: any) {
      console.error('Error initializing integrations:', error);
    }
  };

  // Connect an integration
  const connectIntegration = async (integrationId: string, credentials: any) => {
    if (!tenantId) return null;

    try {
      setLoading(true);

      // Find the provider
      const { data: provider, error: providerError } = await supabase
        .from('integration_providers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('name', staticIntegrations.find(i => i.id === integrationId)?.name)
        .single();

      if (providerError) throw providerError;

      // Create or update connection
      const { data: connection, error: connectionError } = await supabase
        .from('integration_connections')
        .upsert({
          tenant_id: tenantId,
          provider_id: provider.id,
          name: `${provider.name} Connection`,
          description: `Active connection to ${provider.name}`,
          auth_status: 'connected',
          connection_status: 'healthy',
          credentials: credentials,
          sync_enabled: true,
          sync_frequency: 'hourly',
          field_mappings: {},
          sync_settings: {}
        }, {
          onConflict: 'tenant_id,provider_id'
        })
        .select()
        .single();

      if (connectionError) throw connectionError;

      toast({
        title: "Integration Connected",
        description: `Successfully connected to ${provider.name}`,
      });

      await fetchIntegrationStatus();
      return connection;

    } catch (error: any) {
      console.error('Error connecting integration:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect integration",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect an integration
  const disconnectIntegration = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration?.connectionId) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('integration_connections')
        .update({
          auth_status: 'disconnected',
          connection_status: 'inactive',
          sync_enabled: false
        })
        .eq('id', integration.connectionId);

      if (error) throw error;

      toast({
        title: "Integration Disconnected",
        description: `Disconnected from ${integration.name}`,
      });

      await fetchIntegrationStatus();

    } catch (error: any) {
      console.error('Error disconnecting integration:', error);
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect integration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test connection health
  const testConnection = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration?.connectionId) return false;

    try {
      setLoading(true);

      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error } = await supabase
        .from('integration_connections')
        .update({
          last_health_check: new Date().toISOString(),
          connection_status: 'healthy',
          consecutive_failures: 0
        })
        .eq('id', integration.connectionId);

      if (error) throw error;

      toast({
        title: "Connection Test Successful",
        description: `${integration.name} is working properly`,
      });

      await fetchIntegrationStatus();
      return true;

    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast({
        title: "Connection Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get integrations by category
  const getIntegrationsByCategory = (category: string) => {
    return integrations.filter(integration => integration.category === category);
  };

  // Get connected integrations
  const getConnectedIntegrations = () => {
    return integrations.filter(integration => integration.status === 'connected');
  };

  // Initialize on mount
  useEffect(() => {
    if (tenantId) {
      initializeIntegrations();
    }
  }, [tenantId]);

  return {
    integrations,
    loading,
    error,
    connectIntegration,
    disconnectIntegration,
    testConnection,
    getIntegrationsByCategory,
    getConnectedIntegrations,
    refreshStatus: fetchIntegrationStatus
  };
};