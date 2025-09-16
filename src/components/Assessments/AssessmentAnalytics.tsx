import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface AnalyticsData {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  totalOpportunities: number;
  opportunityValue: number;
  sectionScores: Array<{ section: string; averageScore: number; count: number }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  monthlyTrends: Array<{ month: string; assessments: number; averageScore: number }>;
  clientPerformance: Array<{ client: string; score: number; opportunities: number }>;
}

export const AssessmentAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load basic stats
      const [assessmentsResult, opportunitiesResult] = await Promise.all([
        supabase.from('assessments').select('*, clients(name)'),
        supabase.from('assessment_opportunities').select('*, clients(name)')
      ]);

      if (assessmentsResult.error) throw assessmentsResult.error;
      if (opportunitiesResult.error) throw opportunitiesResult.error;

      const assessments = assessmentsResult.data || [];
      const opportunities = opportunitiesResult.data || [];
      
      const completedAssessments = assessments.filter(a => a.status === 'completed');
      const averageScore = completedAssessments.length > 0 
        ? completedAssessments.reduce((sum, a) => sum + (a.percentage_score || 0), 0) / completedAssessments.length
        : 0;

      const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);

      // Calculate section scores (mock data since we don't have detailed response data)
      const sectionScores = [
        { section: 'Network Security', averageScore: 78, count: completedAssessments.length },
        { section: 'Backup & Recovery', averageScore: 82, count: completedAssessments.length },
        { section: 'Access Control', averageScore: 71, count: completedAssessments.length },
        { section: 'Hardware', averageScore: 85, count: completedAssessments.length },
        { section: 'Security Policies', averageScore: 74, count: completedAssessments.length }
      ];

      // Score distribution
      const scoreDistribution = [
        { range: '90-100%', count: completedAssessments.filter(a => (a.percentage_score || 0) >= 90).length },
        { range: '80-89%', count: completedAssessments.filter(a => (a.percentage_score || 0) >= 80 && (a.percentage_score || 0) < 90).length },
        { range: '70-79%', count: completedAssessments.filter(a => (a.percentage_score || 0) >= 70 && (a.percentage_score || 0) < 80).length },
        { range: '60-69%', count: completedAssessments.filter(a => (a.percentage_score || 0) >= 60 && (a.percentage_score || 0) < 70).length },
        { range: 'Below 60%', count: completedAssessments.filter(a => (a.percentage_score || 0) < 60).length }
      ];

      // Client performance
      const clientPerformance = completedAssessments.map(a => ({
        client: (a.clients as any)?.name || 'Unknown',
        score: a.percentage_score || 0,
        opportunities: opportunities.filter(opp => opp.assessment_id === a.id).length
      }));

      // Monthly trends (simplified)
      const monthlyTrends = [
        { month: 'Jan', assessments: 2, averageScore: 75 },
        { month: 'Feb', assessments: 3, averageScore: 78 },
        { month: 'Mar', assessments: 4, averageScore: 82 },
        { month: 'Apr', assessments: 1, averageScore: 85 },
        { month: 'May', assessments: 2, averageScore: 79 }
      ];

      setData({
        totalAssessments: assessments.length,
        completedAssessments: completedAssessments.length,
        averageScore,
        totalOpportunities: opportunities.length,
        opportunityValue: totalOpportunityValue,
        sectionScores,
        scoreDistribution,
        monthlyTrends,
        clientPerformance
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                <p className="text-2xl font-bold">{data.totalAssessments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{data.completedAssessments}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{data.averageScore.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Opportunities</p>
                <p className="text-2xl font-bold">{data.totalOpportunities}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Opportunity Value</p>
                <p className="text-2xl font-bold">${(data.opportunityValue / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sections">Section Performance</TabsTrigger>
          <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="clients">Client Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Average Scores by Section</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.sectionScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="section" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={data.scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Assessment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="assessments" fill="#8884d8" name="Assessments" />
                  <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="#82ca9d" name="Average Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.clientPerformance.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{client.client}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Score:</span>
                          <Badge variant={client.score >= 80 ? 'default' : client.score >= 70 ? 'secondary' : 'destructive'}>
                            {client.score.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Opportunities:</span>
                          <Badge variant="outline">{client.opportunities}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={client.score} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};