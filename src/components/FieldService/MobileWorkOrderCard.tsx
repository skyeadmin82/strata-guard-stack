import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  User, 
  Camera, 
  CheckCircle, 
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface WorkOrder {
  id?: string;
  workOrderNumber: string;
  title: string;
  description?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  locationAddress?: string;
  scheduledStartTime?: string;
  estimatedDurationMinutes?: number;
  serviceType?: string;
  syncStatus?: 'synced' | 'pending_sync' | 'conflict';
}

interface MobileWorkOrderCardProps {
  workOrder: WorkOrder;
  isOnline: boolean;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onTakePhoto: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const MobileWorkOrderCard: React.FC<MobileWorkOrderCardProps> = ({
  workOrder,
  isOnline,
  onStart,
  onComplete,
  onTakePhoto,
  onViewDetails
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'assigned':
        return 'outline';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSyncIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    if (workOrder.syncStatus === 'pending_sync') {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (workOrder.syncStatus === 'conflict') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not scheduled';
    try {
      return new Date(timeString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Invalid time';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="mb-4 touch-manipulation">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold truncate">
              {workOrder.workOrderNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {workOrder.title}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {getSyncIcon()}
            <Badge variant={getPriorityColor(workOrder.priority)} className="text-xs">
              {workOrder.priority.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Status and Service Type */}
        <div className="flex items-center justify-between">
          <Badge variant={getStatusColor(workOrder.status)} className="text-xs">
            {workOrder.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {workOrder.serviceType && (
            <span className="text-xs text-muted-foreground">
              {workOrder.serviceType}
            </span>
          )}
        </div>

        {/* Location */}
        {workOrder.locationAddress && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{workOrder.locationAddress}</span>
          </div>
        )}

        {/* Time Information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatTime(workOrder.scheduledStartTime)}</span>
          </div>
          {workOrder.estimatedDurationMinutes && (
            <span>{formatDuration(workOrder.estimatedDurationMinutes)}</span>
          )}
        </div>

        {/* Description */}
        {workOrder.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workOrder.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {workOrder.status === 'assigned' || workOrder.status === 'pending' ? (
            <Button
              onClick={() => workOrder.id && onStart(workOrder.id)}
              className="flex items-center gap-2 touch-manipulation h-12"
              variant="default"
            >
              <PlayCircle className="h-4 w-4" />
              <span className="text-sm">Start</span>
            </Button>
          ) : workOrder.status === 'in_progress' ? (
            <Button
              onClick={() => workOrder.id && onComplete(workOrder.id)}
              className="flex items-center gap-2 touch-manipulation h-12"
              variant="default"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Complete</span>
            </Button>
          ) : (
            <Button
              onClick={() => workOrder.id && onViewDetails(workOrder.id)}
              className="flex items-center gap-2 touch-manipulation h-12"
              variant="outline"
            >
              <User className="h-4 w-4" />
              <span className="text-sm">Details</span>
            </Button>
          )}

          <Button
            onClick={() => workOrder.id && onTakePhoto(workOrder.id)}
            className="flex items-center gap-2 touch-manipulation h-12"
            variant="outline"
          >
            <Camera className="h-4 w-4" />
            <span className="text-sm">Photo</span>
          </Button>
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700 dark:text-yellow-300">
              Working offline - changes will sync when connected
            </span>
          </div>
        )}

        {/* Sync Status */}
        {workOrder.syncStatus === 'pending_sync' && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300">
              Pending sync - will upload when connected
            </span>
          </div>
        )}

        {workOrder.syncStatus === 'conflict' && (
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-red-700 dark:text-red-300">
              Sync conflict - manual resolution required
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};