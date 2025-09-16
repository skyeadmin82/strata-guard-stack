import { useState, useCallback, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';
import { useOfflineStorage } from './useOfflineStorage';

interface WorkOrder {
  id?: string;
  workOrderNumber?: string;
  work_order_number?: string;
  title: string;
  description?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTechnicianId?: string;
  assigned_technician_id?: string;
  clientId?: string;
  client_id?: string;
  locationAddress?: string;
  location_address?: string;
  locationCoordinates?: { lat: number; lng: number };
  location_coordinates?: any;
  scheduledStartTime?: string;
  scheduled_start_time?: string;
  scheduledEndTime?: string;
  scheduled_end_time?: string;
  estimatedDurationMinutes?: number;
  estimated_duration_minutes?: number;
  serviceType?: string;
  service_type?: string;
  equipmentDetails?: any;
  equipment_details?: any;
  syncStatus?: 'synced' | 'pending_sync' | 'conflict';
  sync_status?: string;
  createdAt?: string;
  created_at?: string;
}

interface TimeEntry {
  id?: string;
  workOrderId?: string;
  work_order_id?: string;
  entryType?: 'work' | 'travel' | 'break' | 'lunch';
  entry_type?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  notes?: string;
  billable?: boolean;
  locationStart?: { lat: number; lng: number; address?: string };
  location_start?: any;
  technicianId?: string;
  technician_id?: string;
  durationMinutes?: number;
  duration_minutes?: number;
}

interface PhotoCapture {
  id?: string;
  workOrderId?: string;
  work_order_id?: string;
  photoType?: 'before' | 'during' | 'after' | 'damage' | 'completion' | 'parts' | 'other';
  photo_type?: string;
  filePath?: string;
  file_path?: string;
  compressedFilePath?: string;
  compressed_file_path?: string;
  caption?: string;
  locationCoordinates?: { lat: number; lng: number };
  location_coordinates?: any;
  technicianId?: string;
  technician_id?: string;
  fileSize?: number;
  file_size?: number;
}

export const useFieldServices = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const {
    isOnline,
    storeWorkOrderOffline,
    storeTimeEntryOffline,
    storePhotoOffline,
    getOfflineWorkOrders
  } = useOfflineStorage();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    loadDeviceInfo();
    loadWorkOrders();
    getCurrentLocation();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info = await Device.getInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error getting device info:', error);
    }
  };

  const getCurrentLocation = async (showToast = false) => {
    setIsLoadingLocation(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });

      const location = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      setCurrentLocation(location);
      
      if (showToast) {
        toast({
          title: "Location Updated",
          description: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`,
        });
      }

      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      
      // Fallback to last known location or default
      if (!currentLocation) {
        const fallbackLocation = { lat: 0, lng: 0 };
        setCurrentLocation(fallbackLocation);
        
        if (showToast) {
          toast({
            title: "Location Unavailable",
            description: "Using default location",
            variant: "destructive"
          });
        }
        
        return fallbackLocation;
      }
      
      return currentLocation;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const loadWorkOrders = async () => {
    try {
      if (isOnline && tenantId) {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWorkOrders(data || []);
      } else {
        // Load from offline storage
        const offlineOrders = await getOfflineWorkOrders();
        setWorkOrders(offlineOrders);
      }
    } catch (error) {
      console.error('Error loading work orders:', error);
      toast({
        title: "Error Loading Work Orders",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const createWorkOrder = async (workOrderData: Omit<WorkOrder, 'id'>) => {
    try {
      const location = await getCurrentLocation();
      const workOrderNumber = `WO-${Date.now()}`;
      
      const workOrder = {
        ...workOrderData,
        workOrderNumber,
        locationCoordinates: workOrderData.locationCoordinates || location,
        createdAt: new Date().toISOString()
      };

      if (isOnline && tenantId) {
        const { data, error } = await supabase
          .from('work_orders')
          .insert({
            ...workOrder,
            tenant_id: tenantId,
            work_order_number: workOrderNumber
          })
          .select()
          .single();

        if (error) throw error;

        // Transform and add to local state
        const transformedOrder = {
          ...data,
          workOrderNumber: data.work_order_number,
          assignedTechnicianId: data.assigned_technician_id,
          locationAddress: data.location_address,
          locationCoordinates: data.location_coordinates,
          scheduledStartTime: data.scheduled_start_time,
          scheduledEndTime: data.scheduled_end_time,
          estimatedDurationMinutes: data.estimated_duration_minutes,
          serviceType: data.service_type,
          equipmentDetails: data.equipment_details,
          syncStatus: data.sync_status
        };

        setWorkOrders(prev => [transformedOrder, ...prev]);
        
        toast({
          title: "Work Order Created",
          description: `${workOrderNumber} created successfully`,
        });

        return data;
      } else {
        // Store offline
        const offlineWorkOrder = await storeWorkOrderOffline(workOrder);
        setWorkOrders(prev => [offlineWorkOrder, ...prev]);
        
        toast({
          title: "Work Order Saved Offline",
          description: `${workOrderNumber} will sync when online`,
        });

        return offlineWorkOrder;
      }
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        title: "Error Creating Work Order",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return null;
    }
  };

  const startTimeEntry = async (timeEntryData: Omit<TimeEntry, 'id' | 'startTime'>) => {
    try {
      const location = await getCurrentLocation();
      
      const timeEntry: TimeEntry = {
        ...timeEntryData,
        startTime: new Date().toISOString(),
        locationStart: location ? { ...location, address: 'Current Location' } : undefined
      };

      if (isOnline && tenantId) {
        const { data, error } = await supabase
          .from('time_entries')
          .insert({
            work_order_id: timeEntry.workOrderId,
            entry_type: timeEntry.entryType,
            start_time: timeEntry.startTime,
            notes: timeEntry.notes,
            billable: timeEntry.billable,
            location_start: timeEntry.locationStart,
            tenant_id: tenantId,
            technician_id: tenantId // Replace with actual technician ID
          })
          .select()
          .single();

        if (error) throw error;
        
        // Transform response
        const transformedEntry = {
          ...data,
          workOrderId: data.work_order_id,
          entryType: data.entry_type,
          startTime: data.start_time,
          endTime: data.end_time,
          locationStart: data.location_start,
          durationMinutes: data.duration_minutes
        };
        
        setActiveTimeEntry(transformedEntry);
      } else {
        // Store offline
        const offlineEntry = await storeTimeEntryOffline(timeEntry);
        setActiveTimeEntry(offlineEntry);
      }

      toast({
        title: "Time Entry Started",
        description: `${timeEntry.entryType} tracking started`,
      });

      return timeEntry;
    } catch (error) {
      console.error('Error starting time entry:', error);
      toast({
        title: "Error Starting Time Entry",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return null;
    }
  };

  const stopTimeEntry = async (notes?: string) => {
    if (!activeTimeEntry) return;

    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(activeTimeEntry.startTime);
      const duration = Math.round((new Date(endTime).getTime() - startTime.getTime()) / 60000);

      const updatedEntry = {
        ...activeTimeEntry,
        endTime,
        durationMinutes: duration,
        notes
      };

      if (isOnline && tenantId && activeTimeEntry.id) {
        const { error } = await supabase
          .from('time_entries')
          .update({
            end_time: endTime,
            duration_minutes: duration,
            notes
          })
          .eq('id', activeTimeEntry.id);

        if (error) throw error;
      }

      setActiveTimeEntry(null);
      
      toast({
        title: "Time Entry Stopped",
        description: `Duration: ${Math.floor(duration / 60)}h ${duration % 60}m`,
      });

      return updatedEntry;
    } catch (error) {
      console.error('Error stopping time entry:', error);
      toast({
        title: "Error Stopping Time Entry",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return null;
    }
  };

  const capturePhoto = async (
    photoType: PhotoCapture['photoType'],
    workOrderId?: string,
    caption?: string
  ): Promise<PhotoCapture | null> => {
    try {
      // Request camera permissions and capture photo
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 80,
        width: 1920,
        height: 1080,
        correctOrientation: true
      });

      if (!photo.webPath) {
        throw new Error('Failed to capture photo');
      }

      const location = await getCurrentLocation();
      const timestamp = Date.now();
      const fileName = `photo_${timestamp}.jpg`;
      
      // Read the photo as base64
      const photoResponse = await fetch(photo.webPath);
      const photoBlob = await photoResponse.blob();
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data URL prefix
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(photoBlob);
      const base64Data = await base64Promise;

      // Save to device filesystem
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });

      const photoCapture: PhotoCapture = {
        workOrderId,
        photoType,
        filePath: savedFile.uri,
        caption,
        locationCoordinates: location
      };

      if (isOnline && tenantId) {
        const { data, error } = await supabase
          .from('field_service_photos')
          .insert({
            work_order_id: photoCapture.workOrderId,
            photo_type: photoCapture.photoType,
            file_path: photoCapture.filePath,
            caption: photoCapture.caption,
            location_coordinates: photoCapture.locationCoordinates,
            tenant_id: tenantId,
            technician_id: tenantId, // Replace with actual technician ID
            file_size: photoBlob.size
          })
          .select()
          .single();

        if (error) throw error;
        
        toast({
          title: "Photo Captured",
          description: "Photo saved successfully",
        });

        // Transform response
        const transformedPhoto = {
          ...data,
          workOrderId: data.work_order_id,
          photoType: data.photo_type,
          filePath: data.file_path,
          locationCoordinates: data.location_coordinates,
          fileSize: data.file_size
        };

        return transformedPhoto;
      } else {
        // Store offline
        const offlinePhoto = await storePhotoOffline(photoCapture);
        
        toast({
          title: "Photo Saved Offline",
          description: "Photo will sync when online",
        });

        return offlinePhoto;
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Photo Capture Failed",
        description: error instanceof Error ? error.message : "Camera unavailable",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateWorkOrderStatus = async (workOrderId: string, status: WorkOrder['status'], notes?: string) => {
    try {
      if (isOnline && tenantId) {
        const { error } = await supabase
          .from('work_orders')
          .update({
            status,
            completion_notes: notes,
            actual_end_time: status === 'completed' ? new Date().toISOString() : undefined
          })
          .eq('id', workOrderId);

        if (error) throw error;
      }

      // Update local state
      setWorkOrders(prev => 
        prev.map(wo => 
          wo.id === workOrderId 
            ? { ...wo, status, completionNotes: notes }
            : wo
        )
      );

      toast({
        title: "Work Order Updated",
        description: `Status changed to ${status}`,
      });
    } catch (error) {
      console.error('Error updating work order:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return {
    // State
    workOrders,
    activeTimeEntry,
    currentLocation,
    isLoadingLocation,
    isOnline,
    deviceInfo,

    // Actions
    createWorkOrder,
    updateWorkOrderStatus,
    startTimeEntry,
    stopTimeEntry,
    capturePhoto,
    getCurrentLocation,
    loadWorkOrders
  };
};