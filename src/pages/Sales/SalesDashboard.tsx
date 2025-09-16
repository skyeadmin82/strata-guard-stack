import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Award,
  Activity,
  Calendar,
  Plus,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalDeals: 0,
    totalAgents: 0,
    conversionRate: 0,
    avgDealSize: 0,
    totalCommission: 0
  });

  const [topAgents, setTopAgents] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch metrics
    const { data: deals } = await supabase
      .from('sales_deals')
      .select('*')
      .eq('stage', 'closed_won');
    
    const { data: agents } = await supabase
      .from('sales_agents')
      .select('*')
      .eq('status', 'active');
    
    const { data: leads } = await supabase
      .from('sales_leads')
      .select('*');

    // Calculate metrics
    if (deals && agents && leads) {
      const totalRevenue = deals.reduce((sum, deal) => sum + Number(deal.deal_value), 0);
      const wonLeads = leads.filter(l => l.status === 'won').length;
      const conversionRate = leads.length > 0 ? (wonLeads / leads.length * 100) : 0;
      
      setMetrics({
        totalRevenue,
        totalDeals: deals.length,
        totalAgents: agents.length,
        conversionRate,
        avgDealSize: deals.length > 0 ? totalRevenue / deals.length : 0,
        totalCommission: deals.reduce((sum, deal) => sum + Number(deal.commission_amount || 0), 0)
      });

      // Set top agents
      setTopAgents(agents.sort((a, b) => b.total_sales - a.total_sales).slice(0, 5));
    }

    // Fetch pipeline data
    const { data: pipelineData } = await supabase
      .from('sales_deals')
      .select('stage, deal_value')
      .neq('stage', 'closed_lost');
    
    if (pipelineData) {
      const stages = ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won'];
      const pipelineCounts = stages.map(stage => ({
        stage,
        count: pipelineData.filter(d => d.stage === stage).length,
        value: pipelineData
          .filter(d => d.stage === stage)
          .reduce((sum, d) => sum + Number(d.deal_value || 0), 0)
      }));
      setPipeline(pipelineCounts);
    }

    // Fetch recent activities
    const { data: activities } = await supabase
      .from('sales_activities')
      .select('*, sales_agents(first_name, last_name), sales_leads(company_name)')
      .order('created_at', { ascending: false })
      .limit(10);
    
    setRecentActivities(activities || []);

    // Generate revenue trend data
    setRevenueData([
      { month: 'Jan', revenue: 45000, deals: 12 },
      { month: 'Feb', revenue: 52000, deals: 15 },
      { month: 'Mar', revenue: 48000, deals: 14 },
      { month: 'Apr', revenue: 61000, deals: 18 },
      { month: 'May', revenue: 58000, deals: 17 },
      { month: 'Jun', revenue: 67000, deals: 20 }
    ]);

    setLoading(false);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-gray-600">Manage agents, track deals, and monitor performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/sales/leads/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
          <Button onClick={() => navigate('/sales/agents')}>
            <Users className="mr-2 h-4 w-4" />
            Manage Agents
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.totalRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-green-600">
              <ArrowUp className="inline h-3 w-3" /> 12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Deals Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDeals}</div>
            <p className="text-xs text-green-600">
              <ArrowUp className="inline h-3 w-3" /> 8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAgents}</div>
            <p className="text-xs text-gray-600">2 top performers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-green-600">
              <ArrowUp className="inline h-3 w-3" /> 3% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Avg Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.avgDealSize / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-600">Per contract</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Commission Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.totalCommission / 1000).toFixed(0)}K</div>
            <p className="text-xs text-gray-600">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue and deal count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    name="Revenue ($)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="deals" 
                    stroke="#82ca9d" 
                    name="Deals"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Current deals by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipeline.map((stage) => (
                  <div key={stage.stage}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm capitalize">
                        {stage.stage.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {stage.count} deals • ${(stage.value / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <Progress value={(stage.count / 20) * 100} className="h-2" />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Total Pipeline Value</span>
                  <span className="font-bold text-lg">
                    ${(pipeline.reduce((sum, s) => sum + s.value, 0) / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest sales team activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">
                          {activity.sales_agents?.first_name} {activity.sales_agents?.last_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {activity.activity_type} • {activity.sales_leads?.company_name}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <CardDescription>This month's leaders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAgents.map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                        ${index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{agent.first_name} {agent.last_name}</p>
                        <p className="text-xs text-gray-600">
                          ${(agent.total_sales / 1000).toFixed(0)}K sales
                        </p>
                      </div>
                    </div>
                    <Badge variant={agent.tier === 'platinum' ? 'default' : 'secondary'}>
                      {agent.tier}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => navigate('/sales/leaderboard')}
              >
                View Full Leaderboard
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/sales/pipeline')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Sales Pipeline
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/sales/leads')}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Leads
              </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/sales/deals')}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  View Deals
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/sales/commission')}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Commission Report
                </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/sales/distribution')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Distribution Rules
              </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commission Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Overview</CardTitle>
              <CardDescription>Current period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="font-medium">$12,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Approved</span>
                  <span className="font-medium">$8,300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Paid</span>
                  <span className="font-medium">$45,600</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">$66,350</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}