import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DashboardMetric } from '@/types';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: DashboardMetric;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, loading = false }) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded animate-pulse w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2" />
          <div className="h-3 bg-muted rounded animate-pulse w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.title}
        </CardTitle>
        {metric.icon && (
          <metric.icon className="w-4 h-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {metric.value}
        </div>
        {metric.change && (
          <Badge
            variant="secondary"
            className={cn(
              "text-xs gap-1",
              getTrendColor()
            )}
          >
            {getTrendIcon()}
            {metric.change}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};