import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, PaginationData, ApiError } from '@/types/database';
import { useErrorLogger } from '@/hooks/useErrorLogger';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { toast } from '@/hooks/use-toast';

interface UseClientManagementOptions {
  pageSize?: number;
  enableAutoRefresh?: boolean;
}

interface ClientFilters {
  search?: string;
  status?: string;
  industry?: string;
}

export const useClientManagement = (options: UseClientManagementOptions = {}) => {
  const { pageSize = 10, enableAutoRefresh = false } = options;
  const { environment } = useEnvironment();
  const { logError } = useErrorLogger(environment);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<ClientFilters>({});
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Client>>(new Map());

  // Debounced search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchClients = useCallback(async (
    page = 1, 
    searchTerm?: string, 
    statusFilter?: string, 
    industryFilter?: string,
    retryCount = 0
  ) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (industryFilter && industryFilter !== 'all') {
        query = query.eq('industry', industryFilter);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setClients(data?.map(client => client as Client) || []);
      setPagination({
        page,
        limit: pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      });

    } catch (error) {
      const errorObj = error as Error;
      
      logError(errorObj, 'CLIENT_FETCH_ERROR', {
        page,
        searchTerm,
        statusFilter,
        industryFilter,
        retryCount,
      });

      if (retryCount < 2) {
        // Retry with exponential backoff
        setTimeout(() => {
          fetchClients(page, searchTerm, statusFilter, industryFilter, retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }

      const apiError: ApiError = {
        message: errorObj.message || 'Failed to fetch clients',
        code: 'FETCH_ERROR',
        details: errorObj,
      };
      
      setError(apiError);
      toast({
        title: "Error Loading Clients",
        description: "Unable to load client data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pageSize, logError]);

  const createClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    const tempId = `temp-${Date.now()}`;
    try {
      // Optimistic update
      const optimisticClient: Client = {
        id: tempId,
        tenant_id: '',
        ...clientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setOptimisticUpdates(prev => new Map(prev.set(tempId, optimisticClient)));
      setClients(prev => [optimisticClient, ...prev]);

      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          industry: clientData.industry,
          company_size: clientData.company_size,
          website: clientData.website,
          address: clientData.address,
          phone: clientData.phone,
          email: clientData.email,
          status: clientData.status,
          notes: clientData.notes,
          created_by: clientData.created_by,
        } as any) // Type assertion to work around tenant_id requirement
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Replace optimistic update with real data
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });

      setClients(prev => prev.map(client => 
        client.id === tempId ? data as Client : client
      ));

      toast({
        title: "Client Created",
        description: `${clientData.name} has been successfully added.`,
      });

      return data as Client;

    } catch (error) {
      const errorObj = error as Error;
      
      // Rollback optimistic update
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      setClients(prev => prev.filter(client => !client.id.startsWith('temp-')));

      logError(errorObj, 'CLIENT_CREATE_ERROR', { clientData });

      toast({
        title: "Failed to Create Client",
        description: errorObj.message || "An error occurred while creating the client.",
        variant: "destructive",
      });

      throw errorObj;
    }
  }, [logError]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    try {
      // Optimistic update
      const originalClient = clients.find(c => c.id === id);
      if (!originalClient) throw new Error('Client not found');

      const optimisticClient = { ...originalClient, ...updates, updated_at: new Date().toISOString() };
      setClients(prev => prev.map(client => client.id === id ? optimisticClient : client));

      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Confirm optimistic update with real data
      setClients(prev => prev.map(client => client.id === id ? data as Client : client));

      toast({
        title: "Client Updated",
        description: `${data.name} has been successfully updated.`,
      });

      return data;

    } catch (error) {
      const errorObj = error as Error;

      // Rollback optimistic update
      const originalClient = clients.find(c => c.id === id);
      if (originalClient) {
        setClients(prev => prev.map(client => client.id === id ? originalClient : client));
      }

      logError(errorObj, 'CLIENT_UPDATE_ERROR', { id, updates });

      toast({
        title: "Failed to Update Client",
        description: errorObj.message || "An error occurred while updating the client.",
        variant: "destructive",
      });

      throw errorObj;
    }
  }, [clients, logError]);

  const deleteClient = useCallback(async (id: string) => {
    const originalClients = [...clients];
    try {
      // Check for dependencies first - use simple existence check
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('client_id', id)
        .limit(1);

      if (contactsError) {
        console.warn('Could not check contacts:', contactsError);
      }

      if (contacts && contacts.length > 0) {
        toast({
          title: "Cannot Delete Client",
          description: "This client has associated contacts. Please remove them first.",
          variant: "destructive",
        });
        return false;
      }

      // Note: Skipping tickets check for now since table doesn't exist yet
      // Will be added when tickets functionality is implemented

      // Optimistic removal
      setClients(prev => prev.filter(client => client.id !== id));

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Client Deleted",
        description: "The client has been successfully removed.",
      });

      return true;

    } catch (error) {
      const errorObj = error as Error;

      // Rollback optimistic removal
      setClients(originalClients);

      logError(errorObj, 'CLIENT_DELETE_ERROR', { id });

      toast({
        title: "Failed to Delete Client",
        description: errorObj.message || "An error occurred while deleting the client.",
        variant: "destructive",
      });

      return false;
    }
  }, [clients, logError]);

  const searchClients = useCallback((searchTerm: string) => {
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      fetchClients(1, searchTerm, filters.status, filters.industry);
    }, 300);

    setSearchDebounceTimer(timer);
  }, [searchDebounceTimer, filters.status, filters.industry, fetchClients]);

  const setStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status }));
    fetchClients(1, filters.search, status, filters.industry);
  }, [filters.search, filters.industry, fetchClients]);

  const setIndustryFilter = useCallback((industry: string) => {
    setFilters(prev => ({ ...prev, industry }));
    fetchClients(1, filters.search, filters.status, industry);
  }, [filters.search, filters.status, fetchClients]);

  const changePage = useCallback((newPage: number) => {
    fetchClients(newPage, filters.search, filters.status, filters.industry);
  }, [filters, fetchClients]);

  const refreshClients = useCallback(() => {
    fetchClients(pagination.page, filters.search, filters.status, filters.industry);
  }, [fetchClients, pagination.page, filters]);

  // Auto-refresh
  useEffect(() => {
    if (enableAutoRefresh) {
      const interval = setInterval(refreshClients, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [enableAutoRefresh, refreshClients]);

  // Initial load
  useEffect(() => {
    fetchClients();
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  return {
    clients,
    loading,
    error,
    pagination,
    filters,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    setStatusFilter,
    setIndustryFilter,
    changePage,
    refreshClients,
    clearError: () => setError(null),
  };
};