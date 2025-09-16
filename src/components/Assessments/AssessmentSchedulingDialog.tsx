import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, User, Repeat, AlertCircle } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssessmentSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string; category?: string }>;
  onScheduled?: () => void;
}

interface ScheduledAssessment {
  id: string;
  clientId: string;
  templateId: string;
  scheduledDate: Date;
  assignedTo?: string;
  notes?: string;
  frequency?: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  status: 'scheduled' | 'overdue' | 'completed' | 'cancelled';
}

export const AssessmentSchedulingDialog: React.FC<AssessmentSchedulingDialogProps> = ({
  open,
  onOpenChange,
  clients,
  templates,
  onScheduled
}) => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('once');
  const [isScheduling, setIsScheduling] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [upcomingAssessments, setUpcomingAssessments] = useState<ScheduledAssessment[]>([]);

  const { toast } = useToast();

  const generateRecurringDates = (startDate: Date, frequency: string, count: number = 4): Date[] => {
    const dates: Date[] = [startDate];
    
    for (let i = 1; i < count; i++) {
      let nextDate: Date;
      switch (frequency) {
        case 'weekly':
          nextDate = addWeeks(startDate, i);
          break;
        case 'monthly':
          nextDate = addMonths(startDate, i);
          break;
        case 'quarterly':
          nextDate = addMonths(startDate, i * 3);
          break;
        case 'annually':
          nextDate = addMonths(startDate, i * 12);
          break;
        default:
          return dates;
      }
      dates.push(nextDate);
    }
    
    return dates;
  };

  const handleSchedule = async () => {
    if (!selectedClient || !selectedTemplate || !scheduledDate) {
      toast({
        title: "Missing Information",
        description: "Please select client, template, and date.",
        variant: "destructive",
      });
      return;
    }

    setIsScheduling(true);

    try {
      // Get current user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Generate dates for recurring assessments
      const dates = frequency === 'once' 
        ? [scheduledDate] 
        : generateRecurringDates(scheduledDate, frequency);

      // Create scheduled assessments for each date
      const scheduledAssessments = dates.map(date => ({
        tenant_id: profile.tenant_id,
        client_id: selectedClient,
        template_id: selectedTemplate,
        scheduled_date: date.toISOString(),
        assigned_to: assignedTo || null,
        notes: notes || null,
        frequency: frequency === 'once' ? null : frequency,
        status: 'scheduled',
        notification_sent: false,
        reminder_days_before: 3
      }));

      // Insert into database
      const { error: insertError } = await supabase
        .from('scheduled_assessments')
        .insert(scheduledAssessments);

      if (insertError) throw insertError;

      toast({
        title: "Assessment Scheduled",
        description: `${dates.length} assessment${dates.length > 1 ? 's' : ''} scheduled successfully.`,
      });

      // Reset form
      setSelectedClient('');
      setSelectedTemplate('');
      setScheduledDate(undefined);
      setAssignedTo('');
      setNotes('');
      setFrequency('once');

      onScheduled?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Scheduling failed:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const loadUpcomingAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_assessments')
        .select(`
          *,
          clients:client_id(name),
          assessment_templates:template_id(name)
        `)
        .order('scheduled_date', { ascending: true })
        .limit(10);

      if (error) throw error;

      const upcomingItems: ScheduledAssessment[] = data?.map((item: any) => ({
        id: item.id,
        clientId: item.client_id,
        templateId: item.template_id,
        scheduledDate: new Date(item.scheduled_date),
        status: item.status as ScheduledAssessment['status'],
        frequency: item.frequency as ScheduledAssessment['frequency']
      })) || [];
      
      setUpcomingAssessments(upcomingItems);
      setShowUpcoming(true);
    } catch (error) {
      console.error('Failed to load upcoming assessments:', error);
      // Fallback to empty array
      setUpcomingAssessments([]);
      setShowUpcoming(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'overdue': return 'destructive';
      case 'completed': return 'outline';
      case 'cancelled': return 'secondary';
      default: return 'default';
    }
  };

  const selectedClientName = clients.find(c => c.id === selectedClient)?.name;
  const selectedTemplateName = templates.find(t => t.id === selectedTemplate)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Assessment</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheduling Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Assessment Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.category && (
                          <div className="text-sm text-muted-foreground">{template.category}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">One-time</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
              <Input
                id="assignedTo"
                placeholder="Email or name"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview */}
            {selectedClient && selectedTemplate && scheduledDate && (
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Schedule Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{selectedClientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{selectedTemplateName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{format(scheduledDate, "PPP")}</span>
                  </div>
                  {frequency !== 'once' && (
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4" />
                      <span>Repeats {frequency}</span>
                    </div>
                  )}
                  {frequency !== 'once' && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Next dates:</p>
                      {generateRecurringDates(scheduledDate, frequency, 4).slice(1, 4).map((date, index) => (
                        <p key={index}>• {format(date, "PPP")}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming Assessments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Upcoming Assessments</h3>
              <Button variant="outline" size="sm" onClick={loadUpcomingAssessments}>
                <Clock className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
            
            {showUpcoming && upcomingAssessments.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingAssessments.map((assessment) => {
                  const client = clients.find(c => c.id === assessment.clientId);
                  const template = templates.find(t => t.id === assessment.templateId);
                  
                  return (
                    <Card key={assessment.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{client?.name}</div>
                          <div className="text-sm text-muted-foreground">{template?.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="w-3 h-3" />
                            {format(assessment.scheduledDate, "MMM dd, yyyy")}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(assessment.status)} className="text-xs">
                          {assessment.status}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : showUpcoming ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p>No upcoming assessments</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Click "View All" to see upcoming assessments</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={!selectedClient || !selectedTemplate || !scheduledDate || isScheduling}
          >
            {isScheduling ? 'Scheduling...' : 'Schedule Assessment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};