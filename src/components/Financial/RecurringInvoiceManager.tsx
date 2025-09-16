import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  DollarSign, 
  RotateCcw, 
  Pause, 
  Play, 
  X, 
  Building2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Settings,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RecurringSchedule {
  id: string;
  client_id: string;
  contract_id?: string;
  proposal_id?: string;
  invoice_title: string;
  description?: string;
  amount: number;
  currency: string;
  tax_rate?: number;
  frequency: string;
  start_date: string;
  end_date?: string;
  next_billing_date: string;
  last_billed_date?: string;
  status: string;
  auto_send: boolean;
  payment_terms_days: number;
  total_invoices_generated: number;
  total_revenue_generated: number;
  send_reminders: boolean;
  reminder_days_before: any; // JSONB array from database
  created_at: string;
  updated_at: string;
  clients?: { name: string };
  contracts?: { title: string };
  proposals?: { title: string };
}

interface Client {
  id: string;
  name: string;
  email?: string;
}

export const RecurringInvoiceManager: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<RecurringSchedule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('schedules');

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_title: '',
    description: '',
    amount: '',
    currency: 'USD',
    tax_rate: '0',
    frequency: 'monthly' as const,
    start_date: new Date(),
    end_date: undefined as Date | undefined,
    payment_terms_days: '30',
    auto_send: true,
    send_reminders: true,
    reminder_days_before: [7, 3, 1]
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recurring_invoice_schedules')
        .select(`
          *,
          clients(name),
          contracts(title),
          proposals(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules((data as any) || []);
    } catch (error) {
      console.error('Error fetching recurring schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recurring invoice schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchClients();
  }, []);

  const handleCreateSchedule = async () => {
    try {
      if (!formData.client_id || !formData.invoice_title || !formData.amount) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid amount',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('recurring_invoice_schedules')
        .insert({
          tenant_id: profile?.tenant_id,
          client_id: formData.client_id,
          invoice_title: formData.invoice_title,
          description: formData.description || null,
          amount: amount,
          currency: formData.currency,
          tax_rate: parseFloat(formData.tax_rate) || 0,
          frequency: formData.frequency,
          start_date: format(formData.start_date, 'yyyy-MM-dd'),
          end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
          next_billing_date: format(formData.start_date, 'yyyy-MM-dd'),
          payment_terms_days: parseInt(formData.payment_terms_days) || 30,
          auto_send: formData.auto_send,
          send_reminders: formData.send_reminders,
          reminder_days_before: formData.reminder_days_before,
          created_by: profile?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recurring invoice schedule created successfully',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Error creating recurring schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create recurring invoice schedule',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateScheduleStatus = async (scheduleId: string, status: 'active' | 'paused' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('recurring_invoice_schedules')
        .update({ status })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Schedule ${status} successfully`,
      });

      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      invoice_title: '',
      description: '',
      amount: '',
      currency: 'USD',
      tax_rate: '0',
      frequency: 'monthly',
      start_date: new Date(),
      end_date: undefined,
      payment_terms_days: '30',
      auto_send: true,
      send_reminders: true,
      reminder_days_before: [7, 3, 1]
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi_weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'semi_annually': return 'Semi-annually';
      case 'annually': return 'Annually';
      default: return 'Monthly';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // Calculate metrics
  const activeSchedules = schedules.filter(s => s.status === 'active').length;
  const totalMonthlyRevenue = schedules
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      // Convert to monthly for comparison
      let monthlyAmount = s.amount;
      switch (s.frequency) {
        case 'weekly': monthlyAmount = s.amount * 4.33; break;
        case 'bi_weekly': monthlyAmount = s.amount * 2.17; break;
        case 'quarterly': monthlyAmount = s.amount / 3; break;
        case 'semi_annually': monthlyAmount = s.amount / 6; break;
        case 'annually': monthlyAmount = s.amount / 12; break;
      }
      return sum + monthlyAmount;
    }, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recurring Invoices</h2>
          <p className="text-muted-foreground">
            Manage automated billing schedules and recurring revenue
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Recurring Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSchedules}</div>
            <p className="text-xs text-muted-foreground">
              {schedules.length} total schedules
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMonthlyRevenue, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly recurring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.reduce((sum, s) => sum + s.total_invoices_generated, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(schedules.reduce((sum, s) => sum + s.total_revenue_generated, 0), 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              From recurring invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedules">Active Schedules</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Invoice Schedules</CardTitle>
              <CardDescription>
                Manage your automated billing schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title & Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{schedule.invoice_title}</div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Building2 className="h-3 w-3 mr-1" />
                                {schedule.clients?.name || 'Unknown Client'}
                              </div>
                              {schedule.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {schedule.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(schedule.amount, schedule.currency)}
                            </div>
                            {schedule.tax_rate > 0 && (
                              <div className="text-sm text-muted-foreground">
                                +{schedule.tax_rate}% tax
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getFrequencyLabel(schedule.frequency)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                              {format(new Date(schedule.next_billing_date), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(schedule.status)}>
                              {schedule.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(schedule.total_revenue_generated, schedule.currency)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {schedule.total_invoices_generated} invoices
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {schedule.status === 'active' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateScheduleStatus(schedule.id, 'paused')}
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateScheduleStatus(schedule.id, 'active')}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateScheduleStatus(schedule.id, 'cancelled')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recurring schedules found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first recurring invoice schedule to start automating your billing
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View generated invoices and billing events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Billing history will appear here when invoices are generated
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Recurring Invoice Schedule</DialogTitle>
            <DialogDescription>
              Set up automated billing for your client services
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
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
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Invoice Title *</Label>
                <Input
                  id="title"
                  value={formData.invoice_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_title: e.target.value }))}
                  placeholder="Monthly IT Support Services"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of services..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Billing Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Billing Details</h4>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annually">Semi-annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.payment_terms_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_terms_days: e.target.value }))}
                    placeholder="30"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Automation Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Automation Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto_send">Auto-send invoices</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send invoices when generated
                    </p>
                  </div>
                  <Switch
                    id="auto_send"
                    checked={formData.auto_send}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_send: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send_reminders">Send payment reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automatic payment reminders before due date
                    </p>
                  </div>
                  <Switch
                    id="send_reminders"
                    checked={formData.send_reminders}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_reminders: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};