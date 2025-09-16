import { useState, useCallback, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';

interface OfflineData {
  workOrders: any[];
  timeEntries: any[];
  photos: any[];
  syncQueue: any[];
  lastSync: string;
}

interface SyncQueueItem {
  id: string;
  entityType: 'work_order' | 'time_entry' | 'photo' | 'message';
  entityId?: string;
  localId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  priority: 1 | 2 | 3;
  createdAt: string;
}

const STORAGE_KEYS = {
  WORK_ORDERS: 'offline_work_orders',
  TIME_ENTRIES: 'offline_time_entries',
  PHOTOS: 'offline_photos',
  SYNC_QUEUE: 'offline_sync_queue',
  LAST_SYNC: 'last_sync_timestamp',
  DEVICE_ID: 'device_id'
} as const;

export const useOfflineStorage = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Monitor network status
  useEffect(() => {
    const checkNetworkStatus = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkNetworkStatus();
    loadSyncQueue();

    // Setup network listener
    Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
      if (status.connected) {
        toast({
          title: "Connection Restored",
          description: "Syncing offline data...",
        });
        syncOfflineData();
      } else {
        toast({
          title: "Connection Lost",
          description: "Working in offline mode",
          variant: "destructive"
        });
      }
    });

    return () => {
      // Cleanup handled by Capacitor
    };
  }, []);

  const generateLocalId = () => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const storeData = async (key: string, data: any) => {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error storing data:', error);
    }
  };

  const getData = async (key: string) => {
    try {
      const result = await Preferences.get({ key });
      return result.value ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  };

  const addToSyncQueue = useCallback(async (item: Omit<SyncQueueItem, 'id' | 'createdAt'>) => {
    const queueItem: SyncQueueItem = {
      ...item,
      id: generateLocalId(),
      createdAt: new Date().toISOString()
    };

    const currentQueue = await getData(STORAGE_KEYS.SYNC_QUEUE) || [];
    const newQueue = [...currentQueue, queueItem];
    
    await storeData(STORAGE_KEYS.SYNC_QUEUE, newQueue);
    setSyncQueue(newQueue);

    // If online, try to sync immediately
    if (isOnline) {
      setTimeout(() => syncOfflineData(), 1000);
    }
  }, [isOnline]);

  const loadSyncQueue = async () => {
    const queue = await getData(STORAGE_KEYS.SYNC_QUEUE) || [];
    setSyncQueue(queue);
  };

  // Store work order offline
  const storeWorkOrderOffline = async (workOrder: any) => {
    const localId = generateLocalId();
    const offlineWorkOrder = {
      ...workOrder,
      localId,
      syncStatus: 'pending_sync',
      offlineCreatedAt: new Date().toISOString()
    };

    const existingWorkOrders = await getData(STORAGE_KEYS.WORK_ORDERS) || [];
    const updatedWorkOrders = [...existingWorkOrders, offlineWorkOrder];
    await storeData(STORAGE_KEYS.WORK_ORDERS, updatedWorkOrders);

    await addToSyncQueue({
      entityType: 'work_order',
      localId,
      action: 'create',
      data: offlineWorkOrder,
      priority: 1
    });

    return offlineWorkOrder;
  };

  // Store time entry offline
  const storeTimeEntryOffline = async (timeEntry: any) => {
    const localId = generateLocalId();
    const offlineTimeEntry = {
      ...timeEntry,
      localId,
      syncStatus: 'pending_sync',
      offlineCreatedAt: new Date().toISOString()
    };

    const existingEntries = await getData(STORAGE_KEYS.TIME_ENTRIES) || [];
    const updatedEntries = [...existingEntries, offlineTimeEntry];
    await storeData(STORAGE_KEYS.TIME_ENTRIES, updatedEntries);

    await addToSyncQueue({
      entityType: 'time_entry',
      localId,
      action: 'create',
      data: offlineTimeEntry,
      priority: 2
    });

    return offlineTimeEntry;
  };

  // Store photo offline
  const storePhotoOffline = async (photo: any) => {
    const localId = generateLocalId();
    const offlinePhoto = {
      ...photo,
      localId,
      syncStatus: 'pending_sync',
      offlineCreatedAt: new Date().toISOString()
    };

    const existingPhotos = await getData(STORAGE_KEYS.PHOTOS) || [];
    const updatedPhotos = [...existingPhotos, offlinePhoto];
    await storeData(STORAGE_KEYS.PHOTOS, updatedPhotos);

    await addToSyncQueue({
      entityType: 'photo',
      localId,
      action: 'create',
      data: offlinePhoto,
      priority: 2
    });

    return offlinePhoto;
  };

  // Sync offline data to server
  const syncOfflineData = async () => {
    if (!isOnline || !tenantId || isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const queue = await getData(STORAGE_KEYS.SYNC_QUEUE) || [];
      if (queue.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Sort by priority and creation date
      const sortedQueue = queue.sort((a: SyncQueueItem, b: SyncQueueItem) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const totalItems = sortedQueue.length;
      let processedItems = 0;

      for (const item of sortedQueue) {
        try {
          await syncQueueItem(item);
          processedItems++;
          setSyncProgress(Math.round((processedItems / totalItems) * 100));
        } catch (error) {
          console.error('Error syncing item:', error);
          // Item will remain in queue for retry
        }
      }

      // Remove synced items from queue
      const failedItems = queue.filter((item: SyncQueueItem) => 
        !sortedQueue.find(synced => synced.id === item.id)
      );
      await storeData(STORAGE_KEYS.SYNC_QUEUE, failedItems);
      setSyncQueue(failedItems);

      // Update last sync time
      await Preferences.set({
        key: STORAGE_KEYS.LAST_SYNC,
        value: new Date().toISOString()
      });

      toast({
        title: "Sync Complete",
        description: `${processedItems} items synced successfully`,
      });

    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Some items could not be synced",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const syncQueueItem = async (item: SyncQueueItem) => {
    switch (item.entityType) {
      case 'work_order':
        if (item.action === 'create') {
          const { data, error } = await supabase
            .from('work_orders')
            .insert({
              ...item.data,
              tenant_id: tenantId,
              sync_status: 'synced'
            });
          if (error) throw error;
        }
        break;

      case 'time_entry':
        if (item.action === 'create') {
          const { data, error } = await supabase
            .from('time_entries')
            .insert({
              ...item.data,
              tenant_id: tenantId,
              sync_status: 'synced'
            });
          if (error) throw error;
        }
        break;

      case 'photo':
        if (item.action === 'create') {
          const { data, error } = await supabase
            .from('field_service_photos')
            .insert({
              ...item.data,
              tenant_id: tenantId,
              sync_status: 'synced'
            });
          if (error) throw error;
        }
        break;

      default:
        console.warn('Unknown entity type:', item.entityType);
    }
  };

  // Get offline data
  const getOfflineWorkOrders = async () => {
    return await getData(STORAGE_KEYS.WORK_ORDERS) || [];
  };

  const getOfflineTimeEntries = async () => {
    return await getData(STORAGE_KEYS.TIME_ENTRIES) || [];
  };

  const getOfflinePhotos = async () => {
    return await getData(STORAGE_KEYS.PHOTOS) || [];
  };

  // Clear offline data (after successful sync)
  const clearOfflineData = async () => {
    await Preferences.clear();
    setSyncQueue([]);
  };

  return {
    isOnline,
    isSyncing,
    syncProgress,
    syncQueue: syncQueue.length,
    storeWorkOrderOffline,
    storeTimeEntryOffline,
    storePhotoOffline,
    getOfflineWorkOrders,
    getOfflineTimeEntries,
    getOfflinePhotos,
    syncOfflineData,
    clearOfflineData,
    addToSyncQueue
  };
};