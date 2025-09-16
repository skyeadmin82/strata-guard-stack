import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { BIReportsManager } from './BIReportsManager';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Plus,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface Report {
  id: string;
  report_name?: string;
  name?: string;
  report_type: string;
  generation_status: string;
  created_at: string;
  period_start?: string;
  period_end?: string;
  file_format?: string;
  file_path?: string;
  status?: string;
  source?: string;
}

export const ReportsHub: React.FC = () => {
  const { toast } = useToast();
  const { 
    reports, 
    generateProfitLossReport, 
    generateCashFlowReport, 
    generateAgingReport,
    exportReport,
    isGenerating,
    generationProgress 
  } = useFinancialReports();

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [reportParams, setReportParams] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'month' as 'month' | 'quarter' | 'year',
    includeDetails: true
  });
  const [activeTab, setActiveTab] = useState('financial');

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      
      // Load financial reports
      const { data: financialReports, error: finError } = await supabase
        .from('financial_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // Load assessment reports
      const { data: assessmentReports, error: assError } = await supabase
        .from('assessment_reports_extended')
        .select('*')
        .order('created_at', { ascending: false });

      // Load BI reports
      const { data: biReports, error: biError } = await supabase
        .from('bi_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (finError) throw finError;
      if (assError) throw assError;
      if (biError) throw biError;

      // Combine all reports with proper typing
      const combined: Report[] = [
        ...(financialReports || []).map(r => ({ 
          ...r, 
          source: 'financial',
          name: r.report_name,
          generation_status: r.generation_status || 'completed'
        })),
        ...(assessmentReports || []).map(r => ({ 
          ...r, 
          source: 'assessment',
          report_name: r.report_name,
          generation_status: r.generation_status || 'completed'
        })),
        ...(biReports || []).map(r => ({ 
          ...r, 
          source: 'bi', 
          report_name: r.name,
          generation_status: r.status || 'active'
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAllReports(combined);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType) return;

    try {
      switch (selectedReportType) {
        case 'profit_loss':
          await generateProfitLossReport(reportParams);
          break;
        case 'cash_flow':
          await generateCashFlowReport(reportParams);
          break;
        case 'aging_report':
          await generateAgingReport(reportParams);
          break;
        default:
          throw new Error('Unknown report type');
      }

      setShowCreateDialog(false);
      await loadAllReports();
      
      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'profit_loss': return <TrendingUp className="h-4 w-4" />;
      case 'cash_flow': return <BarChart3 className="h-4 w-4" />;
      case 'aging_report': return <Clock className="h-4 w-4" />;
      case 'comprehensive': return <FileText className="h-4 w-4" />;
      default: return <PieChart className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'active': return 'default';
      case 'pending': case 'generating': return 'secondary';
      case 'failed': case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'pending': case 'generating': return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'failed': case 'error': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const reportTypeOptions = [
    { value: 'profit_loss', label: 'Profit & Loss Report', description: 'Revenue, expenses, and profitability analysis' },
    { value: 'cash_flow', label: 'Cash Flow Report', description: 'Cash inflows, outflows, and projections' },
    { value: 'aging_report', label: 'Aging Report', description: 'Outstanding invoices by age' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate, manage, and schedule business reports
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allReports.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allReports.filter(r => 
                new Date(r.created_at).getMonth() === new Date().getMonth()
              ).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allReports.filter(r => r.source === 'bi').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {allReports.filter(r => 
                ['failed', 'error'].includes(r.generation_status)
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="bi">BI Reports</TabsTrigger>
          <TabsTrigger value="all">All Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allReports.filter(r => r.source === 'financial').map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getReportIcon(report.report_type)}
                      <div>
                        <h3 className="font-medium">{report.report_name || report.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{format(new Date(report.created_at), 'MMM dd, yyyy')}</span>
                          {report.period_start && report.period_end && (
                            <span>• {report.period_start} to {report.period_end}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(report.generation_status)} className="flex items-center space-x-1">
                        {getStatusIcon(report.generation_status)}
                        <span>{report.generation_status}</span>
                      </Badge>
                      {report.generation_status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      )}
                      {report.file_path && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {allReports.filter(r => r.source === 'financial').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No financial reports generated yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      Generate Your First Report
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bi">
          <BIReportsManager onReportsUpdate={loadAllReports} />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getReportIcon(report.report_type)}
                      <div>
                        <h3 className="font-medium">{report.report_name || report.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {report.source}
                          </Badge>
                          <span>{format(new Date(report.created_at), 'MMM dd, yyyy')}</span>
                          {report.period_start && report.period_end && (
                            <span>• {report.period_start} to {report.period_end}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(report.generation_status)} className="flex items-center space-x-1">
                        {getStatusIcon(report.generation_status)}
                        <span>{report.generation_status}</span>
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={reportParams.startDate}
                  onChange={(e) => setReportParams({ ...reportParams, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={reportParams.endDate}
                  onChange={(e) => setReportParams({ ...reportParams, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="group-by">Group By</Label>
              <Select value={reportParams.groupBy} onValueChange={(value) => setReportParams({ ...reportParams, groupBy: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateReport} 
                disabled={!selectedReportType || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating... {generationProgress}%
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};