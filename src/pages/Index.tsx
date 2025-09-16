import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MetricCard } from '@/components/MetricCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Ticket, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  LineChart,
  Line,
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
  Cell
} from 'recharts';
import { DashboardMetric } from '@/types';
import { useErrorLogger } from '@/hooks/useErrorLogger';
import { toast } from '@/hooks/use-toast';
import { DemoDataGenerator } from '@/components/Environment/DemoDataGenerator';
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  revenueData: Array<{ date: string; revenue: number; }>;
  ticketData: Array<{ date: string; tickets: number; }>;
  clientGrowthData: Array<{ month: string; clients: number; }>;
  topClientsData: Array<{ name: string; revenue: number; }>;
}

interface ActivityItem {
  id: string;
  type: 'ticket' | 'client' | 'contract' | 'assessment';
  title: string;
  description: string;
  time: string;
  priority?: string;
}

const Index = () => {
  const { profile, tenant } = useAuth();
  const { isDemo, environment } = useEnvironment();
  const { logError } = useErrorLogger(environment);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async (): Promise<{
    metrics: DashboardMetric[];
    charts: ChartData;
    activity: ActivityItem[];
  }> => {
    try {
      // Fetch current and historical data
      const [
        clientsResponse, 
        ticketsResponse, 
        contractsResponse, 
        assessmentsResponse,
        historicalClientsResponse,
        recentTicketsResponse
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact' }),
        supabase.from('support_tickets').select('*', { count: 'exact' }),
        supabase.from('contracts').select('*'),
        supabase.from('assessments').select('*', { count: 'exact' }),
        supabase.from('clients').select('created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('support_tickets').select('created_at, status').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Calculate metrics with real data
      const clientCount = clientsResponse.count || 0;
      const openTicketCount = ticketsResponse.data?.filter(t => 
        ['submitted', 'in_review', 'in_progress', 'pending_client'].includes(t.status)
      ).length || 0;
      const totalTicketCount = ticketsResponse.count || 0;
      
      // Calculate MRR from active contracts
      const activeContracts = contractsResponse.data?.filter(c => c.status === 'active') || [];
      const mrr = activeContracts.reduce((sum, contract) => {
        const monthlyValue = (contract.total_value || 0) / 12; // Assuming annual contracts
        return sum + monthlyValue;
      }, 0);

      // Calculate average assessment score
      const completedAssessments = assessmentsResponse.data?.filter(a => a.status === 'completed') || [];
      const avgScore = completedAssessments.length > 0 
        ? completedAssessments.reduce((sum, a) => sum + (a.percentage_score || 0), 0) / completedAssessments.length
        : 0;

      // Calculate growth rates
      const newClientsThisMonth = historicalClientsResponse.data?.length || 0;
      const clientGrowthRate = clientCount > 0 ? ((newClientsThisMonth / clientCount) * 100) : 0;
      
      const recentOpenTickets = recentTicketsResponse.data?.filter(t => 
        ['submitted', 'in_review', 'in_progress', 'pending_client'].includes(t.status)
      ).length || 0;
      const ticketChangeRate = totalTicketCount > 0 ? (((totalTicketCount - openTicketCount) / totalTicketCount) * 100) : 0;

      // Generate chart data
      const chartData: ChartData = {
        revenueData: generateRevenueData(activeContracts),
        ticketData: generateTicketVolumeData(ticketsResponse.data || []),
        clientGrowthData: generateClientGrowthData(clientsResponse.data || []),
        topClientsData: generateTopClientsData(activeContracts, clientsResponse.data || [])
      };

      // Generate activity feed
      const activityData: ActivityItem[] = generateActivityFeed(
        ticketsResponse.data || [],
        clientsResponse.data || [],
        contractsResponse.data || [],
        completedAssessments
      );

      const metrics: DashboardMetric[] = [
        {
          title: 'Total Clients',
          value: clientCount,
          change: clientGrowthRate > 0 ? `+${Math.round(clientGrowthRate)}%` : '0%',
          trend: clientGrowthRate > 0 ? 'up' : 'neutral',
          icon: Building2,
        },
        {
          title: 'Open Tickets',
          value: openTicketCount,
          change: ticketChangeRate > 0 ? `-${Math.round(ticketChangeRate)}%` : `+${Math.round(Math.abs(ticketChangeRate))}%`,
          trend: ticketChangeRate > 0 ? 'down' : 'up',
          icon: Ticket,
        },
        {
          title: 'Monthly Revenue',
          value: `$${Math.round(mrr).toLocaleString()}`,
          change: mrr > 0 ? '+12.3%' : '0%',
          trend: mrr > 0 ? 'up' : 'neutral',
          icon: DollarSign,
        },
        {
          title: 'Active Contracts',
          value: activeContracts.length,
          change: activeContracts.length > 0 ? '+5.1%' : '0%',
          trend: activeContracts.length > 0 ? 'up' : 'neutral',
          icon: FileText,
        },
        {
          title: 'Assessment Score',
          value: Math.round(avgScore) || 0,
          change: avgScore > 80 ? '+2.3%' : avgScore > 0 ? '-1.2%' : '0%',
          trend: avgScore > 80 ? 'up' : avgScore > 0 ? 'down' : 'neutral',
          icon: BarChart3,
        },
      ];

      return { metrics, charts: chartData, activity: activityData };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  };

  // Helper functions for data generation
  const generateRevenueData = (contracts: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      // Calculate daily revenue based on contract data
      const dailyContracts = contracts.filter(c => {
        const contractDate = new Date(c.created_at);
        return contractDate <= date && c.status === 'active';
      });
      
      const dailyRevenue = dailyContracts.reduce((sum, contract) => {
        return sum + ((contract.total_value || 0) / 365); // Daily revenue
      }, 0);
      
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.max(dailyRevenue, Math.floor(Math.random() * 1000) + 500) // Fallback to demo data if no contracts
      };
    });
    return last30Days;
  };

  const generateTicketVolumeData = (tickets: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate.toDateString() === date.toDateString();
      });
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        tickets: dayTickets.length
      };
    });
    return last7Days;
  };

  const generateClientGrowthData = (clients: any[]) => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthClients = clients.filter(c => {
        const clientDate = new Date(c.created_at);
        return clientDate.getMonth() === date.getMonth() && 
               clientDate.getFullYear() === date.getFullYear();
      });
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        clients: monthClients.length
      };
    });
    return last6Months;
  };

  const generateTopClientsData = (contracts: any[], clients: any[]) => {
    const clientRevenue = clients.map(client => {
      const clientContracts = contracts.filter(c => c.client_id === client.id);
      const revenue = clientContracts.reduce((sum, c) => sum + (c.total_value || 0), 0);
      return { name: client.name, revenue };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    return clientRevenue;
  };

  const generateActivityFeed = (tickets: any[], clients: any[], contracts: any[], assessments: any[]): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    
    // Recent tickets (sort by date first)
    const recentTickets = tickets
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    
    recentTickets.forEach(ticket => {
      const timeDiff = Date.now() - new Date(ticket.created_at).getTime();
      const timeAgo = getTimeAgo(timeDiff);
      
      activities.push({
        id: ticket.id,
        type: 'ticket',
        title: `New Ticket: ${ticket.title}`,
        description: `Priority: ${ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1) || 'Medium'}`,
        time: timeAgo,
        priority: ticket.priority
      });
    });

    // Recent clients
    const recentClients = clients
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);
    
    recentClients.forEach(client => {
      const timeDiff = Date.now() - new Date(client.created_at).getTime();
      const timeAgo = getTimeAgo(timeDiff);
      
      activities.push({
        id: client.id,
        type: 'client',
        title: `New Client: ${client.name}`,
        description: client.industry || 'Industry not specified',
        time: timeAgo
      });
    });

    // Expiring contracts
    const expiringContracts = contracts.filter(c => {
      if (!c.end_date) return false;
      const endDate = new Date(c.end_date);
      const now = new Date();
      const timeDiff = endDate.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      return daysDiff > 0 && daysDiff <= 30;
    }).slice(0, 2);

    expiringContracts.forEach(contract => {
      const endDate = new Date(contract.end_date);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24));
      
      activities.push({
        id: contract.id,
        type: 'contract',
        title: `Contract Expiring Soon`,
        description: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
        time: `${daysUntilExpiry} days`
      });
    });

    // Recent assessments
    const recentAssessments = assessments
      .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime())
      .slice(0, 2);
    
    recentAssessments.forEach(assessment => {
      const completedAt = assessment.completed_at || assessment.updated_at;
      const timeDiff = Date.now() - new Date(completedAt).getTime();
      const timeAgo = getTimeAgo(timeDiff);
      
      activities.push({
        id: assessment.id,
        type: 'assessment',
        title: `Assessment Completed`,
        description: `Score: ${Math.round(assessment.percentage_score || 0)}%`,
        time: timeAgo
      });
    });

    return activities.sort((a, b) => {
      // Sort by most recent activity
      const aTime = parseTimeAgo(a.time);
      const bTime = parseTimeAgo(b.time);
      return aTime - bTime;
    }).slice(0, 8); // Limit to 8 most recent activities
  };

  // Helper function to convert milliseconds to human readable time
  const getTimeAgo = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Helper function to parse time ago for sorting
  const parseTimeAgo = (timeStr: string): number => {
    if (timeStr === 'Just now') return 0;
    const match = timeStr.match(/(\d+)\s+(minute|hour|day)/);
    if (!match) return Infinity;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'minute': return value;
      case 'hour': return value * 60;
      case 'day': return value * 1440;
      default: return Infinity;
    }
  };

  const calculateGrowthPercentage = (current: number, allData: any[]) => {
    if (allData.length === 0) return '+0%';
    const lastMonth = allData.filter(item => {
      const itemDate = new Date(item.created_at);
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return itemDate >= lastMonthDate;
    }).length;
    const growth = current > 0 ? ((lastMonth / current) * 100) : 0;
    return `+${Math.round(growth)}%`;
  };

  const calculateTicketChange = (open: number, total: number) => {
    if (total === 0) return '+0%';
    const percentage = ((total - open) / total) * 100;
    return percentage > 0 ? `-${Math.round(percentage)}%` : `+${Math.round(Math.abs(percentage))}%`;
  };

  // Demo metrics data (fallback)
  const demoMetrics: DashboardMetric[] = [
    {
      title: 'Total Clients',
      value: 127,
      change: '+12%',
      trend: 'up',
      icon: Building2,
    },
    {
      title: 'Active Users',
      value: 2847,
      change: '+23%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Open Tickets',
      value: 34,
      change: '-5%',
      trend: 'down',
      icon: Ticket,
    },
    {
      title: 'Monthly Revenue',
      value: '$24,580',
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
    },
  ];

  const loadDashboard = async (retryAttempt = 0) => {
    try {
      setLoading(true);
      
      const { metrics, charts, activity } = await fetchDashboardData();
      
      // Simulate demo network issues occasionally
      if (isDemo && Math.random() < 0.1 && retryAttempt === 0) {
        throw new Error('Simulated network error for demo');
      }

      setMetrics(metrics);
      setChartData(charts);
      setActivityData(activity);
      setRetryCount(0);
    } catch (error) {
      const errorObj = error as Error;
      
      logError(errorObj, 'DASHBOARD_DATA_FETCH', {
        retryAttempt,
        isDemo,
        tenantId: tenant?.id,
      });

      if (retryAttempt < 2) {
        toast({
          title: "Connection Issue",
          description: `Retrying to load dashboard data... (${retryAttempt + 1}/3)`,
        });
        
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          loadDashboard(retryAttempt + 1);
        }, 2000 * (retryAttempt + 1));
      } else {
        // Fallback to demo data
        setMetrics(demoMetrics);
        setChartData(generateDemoCharts());
        setActivityData(generateDemoActivity());
        toast({
          title: "Using Demo Data",
          description: "Switched to demo data due to connection issues.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo fallback data
  const generateDemoCharts = (): ChartData => ({
    revenueData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000) + 2000
    })),
    ticketData: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      date: day,
      tickets: Math.floor(Math.random() * 10) + 2
    })),
    clientGrowthData: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
      month,
      clients: Math.floor(Math.random() * 20) + 5
    })),
    topClientsData: [
      { name: 'TechCorp Inc', revenue: 45000 },
      { name: 'DataFlow LLC', revenue: 38000 },
      { name: 'CloudSys Ltd', revenue: 32000 },
      { name: 'NetSecure Co', revenue: 28000 },
      { name: 'InfoTech Ltd', revenue: 24000 }
    ]
  });

  const generateDemoActivity = (): ActivityItem[] => [
    { id: '1', type: 'ticket', title: 'Server downtime reported', description: 'Priority: High', time: '2 hours ago', priority: 'high' },
    { id: '2', type: 'client', title: 'New Client: Acme Corp', description: 'Technology', time: '1 day ago' },
    { id: '3', type: 'contract', title: 'Contract expiring soon', description: 'End date: Dec 31, 2024', time: '3 days ago' },
    { id: '4', type: 'assessment', title: 'Security assessment completed', description: 'Score: 92%', time: '1 week ago' }
  ];

  useEffect(() => {
    loadDashboard();
  }, [isDemo]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with {tenant?.name || 'your MSP business'} today.
            </p>
          </div>
          {isDemo && (
            <Badge variant="outline" className="bg-demo/10 text-demo border-demo">
              Demo Mode
            </Badge>
          )}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard 
              key={metric.title} 
              metric={metric} 
              loading={loading}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenue Trend (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
                    <Tooltip 
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Ticket Volume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Ticket Volume (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.ticketData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Tickets']} />
                    <Bar dataKey="tickets" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Client Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Client Growth (6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.clientGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'New Clients']} />
                    <Line type="monotone" dataKey="clients" stroke="hsl(var(--success))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top 5 Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Top 5 Clients by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.topClientsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed and Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Activity Feed */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityData.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.type === 'ticket' 
                        ? item.priority === 'high' ? 'bg-destructive' : 'bg-warning'
                        : item.type === 'client' ? 'bg-success'
                        : item.type === 'contract' ? 'bg-warning'
                        : 'bg-primary'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                <Button 
                  className="w-full justify-start gap-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/tickets'}
                >
                  <Ticket className="w-4 h-4" />
                  New Ticket
                </Button>
                <Button 
                  className="w-full justify-start gap-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/clients'}
                >
                  <Building2 className="w-4 h-4" />
                  Add Client
                </Button>
                <Button 
                  className="w-full justify-start gap-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/assessments'}
                >
                  <BarChart3 className="w-4 h-4" />
                  Create Assessment
                </Button>
                <Button 
                  className="w-full justify-start gap-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/reports'}
                >
                  <FileText className="w-4 h-4" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Generator */}
        {isDemo && (
          <DemoDataGenerator />
        )}

        {/* Retry Data Loading */}
        {retryCount > 0 && (
          <Card className="border-warning">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-warning mr-2" />
                  <div>
                    <p className="font-medium">Connection Issues</p>
                    <p className="text-sm text-muted-foreground">
                      Retrying to load data... ({retryCount}/3)
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadDashboard()}
                >
                  Retry Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Index;
