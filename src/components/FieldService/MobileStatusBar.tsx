import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  MapPin, 
  RefreshCw,
  Smartphone,
  HardDrive,
  Activity
} from 'lucide-react';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';

interface MobileStatusBarProps {
  isOnline: boolean;
  syncProgress: number;
  isSyncing: boolean;
  syncQueue: number;
  currentLocation?: { lat: number; lng: number } | null;
  onForceSync: () => void;
  onRefreshLocation: () => void;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  isOnline,
  syncProgress,
  isSyncing,
  syncQueue,
  currentLocation,
  onForceSync,
  onRefreshLocation
}) => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [dataUsage, setDataUsage] = useState<number>(0);

  useEffect(() => {
    loadDeviceInfo();
    loadNetworkInfo();
    
    // Update network status
    Network.addListener('networkStatusChange', (status) => {
      setNetworkType(status.connectionType);
    });

    return () => {
      // Cleanup handled by Capacitor
    };
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info = await Device.getInfo();
      setDeviceInfo(info);

      // Get battery info if available
      const batteryInfo = await Device.getBatteryInfo();
      setBatteryLevel(batteryInfo.batteryLevel ? Math.round(batteryInfo.batteryLevel * 100) : null);
    } catch (error) {
      console.error('Error loading device info:', error);
    }
  };

  const loadNetworkInfo = async () => {
    try {
      const status = await Network.getStatus();
      setNetworkType(status.connectionType);
    } catch (error) {
      console.error('Error loading network info:', error);
    }
  };

  const getBatteryColor = () => {
    if (!batteryLevel) return 'text-muted-foreground';
    if (batteryLevel <= 20) return 'text-red-500';
    if (batteryLevel <= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBatteryIcon = () => {
    return <Battery className={`h-4 w-4 ${getBatteryColor()}`} />;
  };

  const formatLocation = () => {
    if (!currentLocation) return 'No location';
    return `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
  };

  const getNetworkBadgeVariant = () => {
    if (!isOnline) return 'destructive';
    if (networkType === 'wifi') return 'default';
    if (networkType === 'cellular') return 'secondary';
    return 'outline';
  };

  return (
    <div className="bg-background border-b p-3 space-y-3">
      {/* Top Status Row */}
      <div className="flex items-center justify-between text-sm">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Badge variant={getNetworkBadgeVariant()} className="text-xs">
              {isOnline ? networkType.toUpperCase() : 'OFFLINE'}
            </Badge>
          </div>

          {/* Battery Status */}
          {batteryLevel !== null && (
            <div className="flex items-center gap-1">
              {getBatteryIcon()}
              <span className={`text-xs ${getBatteryColor()}`}>
                {batteryLevel}%
              </span>
            </div>
          )}
        </div>

        {/* Device Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Smartphone className="h-3 w-3" />
          <span>{deviceInfo?.platform || 'Unknown'}</span>
        </div>
      </div>

      {/* Sync Status */}
      {(isSyncing || syncQueue > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Syncing...' : `${syncQueue} items to sync`}
              </span>
            </div>
            {!isSyncing && syncQueue > 0 && (
              <Button
                onClick={onForceSync}
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                disabled={!isOnline}
              >
                Sync Now
              </Button>
            )}
          </div>
          
          {isSyncing && (
            <Progress value={syncProgress} className="h-1" />
          )}
        </div>
      )}

      {/* Location Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {formatLocation()}
          </span>
        </div>
        <Button
          onClick={onRefreshLocation}
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Update
        </Button>
      </div>

      {/* Data Usage Indicator */}
      {dataUsage > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <HardDrive className="h-3 w-3" />
            <span>Data: {dataUsage.toFixed(1)} MB</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3" />
            <span>Memory optimized</span>
          </div>
        </div>
      )}

      {/* Offline Mode Warning */}
      {!isOnline && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
            <WifiOff className="h-4 w-4" />
            <span>
              Working offline. Changes will sync automatically when connection is restored.
            </span>
          </div>
        </div>
      )}

      {/* Low Battery Warning */}
      {batteryLevel && batteryLevel <= 20 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <Battery className="h-4 w-4" />
            <span>
              Battery low ({batteryLevel}%). Consider enabling battery saver mode.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};