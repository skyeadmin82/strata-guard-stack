import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAssessmentReporting } from '@/hooks/useAssessmentReporting';
import { AssessmentRiskMatrix } from '@/components/Assessments/AssessmentRiskMatrix';
import { AssessmentSchedulingDialog } from '@/components/Assessments/AssessmentSchedulingDialog';
import { AssessmentComparison } from '@/components/Assessments/AssessmentComparison';
import { ActionItemsManager } from '@/components/Assessments/ActionItemsManager';
import { AssessmentDetailDialog } from '@/components/Assessments/AssessmentDetailDialog';
import { AssessmentCreateDialog } from '@/components/Assessments/AssessmentCreateDialog';
import { AssessmentTemplateBuilder } from '@/components/Assessments/AssessmentTemplateBuilder';
import { AssessmentAnalytics } from '@/components/Assessments/AssessmentAnalytics';
import { Assessment } from '@/types/database';
import { 
  Search, 
  Plus, 
  ClipboardCheck, 
  TrendingUp, 
  Award, 
  Building2, 
  Calendar,
  FileText,
  BarChart3,
  Lightbulb,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

interface AssessmentWithRelations extends Assessment {
  clients?: { name: string } | null;
  assessment_templates?: { name: string; category?: string } | null;
}

export const AssessmentsPage = () => {
  const [assessments, setAssessments] = useState<AssessmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSchedulingDialog, setShowSchedulingDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithRelations | null>(null);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [templates, setTemplates] = useState<Array<{id: string, name: string, category?: string}>>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateReport, exportReport, isGenerating, isExporting } = useAssessmentReporting();

  const fetchAssessments = async () => {
    try {
      // Fetch data separately since there are no FK constraints
      const [assessmentsResult, clientsResult, templatesResult] = await Promise.all([
        supabase.from('assessments').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name'),
        supabase.from('assessment_templates').select('id, name, category')
      ]);

      if (assessmentsResult.error) throw assessmentsResult.error;
      if (clientsResult.error) throw clientsResult.error;
      if (templatesResult.error) throw templatesResult.error;

      // Manually join the data and properly map to Assessment interface
      const assessmentsWithRelations = assessmentsResult.data?.map(assessment => {
        const client = clientsResult.data?.find(client => client.id === assessment.client_id);
        const template = templatesResult.data?.find(template => template.id === assessment.template_id);
        
        // Create the joined assessment with proper typing
        const joinedAssessment = {
          ...assessment,
          clients: client || null,
          assessment_templates: template || null,
          // Properly map database fields to interface
          assessed_by: assessment.assessor_id || assessment.created_by || 'System',
          assessment_type: 'general' as const,
          title: template?.name ? 
            `${template.name} - ${client?.name || 'Client'}` : 
            `Assessment for ${client?.name || 'Client'}`,
          description: template?.category ? 
            `${template.category} assessment completed on ${format(new Date(assessment.completed_at || assessment.created_at), 'MMM dd, yyyy')}` :
            `Assessment completed on ${format(new Date(assessment.completed_at || assessment.created_at), 'MMM dd, yyyy')}`,
          overall_score: assessment.total_score || 0,
          findings: [], // TODO: Load from assessment_responses
          recommendations: [] // TODO: Load from assessment_opportunities
        } as AssessmentWithRelations;
        
        return joinedAssessment;
      }) || [];

      setAssessments(assessmentsWithRelations as AssessmentWithRelations[]);
      setClients(clientsResult.data || []);
      setTemplates(templatesResult.data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = 
      assessment.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.assessment_templates?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'draft': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageScore = assessments.length > 0 
    ? assessments.reduce((sum, assessment) => sum + (assessment.percentage_score || 0), 0) / assessments.length
    : 0;

  const handleGeneratePDFReport = async (assessmentId: string) => {
    const result = await generateReport(assessmentId);
    if (result.success && result.reportId) {
      const exportResult = await exportReport(result.reportId, 'pdf');
      if (exportResult.success && exportResult.data) {
        const url = URL.createObjectURL(exportResult.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportResult.filename || 'assessment-report.pdf';
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleExportComparison = (comparisonData: any) => {
    const dataStr = JSON.stringify(comparisonData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading assessments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assessments</h1>
            <p className="text-muted-foreground">Monitor client assessments and scores</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplateBuilder(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
            <Button variant="outline" onClick={() => setShowSchedulingDialog(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessments.filter(a => a.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageScore.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessments.filter(a => a.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Assessment Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risk-matrix">Risk Matrix</TabsTrigger>
            <TabsTrigger value="comparison">Compare</TabsTrigger>
            <TabsTrigger value="action-items">Action Items</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{/* Original table content will go here */}

            <Card>
              <CardHeader>
                <CardTitle>Client Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search assessments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assessments Table */}
                {filteredAssessments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Assessment Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssessments.map((assessment) => (
                           <TableRow 
                            key={assessment.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              setShowDetailDialog(true);
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                                {assessment.clients?.name || 'Unknown Client'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {assessment.assessment_templates?.name || 'Unknown Template'}
                                </div>
                                {assessment.assessment_templates?.category && (
                                  <div className="text-sm text-muted-foreground">
                                    {assessment.assessment_templates.category}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(assessment.status)}>
                                {assessment.status?.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assessment.status === 'completed' ? (
                                <div className="flex items-center space-x-2">
                                  <span className={`font-medium ${getScoreColor(assessment.percentage_score || 0)}`}>
                                    {assessment.percentage_score || 0}%
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    ({assessment.total_score}/{assessment.max_possible_score})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {assessment.status === 'completed' ? (
                                <Progress value={100} className="w-20" />
                              ) : assessment.status === 'in_progress' ? (
                                <Progress value={50} className="w-20" />
                              ) : (
                                <Progress value={0} className="w-20" />
                              )}
                            </TableCell>
                            <TableCell>
                              {assessment.started_at ? 
                                format(new Date(assessment.started_at), 'MMM dd, yyyy') : '-'
                              }
                            </TableCell>
                            <TableCell>
                              {assessment.completed_at ? 
                                format(new Date(assessment.completed_at), 'MMM dd, yyyy') : '-'
                              }
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/assessments/${assessment.id}/execute`)}
                className="mr-2"
              >
                {assessment.status === 'completed' ? 'Review' : 'Continue'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGeneratePDFReport(assessment.id)}
                disabled={isGenerating || isExporting}
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No assessments found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No assessments match your current filters'
                        : 'Get started by creating your first assessment'
                      }
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk-matrix">
            <AssessmentRiskMatrix
              assessments={filteredAssessments}
              onAssessmentClick={(assessment) => {
                const fullAssessment = filteredAssessments.find(a => a.id === assessment.id);
                if (fullAssessment) {
                  setSelectedAssessment(fullAssessment);
                  setShowDetailDialog(true);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="comparison">
            <AssessmentComparison
              assessments={filteredAssessments}
              onExportComparison={handleExportComparison}
            />
          </TabsContent>

          <TabsContent value="action-items">
            <ActionItemsManager
              assessments={filteredAssessments}
              onActionItemUpdate={(actionItems) => {
                console.log('Action items updated:', actionItems.length);
              }}
            />
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <AssessmentAnalytics />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Builder Dialog */}
        <AssessmentTemplateBuilder
          open={showTemplateBuilder}
          onOpenChange={setShowTemplateBuilder}
          onSaved={() => {
            fetchAssessments();
            toast({
              title: "Template Created",
              description: "Assessment template has been created successfully.",
            });
          }}
        />

        {/* Create Assessment Dialog */}
        <AssessmentCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          clients={clients}
          templates={templates}
          onAssessmentCreated={() => {
            fetchAssessments();
            toast({
              title: "Assessment Created",
              description: "New assessment has been created successfully.",
            });
          }}
        />

        {/* Scheduling Dialog */}
        <AssessmentSchedulingDialog
          open={showSchedulingDialog}
          onOpenChange={setShowSchedulingDialog}
          clients={clients}
          templates={templates}
          onScheduled={() => {
            toast({
              title: "Assessment Scheduled",
              description: "Assessment has been scheduled successfully.",
            });
          }}
        />

        {/* Assessment Detail Dialog */}
        <AssessmentDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          assessment={selectedAssessment}
          clientName={selectedAssessment?.clients?.name}
          templateName={selectedAssessment?.assessment_templates?.name}
          onExportReport={handleGeneratePDFReport}
        />
      </div>
    </DashboardLayout>
  );
};