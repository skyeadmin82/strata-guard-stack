import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock, Target } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface AnalyticsData {
  totalProposals: number;
  totalValue: number;
  avgValue: number;
  winRate: number;
  avgTimeToClose: number;
  conversionRate: number;
}

interface TimeSeriesData {
  date: string;
  proposals: number;
  value: number;
  won: number;
  lost: number;
}

interface StatusData {
  status: string;
  count: number;
  value: number;
  percentage: number;
}

export const ProposalAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalProposals: 0,
    totalValue: 0,
    avgValue: 0,
    winRate: 0,
    avgTimeToClose: 0,
    conversionRate: 0,
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    if (proposals.length > 0) {
      processAnalyticsData();
    }
  }, [proposals, dateRange]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7days':
        return { start: subDays(now, 7), end: now };
      case '30days':
        return { start: subDays(now, 30), end: now };
      case '3months':
        return { start: subMonths(now, 3), end: now };
      case '6months':
        return { start: subMonths(now, 6), end: now };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const processAnalyticsData = () => {
    const { start, end } = getDateRange();
    const filteredProposals = proposals.filter(p => {
      const createdAt = new Date(p.created_at);
      return createdAt >= start && createdAt <= end;
    });

    // Calculate basic metrics
    const totalProposals = filteredProposals.length;
    const totalValue = filteredProposals.reduce((sum, p) => sum + (p.final_amount || p.total_amount || 0), 0);
    const avgValue = totalProposals > 0 ? totalValue / totalProposals : 0;
    
    const wonProposals = filteredProposals.filter(p => p.status === 'accepted' || p.status === 'approved');
    const lostProposals = filteredProposals.filter(p => p.status === 'rejected' || p.status === 'cancelled');
    const winRate = totalProposals > 0 ? (wonProposals.length / totalProposals) * 100 : 0;
    
    // Calculate average time to close (simplified - using days from creation to accepted/rejected)
    const closedProposals = [...wonProposals, ...lostProposals].filter(p => p.accepted_date || p.updated_at);
    const avgTimeToClose = closedProposals.length > 0 
      ? closedProposals.reduce((sum, p) => {
          const created = new Date(p.created_at);
          const closed = new Date(p.accepted_date || p.updated_at);
          return sum + Math.abs(closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / closedProposals.length
      : 0;

    const viewedProposals = filteredProposals.filter(p => p.view_count > 0);
    const conversionRate = viewedProposals.length > 0 ? (wonProposals.length / viewedProposals.length) * 100 : 0;

    setAnalyticsData({
      totalProposals,
      totalValue,
      avgValue,
      winRate,
      avgTimeToClose,
      conversionRate,
    });

    // Process time series data
    const dailyData = new Map<string, { proposals: number; value: number; won: number; lost: number }>();
    
    filteredProposals.forEach(proposal => {
      const date = format(new Date(proposal.created_at), 'yyyy-MM-dd');
      const current = dailyData.get(date) || { proposals: 0, value: 0, won: 0, lost: 0 };
      
      current.proposals += 1;
      current.value += proposal.final_amount || proposal.total_amount || 0;
      
      if (proposal.status === 'accepted' || proposal.status === 'approved') {
        current.won += 1;
      } else if (proposal.status === 'rejected' || proposal.status === 'cancelled') {
        current.lost += 1;
      }
      
      dailyData.set(date, current);
    });

    const timeSeriesArray = Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setTimeSeriesData(timeSeriesArray);

    // Process status data
    const statusGroups = filteredProposals.reduce((acc, proposal) => {
      const status = proposal.status;
      if (!acc[status]) {
        acc[status] = { count: 0, value: 0 };
      }
      acc[status].count += 1;
      acc[status].value += proposal.final_amount || proposal.total_amount || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    const statusArray = Object.entries(statusGroups).map(([status, data]) => ({
      status,
      count: (data as { count: number; value: number }).count,
      value: (data as { count: number; value: number }).value,
      percentage: totalProposals > 0 ? ((data as { count: number; value: number }).count / totalProposals) * 100 : 0,
    }));

    setStatusData(statusArray);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const pieColors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Proposal Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track proposal performance and conversion metrics
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="thisMonth">This month</SelectItem>
            <SelectItem value="lastMonth">Last month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalProposals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.avgValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Close</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.avgTimeToClose.toFixed(0)} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposal Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Proposal Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'MMM dd')} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value, name) => [value, name === 'proposals' ? 'Proposals' : 'Won']}
                />
                <Area type="monotone" dataKey="proposals" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                <Area type="monotone" dataKey="won" stackId="2" stroke="#10b981" fill="#10b981" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Value Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Value Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'MMM dd')} />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value) => [formatCurrency(Number(value)), 'Value']}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, `${props.payload.status} (${props.payload.percentage.toFixed(1)}%)`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Value by Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Value by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Top Performing Status</h4>
              {statusData.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {statusData.reduce((max, status) => 
                    status.value > max.value ? status : max
                  ).status} ({formatCurrency(statusData.reduce((max, status) => 
                    status.value > max.value ? status : max
                  ).value)})
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Proposal Velocity</h4>
              <div className="text-sm text-muted-foreground">
                {timeSeriesData.length > 0 ? 
                  `${(timeSeriesData.reduce((sum, day) => sum + day.proposals, 0) / timeSeriesData.length).toFixed(1)} proposals/day avg` :
                  'No data'
                }
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Revenue Potential</h4>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(
                  statusData
                    .filter(s => s.status === 'sent' || s.status === 'viewed' || s.status === 'pending_approval')
                    .reduce((sum, s) => sum + s.value, 0)
                )} in pipeline
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};