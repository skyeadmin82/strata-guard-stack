import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorLogger } from '@/hooks/useErrorLogger';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { toast } from '@/hooks/use-toast';

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
type TicketStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress' | 'pending_client' | 'resolved' | 'closed';

interface EnhancedTicket {
  id: string;
  tenant_id: string;
  client_id: string;
  contact_id?: string;
  assigned_to?: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category?: string;
  subcategory?: string;
  tags?: string[];
  ticket_number: string;
  sla_due_date?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  client_satisfaction_rating?: number;
  internal_notes?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Relationships - using simplified types to match actual database response
  clients?: { name: string };
  contacts?: { first_name: string; last_name: string };
}

interface TicketFilters {
  search: string;
  status: string;
  priority: string;
  assignedTo: string;
  slaStatus: string;
  tags: string[];
}

interface BulkTicketAction {
  action: 'update_status' | 'update_priority' | 'assign_user' | 'add_tags' | 'export';
  params?: any;
}

export const useEnhancedTicketManagement = () => {
  const { environment } = useEnvironment();
  const { logError } = useErrorLogger(environment);
  
  const [tickets, setTickets] = useState<EnhancedTicket[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    slaStatus: 'all',
    tags: []
  });

  // Fetch tickets with enhanced data
  const fetchTicketsWithDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          clients:client_id(id, name),
          contacts:contact_id(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as any[]);

    } catch (error) {
      logError(error as Error, 'ENHANCED_TICKET_FETCH_ERROR');
      toast({
        title: "Error Loading Tickets",
        description: "Unable to load ticket data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [logError]);

  // Fetch supporting data
  const fetchSupportingData = useCallback(async () => {
    try {
      // Fetch users for assignment
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .order('first_name');

      if (userError) throw userError;
      setUsers(userData || []);

      // Fetch clients
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (clientError) throw clientError;
      setClients(clientData || []);

    } catch (error) {
      console.warn('Failed to fetch supporting data:', error);
    }
  }, []);

  // Create ticket
  const createTicket = useCallback(async (ticketData: Partial<EnhancedTicket>) => {
    try {
      const ticketNumber = `TK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, '0')}`;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          title: ticketData.title || '',
          description: ticketData.description || '',
          client_id: ticketData.client_id || '',
          priority: ticketData.priority || 'medium',
          category: ticketData.category,
          ticket_number: ticketNumber,
          status: 'submitted'
        } as any)
        .select(`
          *,
          clients:client_id(id, name),
          contacts:contact_id(id, first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setTickets(prev => [data as any, ...prev]);
      
      toast({
        title: "Ticket Created",
        description: `Ticket ${ticketNumber} has been created successfully.`,
      });

      return data;
    } catch (error) {
      logError(error as Error, 'TICKET_CREATE_ERROR');
      toast({
        title: "Creation Failed",
        description: "Unable to create ticket.",
        variant: "destructive",
      });
      throw error;
    }
  }, [logError]);

  // Update ticket
  const updateTicket = useCallback(async (ticketId: string, updates: Partial<EnhancedTicket>) => {
    try {
      const updateData: any = { ...updates };
      
      // Auto-set timestamps based on status changes
      if (updates.status === 'resolved' && !updates.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      if (updates.status === 'closed' && !updates.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }
      if (updates.status === 'in_progress' && !updates.first_response_at) {
        updateData.first_response_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select(`
          *,
          clients:client_id(id, name),
          contacts:contact_id(id, first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? data as any : ticket
      ));

      toast({
        title: "Ticket Updated",
        description: "Ticket has been updated successfully.",
      });

      return data;
    } catch (error) {
      logError(error as Error, 'TICKET_UPDATE_ERROR', { ticketId });
      toast({
        title: "Update Failed",
        description: "Unable to update ticket.",
        variant: "destructive",
      });
      throw error;
    }
  }, [logError]);

  // Delete ticket
  const deleteTicket = useCallback(async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      
      toast({
        title: "Ticket Deleted",
        description: "Ticket has been deleted successfully.",
      });

      return true;
    } catch (error) {
      logError(error as Error, 'TICKET_DELETE_ERROR', { ticketId });
      toast({
        title: "Delete Failed",
        description: "Unable to delete ticket.",
        variant: "destructive",
      });
      return false;
    }
  }, [logError]);

  // Bulk actions
  const executeBulkAction = useCallback(async (action: BulkTicketAction) => {
    if (selectedTickets.size === 0) {
      toast({
        title: "No Tickets Selected",
        description: "Please select tickets to perform bulk actions.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setBulkActionLoading(true);
      const ticketIds = Array.from(selectedTickets);

      switch (action.action) {
        case 'update_status':
          const { error: statusError } = await supabase
            .from('support_tickets')
            .update({ status: action.params.status })
            .in('id', ticketIds);
          
          if (statusError) throw statusError;
          break;

        case 'update_priority':
          const { error: priorityError } = await supabase
            .from('support_tickets')
            .update({ priority: action.params.priority })
            .in('id', ticketIds);
          
          if (priorityError) throw priorityError;
          break;

        case 'assign_user':
          const { error: assignError } = await supabase
            .from('support_tickets')
            .update({ assigned_to: action.params.userId })
            .in('id', ticketIds);
          
          if (assignError) throw assignError;
          break;

        case 'add_tags':
          // This would need special handling to merge tags
          for (const ticketId of ticketIds) {
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket) {
              const existingTags = ticket.tags || [];
              const newTags = [...new Set([...existingTags, ...action.params.tags])];
              
              const { error } = await supabase
                .from('support_tickets')
                .update({ tags: newTags })
                .eq('id', ticketId);
              
              if (error) throw error;
            }
          }
          break;

        case 'export':
          await exportTickets(ticketIds);
          break;
      }

      toast({
        title: "Bulk Action Completed",
        description: `Successfully processed ${ticketIds.length} tickets.`,
      });

      // Refresh data
      await fetchTicketsWithDetails();
      setSelectedTickets(new Set());
      return true;

    } catch (error) {
      logError(error as Error, 'BULK_TICKET_ACTION_ERROR', { action });
      toast({
        title: "Bulk Action Failed",
        description: "An error occurred while processing the bulk action.",
        variant: "destructive",
      });
      return false;
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedTickets, logError, tickets, fetchTicketsWithDetails]);

  // Export tickets
  const exportTickets = useCallback(async (ticketIds?: string[]) => {
    try {
      const ticketsToExport = ticketIds 
        ? tickets.filter(t => ticketIds.includes(t.id))
        : tickets;

      if (ticketsToExport.length === 0) {
        toast({
          title: "No Tickets to Export",
          description: "No tickets available for export.",
          variant: "destructive",
        });
        return;
      }

      // Enhanced export with all relevant fields
      const exportData = ticketsToExport.map(ticket => ({
        'Ticket Number': ticket.ticket_number,
        'Title': ticket.title,
        'Description': ticket.description,
        'Client': ticket.clients?.name || '',
        'Contact': ticket.contacts ? `${ticket.contacts.first_name} ${ticket.contacts.last_name}` : '',
        'Priority': ticket.priority,
        'Status': ticket.status,
        'Category': ticket.category || '',
        'Tags': ticket.tags?.join(', ') || '',
        'Assigned To': '',
        'SLA Due Date': ticket.sla_due_date ? new Date(ticket.sla_due_date).toLocaleDateString() : '',
        'Created Date': new Date(ticket.created_at).toLocaleDateString(),
        'First Response': ticket.first_response_at ? new Date(ticket.first_response_at).toLocaleDateString() : '',
        'Resolved Date': ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : '',
        'Satisfaction Rating': ticket.client_satisfaction_rating || ''
      }));

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
      link.setAttribute('download', `tickets-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Exported ${exportData.length} tickets to CSV.`,
      });

    } catch (error) {
      logError(error as Error, 'TICKET_EXPORT_ERROR');
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting tickets.",
        variant: "destructive",
      });
    }
  }, [tickets, logError]);

  // Advanced filtering
  const getFilteredTickets = useCallback(() => {
    return tickets.filter(ticket => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!ticket.title.toLowerCase().includes(searchLower) &&
            !ticket.description.toLowerCase().includes(searchLower) &&
            !ticket.ticket_number.toLowerCase().includes(searchLower) &&
            !ticket.clients?.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && ticket.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) {
        return false;
      }

      // Assigned user filter
      if (filters.assignedTo !== 'all' && ticket.assigned_to !== filters.assignedTo) {
        return false;
      }

      // SLA status filter
      if (filters.slaStatus !== 'all') {
        const now = new Date();
        const slaDate = ticket.sla_due_date ? new Date(ticket.sla_due_date) : null;
        
        switch (filters.slaStatus) {
          case 'overdue':
            if (!slaDate || slaDate > now || ticket.status === 'resolved' || ticket.status === 'closed') return false;
            break;
          case 'due_soon':
            if (!slaDate || slaDate < now || ticket.status === 'resolved' || ticket.status === 'closed') return false;
            const hoursDiff = (slaDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > 24) return false;
            break;
          case 'on_track':
            if (!slaDate || slaDate < now || ticket.status === 'resolved' || ticket.status === 'closed') return false;
            const hoursLeft = (slaDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursLeft <= 24) return false;
            break;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const ticketTags = ticket.tags || [];
        if (!filters.tags.some(tag => ticketTags.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filters]);

  // Selection management
  const toggleTicketSelection = useCallback((ticketId: string) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  }, []);

  const selectAllTickets = useCallback((ticketIds: string[]) => {
    setSelectedTickets(new Set(ticketIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTickets(new Set());
  }, []);

  // Get SLA status
  const getSLAStatus = useCallback((ticket: EnhancedTicket) => {
    if (!ticket.sla_due_date || ticket.status === 'resolved' || ticket.status === 'closed') {
      return 'none';
    }

    const now = new Date();
    const slaDate = new Date(ticket.sla_due_date);
    const hoursDiff = (slaDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 0) return 'overdue';
    if (hoursDiff <= 24) return 'due_soon';
    return 'on_track';
  }, []);

  // Initialize data
  useEffect(() => {
    fetchTicketsWithDetails();
    fetchSupportingData();
  }, [fetchTicketsWithDetails, fetchSupportingData]);

  return {
    // Data
    tickets: getFilteredTickets(),
    users,
    clients,
    selectedTickets,
    
    // Loading states
    loading,
    bulkActionLoading,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    fetchTicketsWithDetails,
    createTicket,
    updateTicket,
    deleteTicket,
    executeBulkAction,
    exportTickets,
    
    // Selection
    toggleTicketSelection,
    selectAllTickets,
    clearSelection,
    
    // Utilities
    getSLAStatus,
  };
};