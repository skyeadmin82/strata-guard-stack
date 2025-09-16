import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import SystemDashboard from '@/components/Monitoring/SystemDashboard';

export const MonitoringPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor system performance and health metrics.
            </p>
          </div>
          
          <SystemDashboard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};