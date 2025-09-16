import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Calendar,
  Database,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface BIReport {
  id: string;
  name: string;
  description?: string;
  report_type: string;
  status: string;
  data_sources: any;
  query_definition: any;
  chart_config?: any;
  filters?: any;
  schedule_config?: any;
  is_public: boolean;
  last_generated_at?: string;
  created_at: string;
  error_count: number;
  last_error?: string;
}

interface BIReportsManagerProps {
  onReportsUpdate: () => void;
}

export const BIReportsManager: React.FC<BIReportsManagerProps> = ({ onReportsUpdate }) => {
  const { toast } = useToast();
  const [reports, setReports] = useState<BIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<BIReport | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_type: 'dashboard',
    data_sources: ['clients', 'invoices', 'payments'],
    query_definition: {
      tables: ['clients'],
      metrics: ['count'],
      dimensions: ['status'],
      filters: []
    },
    chart_config: {
      type: 'bar',
      title: '',
      xAxis: 'status',
      yAxis: 'count'
    },
    schedule_config: {
      enabled: false,
      frequency: 'daily',
      time: '09:00',
      timezone: 'UTC'
    },
    is_public: false
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bi_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading BI reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load BI reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', currentUser.user?.id)
        .single();

      const { error } = await supabase
        .from('bi_reports')
        .insert({
          tenant_id: userProfile?.tenant_id,
          name: formData.name,
          description: formData.description,
          report_type: formData.report_type,
          data_sources: formData.data_sources,
          query_definition: formData.query_definition,
          chart_config: formData.chart_config,
          schedule_config: formData.schedule_config,
          is_public: formData.is_public,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'BI report created successfully',
      });

      setShowCreateDialog(false);
      resetForm();
      await loadReports();
      onReportsUpdate();
    } catch (error) {
      console.error('Error creating BI report:', error);
      toast({
        title: 'Error',
        description: 'Failed to create BI report',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateReport = async () => {
    if (!editingReport) return;

    try {
      const { error } = await supabase
        .from('bi_reports')
        .update({
          name: formData.name,
          description: formData.description,
          report_type: formData.report_type,
          data_sources: formData.data_sources,
          query_definition: formData.query_definition,
          chart_config: formData.chart_config,
          schedule_config: formData.schedule_config,
          is_public: formData.is_public
        })
        .eq('id', editingReport.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'BI report updated successfully',
      });

      setEditingReport(null);
      resetForm();
      await loadReports();
      onReportsUpdate();
    } catch (error) {
      console.error('Error updating BI report:', error);
      toast({
        title: 'Error',
        description: 'Failed to update BI report',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('bi_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'BI report deleted successfully',
      });

      await loadReports();
      onReportsUpdate();
    } catch (error) {
      console.error('Error deleting BI report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete BI report',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (reportId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('bi_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Report ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      await loadReports();
    } catch (error) {
      console.error('Error toggling report status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update report status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      report_type: 'dashboard',
      data_sources: ['clients', 'invoices', 'payments'],
      query_definition: {
        tables: ['clients'],
        metrics: ['count'],
        dimensions: ['status'],
        filters: []
      },
      chart_config: {
        type: 'bar',
        title: '',
        xAxis: 'status',
        yAxis: 'count'
      },
      schedule_config: {
        enabled: false,
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC'
      },
      is_public: false
    });
  };

  const startEdit = (report: BIReport) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      description: report.description || '',
      report_type: report.report_type,
      data_sources: report.data_sources || [],
      query_definition: report.query_definition || {},
      chart_config: report.chart_config || {},
      schedule_config: report.schedule_config || {},
      is_public: report.is_public
    });
    setShowCreateDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'error': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Intelligence Reports</h2>
          <p className="text-muted-foreground">
            Create automated reports with custom queries and scheduling
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create BI Report
        </Button>
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    {report.description && (
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(report.status)} className="flex items-center space-x-1">
                    {getStatusIcon(report.status)}
                    <span>{report.status}</span>
                  </Badge>
                  {report.is_public && (
                    <Badge variant="outline">Public</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Database className="h-4 w-4" />
                      <span>{Array.isArray(report.data_sources) ? report.data_sources.length : 0} data sources</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {report.schedule_config?.enabled ? 
                          `${report.schedule_config.frequency} at ${report.schedule_config.time}` :
                          'Manual only'
                        }
                      </span>
                    </span>
                    {report.last_generated_at && (
                      <span className="text-muted-foreground">
                        Last run: {format(new Date(report.last_generated_at), 'MMM dd, HH:mm')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(report.id, report.status)}
                    >
                      {report.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(report)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {report.error_count > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Errors: {report.error_count}</span>
                      {report.last_error && (
                        <span className="text-red-600">- {report.last_error}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No BI Reports Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automated business intelligence report
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First BI Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={() => {
        setShowCreateDialog(false);
        setEditingReport(null);
        resetForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Edit BI Report' : 'Create BI Report'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <Label htmlFor="type">Report Type</Label>
                <Select value={formData.report_type} onValueChange={(value) => setFormData({ ...formData, report_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="kpi">KPI Report</SelectItem>
                    <SelectItem value="trend">Trend Analysis</SelectItem>
                    <SelectItem value="summary">Summary Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this report shows"
                rows={2}
              />
            </div>

            <div>
              <Label>Data Sources</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['clients', 'invoices', 'payments', 'contracts', 'tickets', 'assessments'].map((source) => (
                  <label key={source} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.data_sources.includes(source)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            data_sources: [...formData.data_sources, source]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            data_sources: formData.data_sources.filter(s => s !== source)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{source}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chart-type">Chart Type</Label>
                <Select 
                  value={formData.chart_config.type} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    chart_config: { ...formData.chart_config, type: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="table">Data Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="schedule-frequency">Schedule</Label>
                <Select 
                  value={formData.schedule_config.frequency} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    schedule_config: { ...formData.schedule_config, frequency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
              <Label htmlFor="public">Make this report publicly accessible</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setEditingReport(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingReport ? handleUpdateReport : handleCreateReport}>
                {editingReport ? 'Update Report' : 'Create Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};