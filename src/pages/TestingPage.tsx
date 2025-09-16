import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TestingDashboard } from '@/components/Testing/TestingDashboard';

const TestingPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <TestingDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default TestingPage;