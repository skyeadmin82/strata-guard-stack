import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/database';
import { useErrorLogger } from '@/hooks/useErrorLogger';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { toast } from '@/hooks/use-toast';

interface ClientStats {
  id: string;
  name: string;
  health_score: number;
  last_activity_at: string;
  risk_level: string;
  satisfaction_rating: number;
  total_tickets: number;
  open_tickets: number;
  active_contracts: number;
  total_contract_value: number;
  contact_count: number;
  avg_assessment_score: number;
  recent_activities: number;
}

interface ClientActivity {
  id: string;
  activity_type: string;
  activity_title: string;
  activity_description: string;
  created_at: string;
  performed_by?: string;
}

interface BulkAction {
  action: 'update_status' | 'update_industry' | 'export' | 'calculate_health' | 'assign_tag';
  params?: any;
}

export const useEnhancedClientManagement = () => {
  const { environment } = useEnvironment();
  const { logError } = useErrorLogger(environment);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<Map<string, ClientStats>>(new Map());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    industry: 'all',
    riskLevel: 'all',
    healthScore: 'all'
  });

  // Fetch clients with enhanced stats
  const fetchClientsWithStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch client stats
      const { data: statsData, error: statsError } = await supabase
        .from('client_stats')
        .select('*');

      if (statsError) {
        console.warn('Could not fetch client stats:', statsError);
      }

      setClients((clientsData || []) as Client[]);
      
      // Convert stats to Map for easy lookup
      const statsMap = new Map<string, ClientStats>();
      statsData?.forEach(stat => {
        statsMap.set(stat.id, stat);
      });
      setClientStats(statsMap);

    } catch (error) {
      logError(error as Error, 'ENHANCED_CLIENT_FETCH_ERROR');
      toast({
        title: "Error Loading Clients",
        description: "Unable to load client data with statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [logError]);

  // Fetch client activity timeline
  const fetchClientActivity = useCallback(async (clientId: string): Promise<ClientActivity[]> => {
    try {
      const { data, error } = await supabase
        .from('client_activities')
        .select(`
          id,
          activity_type,
          activity_title,
          activity_description,
          created_at,
          performed_by
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(error as Error, 'CLIENT_ACTIVITY_FETCH_ERROR', { clientId });
      return [];
    }
  }, [logError]);

  // Log client activity
  const logClientActivity = useCallback(async (
    clientId: string,
    activityType: string,
    title: string,
    description?: string,
    data?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('client_activities')
        .insert({
          client_id: clientId,
          activity_type: activityType,
          activity_title: title,
          activity_description: description,
          activity_data: data || {},
          tenant_id: '' // Will be set by RLS
        });

      if (error) throw error;
    } catch (error) {
      console.warn('Failed to log client activity:', error);
    }
  }, []);

  // Calculate client health score
  const calculateClientHealthScore = useCallback(async (clientId: string) => {
    try {
      const { data, error } = await supabase.rpc('calculate_client_health_score', {
        client_uuid: clientId
      });

      if (error) throw error;

      // Log the health calculation
      await logClientActivity(
        clientId, 
        'health_calculation', 
        'Health Score Calculated',
        `New health score: ${data}`
      );

      return data;
    } catch (error) {
      logError(error as Error, 'HEALTH_SCORE_CALCULATION_ERROR', { clientId });
      throw error;
    }
  }, [logError, logClientActivity]);

  // Bulk actions
  const executeBulkAction = useCallback(async (action: BulkAction) => {
    if (selectedClients.size === 0) {
      toast({
        title: "No Clients Selected",
        description: "Please select clients to perform bulk actions.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setBulkActionLoading(true);
      const clientIds = Array.from(selectedClients);

      switch (action.action) {
        case 'update_status':
          const { error: statusError } = await supabase
            .from('clients')
            .update({ status: action.params.status })
            .in('id', clientIds);
          
          if (statusError) throw statusError;

          // Log activity for each client
          await Promise.all(clientIds.map(id => 
            logClientActivity(
              id,
              'bulk_update',
              'Status Updated',
              `Status changed to: ${action.params.status}`
            )
          ));
          break;

        case 'update_industry':
          const { error: industryError } = await supabase
            .from('clients')
            .update({ industry: action.params.industry })
            .in('id', clientIds);
          
          if (industryError) throw industryError;

          await Promise.all(clientIds.map(id => 
            logClientActivity(
              id,
              'bulk_update',
              'Industry Updated',
              `Industry changed to: ${action.params.industry}`
            )
          ));
          break;

        case 'calculate_health':
          await Promise.all(clientIds.map(calculateClientHealthScore));
          break;

        case 'export':
          await exportClients(clientIds);
          break;
      }

      toast({
        title: "Bulk Action Completed",
        description: `Successfully processed ${clientIds.length} clients.`,
      });

      // Refresh data
      await fetchClientsWithStats();
      setSelectedClients(new Set());
      return true;

    } catch (error) {
      logError(error as Error, 'BULK_ACTION_ERROR', { action });
      toast({
        title: "Bulk Action Failed",
        description: "An error occurred while processing the bulk action.",
        variant: "destructive",
      });
      return false;
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedClients, logError, logClientActivity, calculateClientHealthScore, fetchClientsWithStats]);

  // Export clients to CSV
  const exportClients = useCallback(async (clientIds?: string[]) => {
    try {
      const clientsToExport = clientIds 
        ? clients.filter(c => clientIds.includes(c.id))
        : clients;

      if (clientsToExport.length === 0) {
        toast({
          title: "No Clients to Export",
          description: "No clients available for export.",
          variant: "destructive",
        });
        return;
      }

      // Enhanced export with stats
      const exportData = clientsToExport.map(client => {
        const stats = clientStats.get(client.id);
        return {
          'Client Name': client.name,
          'Email': client.email || '',
          'Phone': client.phone || '',
          'Industry': client.industry || '',
          'Company Size': client.company_size || '',
          'Status': client.status,
          'Health Score': stats?.health_score || 0,
          'Risk Level': stats?.risk_level || 'unknown',
          'Total Tickets': stats?.total_tickets || 0,
          'Open Tickets': stats?.open_tickets || 0,
          'Active Contracts': stats?.active_contracts || 0,
          'Contract Value': stats?.total_contract_value || 0,
          'Contacts': stats?.contact_count || 0,
          'Avg Assessment Score': stats?.avg_assessment_score || 0,
          'Recent Activities': stats?.recent_activities || 0,
          'Created At': new Date(client.created_at).toLocaleDateString(),
          'Last Activity': stats?.last_activity_at ? new Date(stats.last_activity_at).toLocaleDateString() : 'Never'
        };
      });

      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => 
          `"${row[header as keyof typeof row]}"`
        ).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clients-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${exportData.length} clients to CSV.`,
      });

    } catch (error) {
      logError(error as Error, 'CLIENT_EXPORT_ERROR');
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting clients.",
        variant: "destructive",
      });
    }
  }, [clients, clientStats, logError]);

  // Advanced filtering
  const getFilteredClients = useCallback(() => {
    return clients.filter(client => {
      const stats = clientStats.get(client.id);
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!client.name.toLowerCase().includes(searchLower) &&
            !client.email?.toLowerCase().includes(searchLower) &&
            !client.industry?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }

      // Industry filter  
      if (filters.industry !== 'all' && client.industry !== filters.industry) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevel !== 'all' && stats?.risk_level !== filters.riskLevel) {
        return false;
      }

      // Health score filter
      if (filters.healthScore !== 'all') {
        const healthScore = stats?.health_score || 0;
        switch (filters.healthScore) {
          case 'excellent':
            if (healthScore < 80) return false;
            break;
          case 'good':
            if (healthScore < 60 || healthScore >= 80) return false;
            break;
          case 'poor':
            if (healthScore >= 60) return false;
            break;
        }
      }

      return true;
    });
  }, [clients, clientStats, filters]);

  // Selection management
  const toggleClientSelection = useCallback((clientId: string) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  }, []);

  const selectAllClients = useCallback((clientIds: string[]) => {
    setSelectedClients(new Set(clientIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedClients(new Set());
  }, []);

  // Initial load
  useEffect(() => {
    fetchClientsWithStats();
  }, [fetchClientsWithStats]);

  return {
    // Data
    clients: getFilteredClients(),
    clientStats,
    selectedClients,
    
    // Loading states
    loading,
    bulkActionLoading,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    fetchClientsWithStats,
    fetchClientActivity,
    logClientActivity,
    calculateClientHealthScore,
    executeBulkAction,
    exportClients,
    
    // Selection
    toggleClientSelection,
    selectAllClients,
    clearSelection,
  };
};