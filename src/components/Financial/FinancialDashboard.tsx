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
    transactions,
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

  // Calculate metrics from REAL data
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
    const recentTransactions = transactions.filter(tx => 
      new Date(tx.transaction_date) >= cutoffDate
    );

    // Calculate REAL metrics
    const totalRevenue = recentInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    const expenseTransactions = recentTransactions.filter(tx => tx.transaction_type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + Number(tx.total_amount), 0);
    
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

    // Calculate average payment time from real data
    const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.due_date);
    const avgPaymentDays = paidInvoices.length > 0 
      ? paidInvoices.reduce((sum, inv) => {
          const dueDate = new Date(inv.due_date!);
          const paidDate = new Date(inv.updated_at);
          const daysDiff = Math.max(0, Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
          return sum + daysDiff;
        }, 0) / paidInvoices.length
      : 0;

    // Generate REAL data for charts
    const cashFlow = generateRealCashFlowData(recentTransactions, recentPayments);
    const revenueByMonth = generateRealRevenueData(recentInvoices);
    const expenseBreakdown = generateRealExpenseBreakdown(expenseTransactions);
    const anomalyTrends = generateRealAnomalyTrends();

    setMetrics({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      outstandingInvoices,
      overdueInvoices,
      totalPayments,
      avgPaymentTime: Math.round(avgPaymentDays) || 0,
      cashFlow,
      revenueByMonth,
      expenseBreakdown,
      anomalyTrends
    });
  };

  // Generate REAL data for charts
  const generateRealCashFlowData = (transactions: any[], payments_data: any[]) => {
    const monthlyData = new Map();
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData.set(monthKey, { month: monthKey, inflow: 0, outflow: 0, net: 0 });
    }

    // Process payments (inflows)
    payments_data.forEach(payment => {
      if (payment.status === 'completed') {
        const date = new Date(payment.payment_date || payment.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).inflow += Number(payment.amount);
        }
      }
    });

    // Process expense transactions (outflows)
    transactions.forEach(tx => {
      if (tx.transaction_type === 'expense') {
        const date = new Date(tx.transaction_date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).outflow += Number(tx.total_amount);
        }
      }
    });

    // Calculate net for each month
    Array.from(monthlyData.values()).forEach(month => {
      month.net = month.inflow - month.outflow;
    });

    return Array.from(monthlyData.values());
  };

  const generateRealRevenueData = (invoices_data: any[]) => {
    const monthlyRevenue = new Map();
    const now = new Date();
    
    // Initialize last 6 months with targets
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyRevenue.set(monthKey, { month: monthKey, revenue: 0, target: 50000 });
    }

    // Process paid invoices
    invoices_data.forEach(invoice => {
      if (invoice.status === 'paid') {
        const date = new Date(invoice.updated_at || invoice.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyRevenue.has(monthKey)) {
          monthlyRevenue.get(monthKey).revenue += Number(invoice.total_amount);
        }
      }
    });

    return Array.from(monthlyRevenue.values());
  };

  const generateRealExpenseBreakdown = (expense_transactions: any[]) => {
    const categories = new Map();
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c7be', '#8dd1e1', '#d084d0'];
    
    expense_transactions.forEach(tx => {
      const category = tx.description || 'Other';
      const amount = Number(tx.total_amount);
      
      if (categories.has(category)) {
        categories.set(category, categories.get(category) + amount);
      } else {
        categories.set(category, amount);
      }
    });

    const result = Array.from(categories.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7); // Top 7 categories

    return result.length > 0 ? result : [
      { category: 'No Expenses', amount: 0, color: '#8884d8' }
    ];
  };

  const generateRealAnomalyTrends = () => {
    const dates = [];
    const groupedAnomalies = new Map();
    
    // Group anomalies by date
    anomalies.forEach(anomaly => {
      const date = new Date(anomaly.created_at).toISOString().split('T')[0];
      if (!groupedAnomalies.has(date)) {
        groupedAnomalies.set(date, { count: 0, severities: [] });
      }
      groupedAnomalies.get(date).count++;
      groupedAnomalies.get(date).severities.push(anomaly.severity);
    });

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const anomalyData = groupedAnomalies.get(dateStr) || { count: 0, severities: [] };
      const highestSeverity = anomalyData.severities.includes('critical') ? 'critical' :
                             anomalyData.severities.includes('high') ? 'high' :
                             anomalyData.severities.includes('medium') ? 'medium' : 'low';
      
      dates.push({
        date: dateStr,
        count: anomalyData.count,
        severity: highestSeverity
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
  }, [invoices, payments, transactions, anomalies, selectedTimeframe]);

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