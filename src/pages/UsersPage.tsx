import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const UsersPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User management features are coming soon. This page will allow you to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Add and remove users</li>
                <li>Manage user roles and permissions</li>
                <li>View user activity logs</li>
                <li>Configure user settings</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};