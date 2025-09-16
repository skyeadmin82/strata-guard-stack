import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket } from 'lucide-react';

export const TicketsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-muted-foreground">
              Track and manage customer support requests.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Ticket Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ticket management features are coming soon. This page will allow you to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Create and assign tickets</li>
                <li>Track ticket status and priority</li>
                <li>Communicate with clients</li>
                <li>Generate support reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};