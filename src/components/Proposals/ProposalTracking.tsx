import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, MapPin, Globe, Clock, MousePointer, Download } from 'lucide-react';
import { format } from 'date-fns';

interface TrackingEvent {
  id: string;
  proposal_id: string;
  event_type: string;
  event_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  timezone?: string;
  created_at: string;
}

interface ProposalTrackingProps {
  proposalId: string;
  proposalTitle: string;
}

export const ProposalTracking: React.FC<ProposalTrackingProps> = ({
  proposalId,
  proposalTitle
}) => {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueViewers: 0,
    totalTimeSpent: 0,
    lastViewed: null as string | null,
    downloads: 0,
  });

  useEffect(() => {
    fetchTrackingData();
  }, [proposalId]);

  const fetchTrackingData = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_tracking')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const events = (data || []).map(event => ({
        ...event,
        event_data: typeof event.event_data === 'string' ? JSON.parse(event.event_data) : (event.event_data || {}),
        ip_address: event.ip_address as string,
      }));
      setTrackingEvents(events);
      calculateStats(events);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (events: TrackingEvent[]) => {
    const viewEvents = events.filter(e => e.event_type === 'view');
    const downloadEvents = events.filter(e => e.event_type === 'download');
    const uniqueIPs = new Set(events.map(e => e.ip_address).filter(Boolean));
    
    const totalTime = events
      .filter(e => e.event_data?.duration)
      .reduce((sum, e) => sum + (e.event_data.duration || 0), 0);

    setStats({
      totalViews: viewEvents.length,
      uniqueViewers: uniqueIPs.size,
      totalTimeSpent: totalTime,
      lastViewed: viewEvents.length > 0 ? viewEvents[0].created_at : null,
      downloads: downloadEvents.length,
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'view':
        return <Eye className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'click':
        return <MousePointer className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'view':
        return 'bg-blue-500';
      case 'download':
        return 'bg-green-500';
      case 'click':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Proposal Tracking</h3>
        <p className="text-sm text-muted-foreground">
          Track engagement and interactions for "{proposalTitle}"
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueViewers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats.totalTimeSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.downloads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Viewed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {stats.lastViewed ? 
                format(new Date(stats.lastViewed), 'MMM dd, HH:mm') : 
                'Never'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {trackingEvents.length > 0 ? (
            <div className="space-y-4">
              {trackingEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getEventColor(event.event_type)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(event.event_type)}
                        <span className="font-medium capitalize">
                          {event.event_type.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {event.ip_address && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Globe className="w-3 h-3 mr-1" />
                          IP: {event.ip_address}
                        </div>
                      )}
                      
                      {(event.city || event.country) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          {[event.city, event.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                      
                      {event.event_data?.duration && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          Duration: {formatDuration(event.event_data.duration)}
                        </div>
                      )}
                      
                      {event.event_data?.page && (
                        <div className="text-sm text-muted-foreground">
                          Page: {event.event_data.page}
                        </div>
                      )}
                      
                      {event.referrer && (
                        <div className="text-sm text-muted-foreground">
                          Referrer: {event.referrer}
                        </div>
                      )}
                      
                      {event.user_agent && (
                        <div className="text-xs text-muted-foreground truncate max-w-md">
                          {event.user_agent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tracking data yet</h3>
              <p className="text-muted-foreground">
                Tracking data will appear here once the proposal is viewed or interacted with
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      {trackingEvents.some(e => e.country || e.city) && (
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(
                trackingEvents
                  .filter(e => e.country || e.city)
                  .reduce((acc, event) => {
                    const location = [event.city, event.country].filter(Boolean).join(', ');
                    acc.set(location, (acc.get(location) || 0) + 1);
                    return acc;
                  }, new Map<string, number>())
              )
                .sort(([, a], [, b]) => b - a)
                .map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{location}</span>
                    </div>
                    <Badge variant="outline">{count} view{count !== 1 ? 's' : ''}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};