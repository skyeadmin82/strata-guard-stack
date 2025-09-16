import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LaunchReadinessDashboard } from '@/components/Launch/LaunchReadinessDashboard';

const LaunchPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <LaunchReadinessDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default LaunchPage;