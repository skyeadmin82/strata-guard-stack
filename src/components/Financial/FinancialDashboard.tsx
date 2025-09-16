import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  CreditCard,
  Plus,
  Download
} from 'lucide-react';
import { useFinancialManagement } from '@/hooks/useFinancialManagement';
import { RecurringInvoiceManager } from '@/components/Financial/RecurringInvoiceManager';
import { format } from 'date-fns';

export const FinancialDashboard: React.FC = () => {
  const { 
    invoices,
    payments,
    loadFinancialData, 
    isLoading 
  } = useFinancialManagement();

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Calculate real metrics from database data
  const metrics = useMemo(() => {
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingInvoices = invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'overdue' || 
      (inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'paid')
    );
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    // Calculate monthly recurring from recent invoices (approximation)
    const monthlyRecurring = invoices
      .filter(inv => inv.created_at && 
        new Date(inv.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    return {
      totalRevenue,
      pendingInvoices,
      overdueAmount,
      monthlyRecurring,
      totalInvoices: invoices.length,
      pendingInvoiceCount: invoices.filter(inv => inv.status === 'sent').length,
      overdueInvoiceCount: overdueInvoices.length
    };
  }, [invoices, payments]);

  const recentInvoices = invoices.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor revenue, invoices, and financial performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {payments.length} payments processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.pendingInvoices.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingInvoiceCount} invoices awaiting payment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${metrics.overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.overdueInvoiceCount} overdue invoices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.monthlyRecurring.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month's invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Data Tables */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices found</p>
                    <p className="text-sm">Create your first invoice to get started</p>
                  </div>
                ) : (
                  recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">Client ID: {invoice.client_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${Number(invoice.total_amount || 0).toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(invoice.status || 'draft')}>
                            {invoice.status}
                          </Badge>
                          {invoice.due_date && (
                            <span className="text-sm text-muted-foreground">
                              Due {format(new Date(invoice.due_date), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payments found</p>
                    <p className="text-sm">Payments will appear here once processed</p>
                  </div>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <CreditCard className={`h-8 w-8 ${payment.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">{payment.payment_reference}</p>
                          <p className="text-sm text-muted-foreground">{payment.payment_method || 'Unknown method'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${payment.status === 'completed' ? 'text-green-600' : ''}`}>
                          ${Number(payment.amount || 0).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(payment.status || 'processing')}>
                            {payment.status}
                          </Badge>
                          {payment.created_at && (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(payment.created_at), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recurring" className="space-y-4">
          <RecurringInvoiceManager />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Invoices</span>
                    <span>{metrics.totalInvoices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="text-green-600">${metrics.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Amount</span>
                    <span className="text-blue-600">${metrics.pendingInvoices.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue Amount</span>
                    <span className="text-red-600">${metrics.overdueAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completed Payments</span>
                    <span>{payments.filter(p => p.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing</span>
                    <span>{payments.filter(p => p.status === 'processing').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed</span>
                    <span>{payments.filter(p => p.status === 'failed').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};