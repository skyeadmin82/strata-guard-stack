import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { TestingDashboard } from '@/components/Testing/TestingDashboard';

const TestingPage: React.FC = () => {
  return (
    <DashboardLayout>
      <TestingDashboard />
    </DashboardLayout>
  );
};

export default TestingPage;