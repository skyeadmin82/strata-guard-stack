import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { LaunchReadinessDashboard } from '@/components/Launch/LaunchReadinessDashboard';

const LaunchPage: React.FC = () => {
  return (
    <DashboardLayout>
      <LaunchReadinessDashboard />
    </DashboardLayout>
  );
};

export default LaunchPage;