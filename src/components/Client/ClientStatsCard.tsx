import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Ticket,
  FileText,
  Users,
  BarChart3,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { ClientHealthBadge } from './ClientHealthBadge';

interface ClientStatsCardProps {
  stats: {
    health_score: number;
    risk_level: string;
    total_tickets: number;
    open_tickets: number;
    active_contracts: number;
    total_contract_value: number;
    contact_count: number;
    avg_assessment_score: number;
    recent_activities: number;
    last_activity_at?: string;
  };
  compact?: boolean;
}

export const ClientStatsCard: React.FC<ClientStatsCardProps> = ({ stats, compact = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatLastActivity = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const getTicketHealthColor = (open: number, total: number) => {
    if (total === 0) return 'text-success';
    const percentage = (open / total) * 100;
    if (percentage <= 20) return 'text-success';
    if (percentage <= 50) return 'text-warning';
    return 'text-destructive';
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ClientHealthBadge 
            healthScore={stats.health_score} 
            riskLevel={stats.risk_level}
            size="sm"
          />
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-muted-foreground" />
              <span className={getTicketHealthColor(stats.open_tickets, stats.total_tickets)}>
                {stats.open_tickets}/{stats.total_tickets}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>{stats.active_contracts}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">{formatCurrency(stats.total_contract_value)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{stats.contact_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Client Health Score
          </CardTitle>
          <CardDescription>
            Overall client relationship health and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ClientHealthBadge 
              healthScore={stats.health_score} 
              riskLevel={stats.risk_level}
              showProgress={true}
              size="lg"
            />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Assessment Average</span>
                <div className="flex items-center gap-2">
                  <Progress value={stats.avg_assessment_score} className="flex-1 h-2" />
                  <span className="font-medium">{Math.round(stats.avg_assessment_score)}%</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Recent Activity</span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{formatLastActivity(stats.last_activity_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Business Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Ticket className="w-4 h-4" />
                  Support Tickets
                </span>
                <Badge variant="outline" className={getTicketHealthColor(stats.open_tickets, stats.total_tickets)}>
                  {stats.open_tickets} open
                </Badge>
              </div>
              <div className="text-2xl font-bold">{stats.total_tickets}</div>
              <div className="text-xs text-muted-foreground">
                Total tickets created
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Active Contracts
                </span>
              </div>
              <div className="text-2xl font-bold">{stats.active_contracts}</div>
              <div className="text-xs text-muted-foreground">
                Current agreements
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Contract Value
                </span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_contract_value)}</div>
              <div className="text-xs text-muted-foreground">
                Total active value
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Contacts
                </span>
              </div>
              <div className="text-2xl font-bold">{stats.contact_count}</div>
              <div className="text-xs text-muted-foreground">
                Active contacts
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{stats.recent_activities}</div>
              <div className="text-sm text-muted-foreground">Activities in last 30 days</div>
            </div>
            <Badge variant={stats.recent_activities > 5 ? 'default' : stats.recent_activities > 2 ? 'secondary' : 'destructive'}>
              {stats.recent_activities > 5 ? 'Active' : stats.recent_activities > 2 ? 'Moderate' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};