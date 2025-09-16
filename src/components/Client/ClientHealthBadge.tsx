import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ClientHealthBadgeProps {
  healthScore: number;
  riskLevel: string;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ClientHealthBadge: React.FC<ClientHealthBadgeProps> = ({
  healthScore,
  riskLevel,
  showProgress = false,
  size = 'md'
}) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return Heart;
    if (score >= 60) return Shield;
    return AlertTriangle;
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = (score: number) => {
    return score >= 60 ? TrendingUp : TrendingDown;
  };

  const HealthIcon = getHealthIcon(healthScore);
  const TrendIcon = getTrendIcon(healthScore);

  const badgeSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-2">
      <Badge 
        className={`${getHealthColor(healthScore)} ${badgeSize} flex items-center gap-1`}
        variant="secondary"
      >
        <HealthIcon className={iconSize} />
        <span>{healthScore}%</span>
        {size !== 'sm' && <span>{getHealthLabel(healthScore)}</span>}
      </Badge>
      
      {size !== 'sm' && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon className="w-3 h-3" />
          <span className="capitalize">{riskLevel} Risk</span>
        </div>
      )}
      
      {showProgress && (
        <div className="flex-1 min-w-16">
          <Progress 
            value={healthScore} 
            className="h-2"
            aria-label={`Client health score: ${healthScore}%`}
          />
        </div>
      )}
    </div>
  );
};