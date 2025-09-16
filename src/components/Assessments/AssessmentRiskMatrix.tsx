import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Assessment } from '@/types/database';

interface AssessmentRiskMatrixProps {
  assessments: Assessment[];
  onAssessmentClick?: (assessment: Assessment) => void;
}

interface RiskPoint {
  assessment: Assessment;
  impact: number;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export const AssessmentRiskMatrix: React.FC<AssessmentRiskMatrixProps> = ({
  assessments,
  onAssessmentClick
}) => {
  const riskPoints = useMemo(() => {
    return assessments.map((assessment): RiskPoint => {
      const score = assessment.percentage_score || 0;
      
      // Calculate impact based on score (lower score = higher impact)
      const impact = Math.max(1, Math.ceil((100 - score) / 20));
      
      // Calculate probability based on findings and score
      let probability = 1;
      if (score < 40) probability = 5;
      else if (score < 60) probability = 4;
      else if (score < 75) probability = 3;
      else if (score < 90) probability = 2;
      else probability = 1;

      // Determine risk level
      const riskScore = impact * probability;
      let riskLevel: RiskPoint['riskLevel'] = 'low';
      if (riskScore >= 20) riskLevel = 'critical';
      else if (riskScore >= 15) riskLevel = 'high';
      else if (riskScore >= 8) riskLevel = 'medium';

      return {
        assessment,
        impact,
        probability,
        riskLevel
      };
    });
  }, [assessments]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-600 hover:bg-red-700';
      case 'high': return 'bg-orange-500 hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const getCellColor = (impact: number, probability: number) => {
    const riskScore = impact * probability;
    if (riskScore >= 20) return 'bg-red-100';
    if (riskScore >= 15) return 'bg-orange-100';
    if (riskScore >= 8) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getPointsInCell = (impact: number, probability: number) => {
    return riskPoints.filter(point => point.impact === impact && point.probability === probability);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Risk Matrix
          <div className="flex gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Critical</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-1 text-sm">
          {/* Header row */}
          <div className="col-span-1"></div>
          <div className="text-center font-medium">Very Low</div>
          <div className="text-center font-medium">Low</div>
          <div className="text-center font-medium">Medium</div>
          <div className="text-center font-medium">High</div>
          <div className="text-center font-medium">Very High</div>

          {/* Matrix rows */}
          {[5, 4, 3, 2, 1].map(impact => (
            <React.Fragment key={impact}>
              <div className="flex items-center justify-center font-medium">
                {impact === 5 && 'Critical'}
                {impact === 4 && 'High'}
                {impact === 3 && 'Medium'}
                {impact === 2 && 'Low'}
                {impact === 1 && 'Very Low'}
              </div>
              {[1, 2, 3, 4, 5].map(probability => {
                const pointsInCell = getPointsInCell(impact, probability);
                return (
                  <div
                    key={`${impact}-${probability}`}
                    className={`min-h-16 border rounded p-1 flex flex-wrap gap-1 ${getCellColor(impact, probability)}`}
                  >
                    <TooltipProvider>
                      {pointsInCell.map((point, index) => (
                        <Tooltip key={point.assessment.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 h-3 rounded-full cursor-pointer ${getRiskColor(point.riskLevel)}`}
                              onClick={() => onAssessmentClick?.(point.assessment)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-medium">{point.assessment.title}</p>
                              <p>Score: {point.assessment.percentage_score?.toFixed(1) || 0}%</p>
                              <p>Risk: {point.riskLevel}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                    {pointsInCell.length > 1 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        +{pointsInCell.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p><strong>Impact:</strong> Potential consequence if risk occurs</p>
          <p><strong>Probability:</strong> Likelihood of risk occurring based on assessment score</p>
          <p>Click on risk points to view assessment details</p>
        </div>
      </CardContent>
    </Card>
  );
};