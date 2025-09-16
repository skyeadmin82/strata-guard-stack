import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock,
  FileText,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  User,
  Settings,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useEnhancedClientManagement } from '@/hooks/useEnhancedClientManagement';
import { formatDistanceToNow } from 'date-fns';

interface ClientActivity {
  id: string;
  activity_type: string;
  activity_title: string;
  activity_description: string;
  created_at: string;
  performed_by?: string;
}

interface ClientActivityTimelineProps {
  clientId: string;
}

const activityIcons = {
  'ticket': FileText,
  'call': Phone,
  'email': Mail,
  'meeting': User,
  'contract': CheckCircle,
  'assessment': Activity,
  'bulk_update': Settings,
  'health_calculation': Activity,
  'note': FileText,
  'default': Clock
};

const activityColors = {
  'ticket': 'bg-blue-500',
  'call': 'bg-green-500',
  'email': 'bg-purple-500',
  'meeting': 'bg-orange-500',
  'contract': 'bg-emerald-500',
  'assessment': 'bg-cyan-500',
  'bulk_update': 'bg-gray-500',
  'health_calculation': 'bg-pink-500',
  'note': 'bg-yellow-500',
  'default': 'bg-slate-500'
};

export const ClientActivityTimeline: React.FC<ClientActivityTimelineProps> = ({ clientId }) => {
  const { fetchClientActivity } = useEnhancedClientManagement();
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await fetchClientActivity(clientId);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadActivities();
    }
  }, [clientId]);

  const getActivityIcon = (activityType: string) => {
    return activityIcons[activityType as keyof typeof activityIcons] || activityIcons.default;
  };

  const getActivityColor = (activityType: string) => {
    return activityColors[activityType as keyof typeof activityColors] || activityColors.default;
  };

  if (activities.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            No recent activity found for this client
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              Recent client interactions and updates
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadActivities}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.activity_type);
                const colorClass = getActivityColor(activity.activity_type);
                
                return (
                  <div key={activity.id} className="relative flex items-start gap-4">
                    {/* Activity icon */}
                    <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${colorClass} text-white`}>
                      <ActivityIcon className="w-5 h-5" />
                    </div>
                    
                    {/* Activity content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">
                          {activity.activity_title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </Badge>
                      </div>
                      
                      {activity.activity_description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.activity_description}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {activity.activity_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(activity.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {loading && (
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 animate-pulse">
                    <div className="w-5 h-5 bg-gray-300 rounded" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};