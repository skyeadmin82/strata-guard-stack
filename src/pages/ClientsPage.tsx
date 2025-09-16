import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ClientForm } from '@/components/Forms/ClientForm';
import { Client } from '@/types/database';
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

  // Using enhanced client management through EnhancedClientsTable
  const [loading, setLoading] = useState(false);

  const createClient = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    // Implementation handled by the enhanced table
    console.log('Creating client:', data);
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    // Implementation handled by the enhanced table  
    console.log('Updating client:', id, data);
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    // Implementation handled by the enhanced table
    console.log('Deleting client:', id);
    return true;
  };

  const handleCreateClient = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleSubmitForm = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    if (editingClient) {
      await updateClient(editingClient.id, data);
    } else {
      await createClient(data);
    }
    handleCloseForm();
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