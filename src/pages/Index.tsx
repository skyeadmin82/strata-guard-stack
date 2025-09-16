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
  DollarSign
} from 'lucide-react';
import { DashboardMetric } from '@/types';
import { useErrorLogger } from '@/hooks/useErrorLogger';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { profile, tenant } = useAuth();
  const { isDemo, environment } = useEnvironment();
  const { logError } = useErrorLogger(environment);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Demo metrics data
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

  const fetchDashboardData = async (retryAttempt = 0) => {
    try {
      setLoading(true);
      
      // Simulate API call with potential failure for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isDemo && Math.random() < 0.1 && retryAttempt === 0) {
        throw new Error('Simulated network error for demo');
      }

      setMetrics(demoMetrics);
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
          fetchDashboardData(retryAttempt + 1);
        }, 2000 * (retryAttempt + 1));
      } else {
        toast({
          title: "Failed to Load Data",
          description: "Unable to load dashboard data. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard 
              key={metric.title} 
              metric={metric} 
              loading={loading}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CheckCircle className="w-5 h-5 text-success mr-2" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Latest system updates and client activities
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                  Client backup completed successfully
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-warning rounded-full mr-2"></div>
                  Security patch pending approval
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <AlertTriangle className="w-5 h-5 text-warning mr-2" />
              <CardTitle className="text-base">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                System alerts requiring attention
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-destructive rounded-full mr-2"></div>
                  Server disk space critical
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-warning rounded-full mr-2"></div>
                  2 tickets awaiting response
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="w-5 h-5 text-primary mr-2" />
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Common tasks and shortcuts
              </p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Create New Ticket
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Add New Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  onClick={() => fetchDashboardData()}
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
