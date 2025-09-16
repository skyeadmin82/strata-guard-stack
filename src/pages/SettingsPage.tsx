import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Configure your MSP platform settings and preferences.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings management features are coming soon. This page will allow you to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Configure system preferences</li>
                <li>Manage integrations and APIs</li>
                <li>Set up notifications and alerts</li>
                <li>Customize the dashboard appearance</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};