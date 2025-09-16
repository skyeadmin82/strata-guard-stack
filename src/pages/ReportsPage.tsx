import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ReportsHub } from '@/components/Reports/ReportsHub';

export const ReportsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ReportsHub />
      </DashboardLayout>
    </ProtectedRoute>
  );
};