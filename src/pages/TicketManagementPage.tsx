import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketTemplateManager } from '@/components/Tickets/TicketTemplateManager';
import { SLAManager } from '@/components/Tickets/SLAManager';
import { 
  Settings, 
  FileText, 
  Clock, 
  Users, 
  BarChart3
} from 'lucide-react';

export const TicketManagementPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Ticket Management
            </h1>
            <p className="text-muted-foreground">
              Configure ticket templates, SLA rules, and system settings
            </p>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="sla" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                SLA Rules
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates">
              <TicketTemplateManager />
            </TabsContent>
            
            <TabsContent value="sla">
              <SLAManager />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};