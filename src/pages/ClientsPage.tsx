import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ClientForm } from '@/components/Forms/ClientForm';
import { Client } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedClientManagement } from '@/hooks/useEnhancedClientManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EnhancedClientsTable } from '@/components/Client/EnhancedClientsTable';

export const ClientsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [returnToDetailsAfterEdit, setReturnToDetailsAfterEdit] = useState<string | null>(null);
  const { toast } = useToast();
  const { fetchClientsWithStats } = useEnhancedClientManagement();

  const createClient = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    try {
      setLoading(true);
      console.log('Creating client:', data);
      
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', currentUser.user?.id)
        .single();

      const clientData = {
        ...data,
        tenant_id: userProfile?.tenant_id,
      };

      const { error } = await supabase
        .from('clients')
        .insert(clientData);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Client created successfully',
      });

      // Refresh the clients list
      await fetchClientsWithStats();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to create client',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    try {
      setLoading(true);
      console.log('Updating client:', id, data);
      
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });

      // Refresh the clients list
      await fetchClientsWithStats();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      console.log('Deleting client:', id);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });

      // Refresh the clients list
      await fetchClientsWithStats();
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleCreateClient = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client, fromDetails = false) => {
    setEditingClient(client);
    if (fromDetails) {
      setReturnToDetailsAfterEdit(client.id);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setReturnToDetailsAfterEdit(null);
  };

  const handleSubmitForm = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (editingClient) {
      await updateClient(editingClient.id, data);
    } else {
      await createClient(data);
    }
    
    const shouldReturnToDetails = returnToDetailsAfterEdit;
    handleCloseForm();
    
    // If we need to return to details dialog, set it after a brief delay to ensure state is clean
    if (shouldReturnToDetails) {
      setTimeout(() => {
        // Find the updated client and show details
        const updatedClient = document.querySelector(`[data-client-id="${shouldReturnToDetails}"]`) as HTMLElement;
        if (updatedClient) {
          updatedClient.click();
        }
      }, 100);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">
              Manage your client relationships and track their information.
            </p>
          </div>

          <ErrorBoundary>
            <EnhancedClientsTable
              onCreateClient={handleCreateClient}
              onEditClient={handleEditClient}
              onDeleteClient={deleteClient}
            />
          </ErrorBoundary>

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient 
                    ? 'Update the client information below.'
                    : 'Fill in the details to add a new client to your system.'
                  }
                </DialogDescription>
              </DialogHeader>
              <ErrorBoundary>
                <ClientForm
                  client={editingClient}
                  onSubmit={handleSubmitForm}
                  onCancel={handleCloseForm}
                  loading={loading}
                />
              </ErrorBoundary>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};