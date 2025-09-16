import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MobileWorkOrderCard } from '@/components/FieldService/MobileWorkOrderCard';
import { MobileStatusBar } from '@/components/FieldService/MobileStatusBar';
import { useFieldServices } from '@/hooks/useFieldServices';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  MapPin,
  Camera,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FieldServicePage: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('work-orders');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    workOrders,
    activeTimeEntry,
    currentLocation,
    isLoadingLocation,
    isOnline,
    deviceInfo,
    createWorkOrder,
    updateWorkOrderStatus,
    startTimeEntry,
    stopTimeEntry,
    capturePhoto,
    getCurrentLocation,
    loadWorkOrders
  } = useFieldServices();

  const {
    syncProgress,
    isSyncing,
    syncQueue,
    syncOfflineData
  } = useOfflineStorage();

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const handleStartWorkOrder = async (workOrderId: string) => {
    try {
      await updateWorkOrderStatus(workOrderId, 'in_progress');
      
      // Start time tracking
      await startTimeEntry({
        workOrderId,
        entryType: 'work',
        billable: true
      });

      toast({
        title: "Work Order Started",
        description: "Time tracking has begun",
      });
    } catch (error) {
      console.error('Error starting work order:', error);
    }
  };

  const handleCompleteWorkOrder = async (workOrderId: string) => {
    try {
      await updateWorkOrderStatus(workOrderId, 'completed');
      
      // Stop time tracking if active
      if (activeTimeEntry) {
        await stopTimeEntry('Work completed');
      }

      toast({
        title: "Work Order Completed",
        description: "Time tracking stopped",
      });
    } catch (error) {
      console.error('Error completing work order:', error);
    }
  };

  const handleTakePhoto = async (workOrderId: string) => {
    try {
      await capturePhoto('during', workOrderId, 'Field service photo');
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleViewDetails = (workOrderId: string) => {
    // Navigate to work order details
    console.log('View details for:', workOrderId);
  };

  const handleCreateWorkOrder = async (formData: any) => {
    try {
      await createWorkOrder({
        workOrderNumber: '', // Will be generated
        title: formData.title || 'New Work Order',
        description: formData.description,
        priority: formData.priority || 'medium',
        status: 'assigned',
        serviceType: formData.serviceType,
        estimatedDurationMinutes: parseInt(formData.estimatedDuration) || 60,
        locationAddress: formData.locationAddress
      });
      
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating work order:', error);
    }
  };

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wo.locationAddress && wo.locationAddress.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusCounts = () => {
    return {
      pending: workOrders.filter(wo => wo.status === 'pending').length,
      assigned: workOrders.filter(wo => wo.status === 'assigned').length,
      inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
      completed: workOrders.filter(wo => wo.status === 'completed').length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Mobile Status Bar */}
        <MobileStatusBar
          isOnline={isOnline}
          syncProgress={syncProgress}
          isSyncing={isSyncing}
          syncQueue={syncQueue}
          currentLocation={currentLocation}
          onForceSync={syncOfflineData}
          onRefreshLocation={() => getCurrentLocation(true)}
        />

        {/* Main Content */}
        <div className="p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Field Service</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {currentLocation 
                  ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                  : 'Location unavailable'
                }
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{statusCounts.inProgress}</p>
                  </div>
                  <Play className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned</p>
                    <p className="text-2xl font-bold">{statusCounts.assigned}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Time Entry */}
          {activeTimeEntry && (
            <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Time Tracking Active
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {activeTimeEntry.entryType} - Started {new Date(activeTimeEntry.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => stopTimeEntry()}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Filter */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="work-orders" className="text-xs">
                Orders
                {statusCounts.assigned > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {statusCounts.assigned}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="time" className="text-xs">Time</TabsTrigger>
              <TabsTrigger value="photos" className="text-xs">Photos</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="work-orders" className="mt-4">
              {filteredWorkOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No work orders match your search' : 'No work orders available'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredWorkOrders.map((workOrder) => (
                    <MobileWorkOrderCard
                      key={workOrder.id || workOrder.workOrderNumber}
                      workOrder={workOrder}
                      isOnline={isOnline}
                      onStart={handleStartWorkOrder}
                      onComplete={handleCompleteWorkOrder}
                      onTakePhoto={handleTakePhoto}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="time" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Time Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTimeEntry ? (
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-blue-600">
                        {(() => {
                          const start = new Date(activeTimeEntry.startTime);
                          const now = new Date();
                          const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
                          const hours = Math.floor(diff / 60);
                          const minutes = diff % 60;
                          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        })()}
                      </div>
                      <p className="text-muted-foreground">
                        {activeTimeEntry.entryType.toUpperCase()} - Active
                      </p>
                      <Button
                        onClick={() => stopTimeEntry()}
                        variant="destructive"
                        className="w-full"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop Timer
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">No active time tracking</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => startTimeEntry({ entryType: 'work' })}
                          variant="outline"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Work
                        </Button>
                        <Button
                          onClick={() => startTimeEntry({ entryType: 'travel' })}
                          variant="outline"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Travel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Photo Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => capturePhoto('before')}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Camera className="h-6 w-6 mb-2" />
                      Before
                    </Button>
                    <Button
                      onClick={() => capturePhoto('during')}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Camera className="h-6 w-6 mb-2" />
                      Progress
                    </Button>
                    <Button
                      onClick={() => capturePhoto('after')}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Camera className="h-6 w-6 mb-2" />
                      After
                    </Button>
                    <Button
                      onClick={() => capturePhoto('damage')}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Camera className="h-6 w-6 mb-2" />
                      Damage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Communications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      Communication features coming soon
                    </p>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Work Order Form Modal would go here */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 z-50 p-4">
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Create Work Order</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Quick work order creation form would be implemented here
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCreateForm(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={() => handleCreateWorkOrder({})}>
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
};