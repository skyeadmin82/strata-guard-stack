import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TicketsTable } from '@/components/Tables/TicketsTable';

export const TicketsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-muted-foreground">
              Track, manage, and resolve customer support requests efficiently.
            </p>
          </div>
          
          <TicketsTable />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};