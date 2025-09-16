import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UsersTable } from '@/components/Tables/UsersTable';

export const UsersPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions for your organization.
            </p>
          </div>
          
          <UsersTable />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};