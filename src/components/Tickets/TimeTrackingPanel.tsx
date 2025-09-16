import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeEntry {
  id: string;
  ticket_id: string;
  user_id: string;
  description: string;
  hours_worked: number;
  billable: boolean;
  start_time: string;
  end_time?: string;
  created_at: string;
  user?: { first_name: string; last_name: string };
}

interface TimeTrackingPanelProps {
  ticketId: string;
  ticketTitle: string;
  estimatedHours?: number;
  onHoursUpdate?: (totalHours: number) => void;
}

export const TimeTrackingPanel: React.FC<TimeTrackingPanelProps> = ({
  ticketId,
  ticketTitle,
  estimatedHours,
  onHoursUpdate
}) => {
  const { toast } = useToast();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    description: '',
    hours: '',
    billable: true
  });

  // Fetch time entries
  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_tracking_entries')
        .select(`
          *,
          user:user_id(first_name, last_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
      
      // Calculate total hours and notify parent
      const totalHours = (data || []).reduce((sum, entry) => sum + entry.hours_worked, 0);
      onHoursUpdate?.(totalHours);
      
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      });
    }
  };

  // Start time tracking
  const startTracking = () => {
    setIsTracking(true);
    setTrackingStartTime(new Date());
    setElapsedTime(0);
  };

  // Stop time tracking and create entry
  const stopTracking = async () => {
    if (!trackingStartTime) return;

    const endTime = new Date();
    const hoursWorked = (endTime.getTime() - trackingStartTime.getTime()) / (1000 * 60 * 60);

    try {
      setLoading(true);
      const { error } = await supabase
        .from('time_tracking_entries')
        .insert({
          ticket_id: ticketId,
          description: `Time tracking session - ${ticketTitle}`,
          hours_worked: Math.round(hoursWorked * 100) / 100, // Round to 2 decimal places
          billable: true,
          start_time: trackingStartTime.toISOString(),
          end_time: endTime.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Time Logged",
        description: `Logged ${Math.round(hoursWorked * 100) / 100} hours`,
      });

      // Reset tracking state
      setIsTracking(false);
      setTrackingStartTime(null);
      setElapsedTime(0);
      
      // Refresh entries
      await fetchTimeEntries();
      
    } catch (error) {
      console.error('Error logging time:', error);
      toast({
        title: "Error",
        description: "Failed to log time entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add manual time entry
  const addTimeEntry = async () => {
    if (!newEntry.description || !newEntry.hours) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('time_tracking_entries')
        .insert({
          ticket_id: ticketId,
          description: newEntry.description,
          hours_worked: parseFloat(newEntry.hours),
          billable: newEntry.billable,
          start_time: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Time Entry Added",
        description: `Added ${newEntry.hours} hours to ticket`,
      });

      // Reset form
      setNewEntry({
        description: '',
        hours: '',
        billable: true
      });
      setIsAddDialogOpen(false);
      
      // Refresh entries
      await fetchTimeEntries();
      
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete time entry
  const deleteTimeEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('time_tracking_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Time Entry Deleted",
        description: "Time entry has been removed",
      });

      await fetchTimeEntries();
      
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  // Update elapsed time for active tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && trackingStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - trackingStartTime.getTime()) / 1000;
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, trackingStartTime]);

  // Load time entries on mount
  useEffect(() => {
    fetchTimeEntries();
  }, [ticketId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours_worked, 0);
  const billableHours = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours_worked, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Timer */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-mono text-lg">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                {isTracking ? 'Currently tracking' : 'Timer stopped'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isTracking ? (
              <Button onClick={startTracking} variant="default" size="sm">
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" size="sm" disabled={loading}>
                <Square className="h-4 w-4 mr-1" />
                Stop & Log
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(totalHours * 100) / 100}h</div>
            <div className="text-sm text-muted-foreground">Total Logged</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(billableHours * 100) / 100}h</div>
            <div className="text-sm text-muted-foreground">Billable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {estimatedHours ? `${Math.round(((totalHours / estimatedHours) * 100))}%` : '-'}
            </div>
            <div className="text-sm text-muted-foreground">vs Estimate</div>
          </div>
        </div>

        <Separator />

        {/* Add Time Entry */}
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Time Entries ({timeEntries.length})</h4>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Time Entry</DialogTitle>
                <DialogDescription>
                  Manually add time spent on this ticket.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    className="col-span-3"
                    placeholder="What work was done?"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hours" className="text-right">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0"
                    value={newEntry.hours}
                    onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                    className="col-span-3"
                    placeholder="2.5"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Billable</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newEntry.billable}
                      onChange={(e) => setNewEntry({ ...newEntry, billable: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">This time is billable to the client</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addTimeEntry} disabled={loading}>
                  Add Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Time Entries List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={entry.billable ? 'default' : 'secondary'} className="text-xs">
                    {entry.billable ? 'Billable' : 'Non-billable'}
                  </Badge>
                  <span className="text-sm font-medium">
                    {entry.hours_worked}h
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.description}
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  {entry.user ? `${entry.user.first_name} ${entry.user.last_name}` : 'Unknown'} • {' '}
                  {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTimeEntry(entry.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {timeEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No time entries yet. Start tracking time or add an entry manually.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};