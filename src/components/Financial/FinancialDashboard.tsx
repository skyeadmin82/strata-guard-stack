import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  Eye
} from 'lucide-react';
import { useFinancialManagement } from '@/hooks/useFinancialManagement';
import { useFinancialReports } from '@/hooks/useFinancialReports';

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  totalPayments: number;
  avgPaymentTime: number;
  cashFlow: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    target: number;
  }>;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
  anomalyTrends: Array<{
    date: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export const FinancialDashboard: React.FC = () => {
  const {
    invoices,
    payments,
    anomalies,
    isLoading,
    loadFinancialData,
    detectAnomalies
  } = useFinancialManagement();

  const { reports, generateProfitLossReport } = useFinancialReports();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    outstandingInvoices: 0,
    overdueInvoices: 0,
    totalPayments: 0,
    avgPaymentTime: 0,
    cashFlow: [],
    revenueByMonth: [],
    expenseBreakdown: [],
    anomalyTrends: []
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Calculate metrics from data
  const calculateMetrics = () => {
    const now = new Date();
    const timeframeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    }[selectedTimeframe];

    const cutoffDate = new Date(now.getTime() - timeframeMs);

    // Filter data by timeframe
    const recentInvoices = invoices.filter(inv => 
      new Date(inv.created_at) >= cutoffDate
    );
    const recentPayments = payments.filter(pay => 
      new Date(pay.created_at) >= cutoffDate
    );

    // Calculate basic metrics
    const totalRevenue = recentInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    const totalExpenses = totalRevenue * 0.65; // Simplified calculation
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const outstandingInvoices = invoices.filter(inv => 
      ['sent', 'viewed'].includes(inv.status)
    ).length;

    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'overdue'
    ).length;

    const totalPayments = recentPayments
      .filter(pay => pay.status === 'completed')
      .reduce((sum, pay) => sum + Number(pay.amount), 0);

    // Generate mock data for charts
    const cashFlow = generateMockCashFlowData();
    const revenueByMonth = generateMockRevenueData();
    const expenseBreakdown = generateMockExpenseBreakdown();
    const anomalyTrends = generateMockAnomalyTrends();

    setMetrics({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      outstandingInvoices,
      overdueInvoices,
      totalPayments,
      avgPaymentTime: 12, // Mock average days
      cashFlow,
      revenueByMonth,
      expenseBreakdown,
      anomalyTrends
    });
  };

  // Generate mock data for demonstration
  const generateMockCashFlowData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      inflow: Math.floor(Math.random() * 50000) + 20000,
      outflow: Math.floor(Math.random() * 40000) + 15000,
      net: Math.floor(Math.random() * 20000) - 5000
    }));
  };

  const generateMockRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 60000) + 30000,
      target: 50000
    }));
  };

  const generateMockExpenseBreakdown = () => [
    { category: 'Salaries', amount: 25000, color: '#8884d8' },
    { category: 'Operations', amount: 15000, color: '#82ca9d' },
    { category: 'Marketing', amount: 8000, color: '#ffc658' },
    { category: 'Technology', amount: 5000, color: '#ff7300' },
    { category: 'Other', amount: 3000, color: '#00c7be' }
  ];

  const generateMockAnomalyTrends = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5),
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any
      });
    }
    return dates;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    calculateMetrics();
  }, [invoices, payments, selectedTimeframe]);

  useEffect(() => {
    loadFinancialData();
    detectAnomalies();
  }, [loadFinancialData, detectAnomalies]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadFinancialData();
      detectAnomalies();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadFinancialData, detectAnomalies]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time financial metrics and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.netProfit)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-1">Margin:</span>
              {metrics.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.outstandingInvoices}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Avg {metrics.avgPaymentTime} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.overdueInvoices}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              Requires attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Shield className="h-5 w-5 mr-2" />
              Financial Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.slice(0, 3).map((anomaly) => (
                <div key={anomaly.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(anomaly.severity)}`}></div>
                    <div>
                      <p className="font-medium">{anomaly.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {anomaly.confidence_score}%
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Investigate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="cashflow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={metrics.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area type="monotone" dataKey="inflow" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="outflow" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  <Line type="monotone" dataKey="net" stroke="#ff7300" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" />
                  <Bar dataKey="target" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={metrics.expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {metrics.expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.anomalyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};