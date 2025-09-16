import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketTemplateManager } from '@/components/Tickets/TicketTemplateManager';
import { SLAManager } from '@/components/Tickets/SLAManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, FileText, Clock } from 'lucide-react';

export const TicketManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ticket Management</h1>
              <p className="text-muted-foreground">
                Configure ticket templates and SLA rules for efficient support operations.
              </p>
            </div>
          </div>

          {/* Management Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ticket Templates
              </TabsTrigger>
              <TabsTrigger value="sla" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                SLA Rules
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              <TicketTemplateManager />
            </TabsContent>

            <TabsContent value="sla" className="space-y-6">
              <SLAManager />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};