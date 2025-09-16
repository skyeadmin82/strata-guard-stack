import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, ClipboardCheck, TrendingUp, Award, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Assessment {
  id: string;
  status: string;
  total_score?: number;
  max_possible_score?: number;
  percentage_score?: number;
  started_at?: string;
  completed_at?: string;
  client_id: string;
  template_id: string;
  clients?: { name: string } | null;
  assessment_templates?: { name: string; category?: string } | null;
  created_at: string;
}

export const AssessmentsPage = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

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

      // Manually join the data
      const assessmentsWithRelations = assessmentsResult.data?.map(assessment => ({
        ...assessment,
        clients: clientsResult.data?.find(client => client.id === assessment.client_id) || null,
        assessment_templates: templatesResult.data?.find(template => template.id === assessment.template_id) || null
      })) || [];

      setAssessments(assessmentsWithRelations as unknown as Assessment[]);
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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
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

        {/* Filters */}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment) => (
                      <TableRow 
                        key={assessment.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          // Primary action: View assessment details
                          console.log('View assessment:', assessment.id);
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
      </div>
    </DashboardLayout>
  );
};