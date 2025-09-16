import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FinancialDashboard } from '@/components/Financial/FinancialDashboard';

export const FinancialManagementPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <FinancialDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};