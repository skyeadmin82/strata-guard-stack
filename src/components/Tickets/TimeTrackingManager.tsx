import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Timer,
  DollarSign,
  Calendar
} from 'lucide-react';

interface TimeEntry {
  id: string;
  description: string | null;
  hours_worked: number;
  billable: boolean;
  work_type: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  user_id: string | null;
  users?: { first_name: string; last_name: string } | null;
}

interface TimeTrackingManagerProps {
  ticketId: string;
  onTimeUpdate?: (totalHours: number) => void;
}

export const TimeTrackingManager: React.FC<TimeTrackingManagerProps> = ({
  ticketId,
  onTimeUpdate
}) => {
  const { toast } = useToast();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState(0);
  const [billableHours, setBillableHours] = useState(0);

  const [newEntry, setNewEntry] = useState({
    description: '',
    hours_worked: '',
    billable: true,
    work_type: 'support',
    started_at: '',
    ended_at: ''
  });

  const [editEntry, setEditEntry] = useState({
    description: '',
    hours_worked: '',
    billable: true,
    work_type: 'support',
    started_at: '',
    ended_at: ''
  });

  // Fetch time entries
  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_tracking_entries')
        .select(`
          *,
          users:user_id(first_name, last_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTimeEntries(data || []);
      
      // Calculate totals
      const total = (data || []).reduce((sum, entry) => sum + Number(entry.hours_worked), 0);
      const billable = (data || []).filter(entry => entry.billable).reduce((sum, entry) => sum + Number(entry.hours_worked), 0);
      
      setTotalHours(total);
      setBillableHours(billable);
      
      if (onTimeUpdate) {
        onTimeUpdate(total);
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [ticketId]);

  // Add new time entry
  const handleAddEntry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current user's tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) throw new Error('Failed to get user tenant');

      const hours = parseFloat(newEntry.hours_worked);
      if (isNaN(hours) || hours <= 0) {
        toast({
          title: "Error",
          description: "Please enter valid hours",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('time_tracking_entries')
        .insert({
          tenant_id: userData.tenant_id,
          ticket_id: ticketId,
          user_id: user.id,
          description: newEntry.description || null,
          hours_worked: hours,
          billable: newEntry.billable,
          work_type: newEntry.work_type,
          started_at: newEntry.started_at || null,
          ended_at: newEntry.ended_at || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry added successfully",
      });

      setNewEntry({
        description: '',
        hours_worked: '',
        billable: true,
        work_type: 'support',
        started_at: '',
        ended_at: ''
      });
      setIsAddingEntry(false);
      fetchTimeEntries();
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    }
  };

  // Update time entry
  const handleUpdateEntry = async (entryId: string) => {
    try {
      const hours = parseFloat(editEntry.hours_worked);
      if (isNaN(hours) || hours <= 0) {
        toast({
          title: "Error",
          description: "Please enter valid hours",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('time_tracking_entries')
        .update({
          description: editEntry.description || null,
          hours_worked: hours,
          billable: editEntry.billable,
          work_type: editEntry.work_type,
          started_at: editEntry.started_at || null,
          ended_at: editEntry.ended_at || null
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });

      setEditingEntryId(null);
      fetchTimeEntries();
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    }
  };

  // Delete time entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      const { error } = await supabase
        .from('time_tracking_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });

      fetchTimeEntries();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  // Start editing
  const startEdit = (entry: TimeEntry) => {
    setEditEntry({
      description: entry.description || '',
      hours_worked: entry.hours_worked.toString(),
      billable: entry.billable,
      work_type: entry.work_type,
      started_at: entry.started_at ? new Date(entry.started_at).toISOString().slice(0, 16) : '',
      ended_at: entry.ended_at ? new Date(entry.ended_at).toISOString().slice(0, 16) : ''
    });
    setEditingEntryId(entry.id);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Time Tracking
            </CardTitle>
            <CardDescription>Track billable and non-billable hours</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddingEntry(!isAddingEntry)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time
          </Button>
        </div>
        
        {/* Time Summary */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="font-semibold">{totalHours.toFixed(2)}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Billable Hours</p>
              <p className="font-semibold text-green-600">{billableHours.toFixed(2)}h</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add New Entry Form */}
        {isAddingEntry && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Time Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours">Hours Worked *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0"
                    value={newEntry.hours_worked}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, hours_worked: e.target.value }))}
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <Label htmlFor="work_type">Work Type</Label>
                  <Select value={newEntry.work_type} onValueChange={(value) => setNewEntry(prev => ({ ...prev, work_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="project">Project Work</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the work performed..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="started_at">Start Time</Label>
                  <Input
                    id="started_at"
                    type="datetime-local"
                    value={newEntry.started_at}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, started_at: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ended_at">End Time</Label>
                  <Input
                    id="ended_at"
                    type="datetime-local"
                    value={newEntry.ended_at}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, ended_at: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="billable"
                  checked={newEntry.billable}
                  onCheckedChange={(checked) => setNewEntry(prev => ({ ...prev, billable: checked }))}
                />
                <Label htmlFor="billable">Billable</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddEntry} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Entry
                </Button>
                <Button variant="outline" onClick={() => setIsAddingEntry(false)} size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Entries List */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading time entries...</p>
          ) : timeEntries.length === 0 ? (
            <p className="text-center text-muted-foreground">No time entries recorded yet.</p>
          ) : (
            timeEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4">
                  {editingEntryId === entry.id ? (
                    // Edit form
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Hours Worked *</Label>
                          <Input
                            type="number"
                            step="0.25"
                            min="0"
                            value={editEntry.hours_worked}
                            onChange={(e) => setEditEntry(prev => ({ ...prev, hours_worked: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Work Type</Label>
                          <Select value={editEntry.work_type} onValueChange={(value) => setEditEntry(prev => ({ ...prev, work_type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="project">Project Work</SelectItem>
                              <SelectItem value="consultation">Consultation</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editEntry.description}
                          onChange={(e) => setEditEntry(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="datetime-local"
                            value={editEntry.started_at}
                            onChange={(e) => setEditEntry(prev => ({ ...prev, started_at: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="datetime-local"
                            value={editEntry.ended_at}
                            onChange={(e) => setEditEntry(prev => ({ ...prev, ended_at: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editEntry.billable}
                          onCheckedChange={(checked) => setEditEntry(prev => ({ ...prev, billable: checked }))}
                        />
                        <Label>Billable</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateEntry(entry.id)} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingEntryId(null)} size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display view
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={entry.billable ? "default" : "secondary"}>
                              {entry.billable ? "Billable" : "Non-billable"}
                            </Badge>
                            <Badge variant="outline">{entry.work_type}</Badge>
                            <span className="font-semibold">{Number(entry.hours_worked).toFixed(2)}h</span>
                          </div>
                          
                          {entry.description && (
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          )}
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            {(entry.started_at || entry.ended_at) && (
                              <div className="flex items-center gap-4">
                                {entry.started_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Start: {formatDateTime(entry.started_at)}
                                  </div>
                                )}
                                {entry.ended_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    End: {formatDateTime(entry.ended_at)}
                                  </div>
                                )}
                              </div>
                            )}
                            <p>
                              Added {new Date(entry.created_at).toLocaleDateString()}
                              {entry.users && ` by ${entry.users.first_name} ${entry.users.last_name}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(entry)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};