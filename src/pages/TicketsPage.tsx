import React, { useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TicketKanbanBoard } from '@/components/Tickets/TicketKanbanBoard';
import { TimeTrackingPanel } from '@/components/Tickets/TimeTrackingPanel';
import { useEnhancedTicketManagement } from '@/hooks/useEnhancedTicketManagement';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TicketsTable } from '@/components/Tables/TicketsTable';
import { 
  LayoutGrid, 
  List, 
  Timer,
  RefreshCw,
  Settings
} from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'table' | 'kanban'>('table');
  const [selectedTicketForTracking, setSelectedTicketForTracking] = useState<string | null>(null);
  
  const {
    tickets,
    loading,
    updateTicket,
    getSLAStatus,
    fetchTicketsWithDetails
  } = useEnhancedTicketManagement();

  const handleViewTicket = (ticket: any) => {
    console.log('View ticket details:', ticket.id);
    // Here you would typically open a ticket details modal/page
  };

  const getStatusCounts = () => {
    const counts = {
      total: tickets.length,
      open: tickets.filter(t => ['submitted', 'in_review', 'in_progress', 'pending_client'].includes(t.status)).length,
      overdue: tickets.filter(t => getSLAStatus(t) === 'overdue').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
              <p className="text-muted-foreground">
                Track, manage, and resolve customer support requests with advanced SLA monitoring.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchTicketsWithDetails} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={activeView === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('table')}
                  className="px-3"
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={activeView === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('kanban')}
                  className="px-3"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Kanban
                </Button>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold">{statusCounts.open}</div>
              <div className="text-sm text-muted-foreground">Open Tickets</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-destructive">{statusCounts.overdue}</div>
                {statusCounts.overdue > 0 && <Badge variant="destructive" className="text-xs">Alert</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">SLA Overdue</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved Today</div>
            </div>
          </div>

          {/* Main Content */}
          <ErrorBoundary>
            {activeView === 'table' ? (
              <TicketsTable />
            ) : (
              <TicketKanbanBoard
                tickets={tickets}
                onUpdateTicket={updateTicket}
                onViewTicket={handleViewTicket}
                getSLAStatus={getSLAStatus}
                loading={loading}
              />
            )}
          </ErrorBoundary>

          {/* Time Tracking Sidebar */}
          {selectedTicketForTracking && (
            <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Time Tracking
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTicketForTracking(null)}
                  >
                    ✕
                  </Button>
                </div>
                
                <TimeTrackingPanel
                  ticketId={selectedTicketForTracking}
                  ticketTitle={tickets.find(t => t.id === selectedTicketForTracking)?.title || ''}
                />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};