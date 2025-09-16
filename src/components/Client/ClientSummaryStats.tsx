import React, { useMemo } from 'react';

interface ClientSummaryStatsProps {
  clientCount: number;
  selectedCount: number;
  clientStats: Map<string, any>;
}

export const ClientSummaryStats: React.FC<ClientSummaryStatsProps> = ({
  clientCount,
  selectedCount,
  clientStats
}) => {
  const summaryData = useMemo(() => {
    const statsArray = Array.from(clientStats.values());
    const avgHealthScore = statsArray.length > 0 
      ? Math.round(statsArray.reduce((sum, s) => sum + s.health_score, 0) / statsArray.length)
      : 0;
    const totalActiveContracts = statsArray.reduce((sum, s) => sum + s.active_contracts, 0);
    
    return {
      avgHealthScore,
      totalActiveContracts
    };
  }, [clientStats]);

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <div>
        Showing {clientCount} clients
        {selectedCount > 0 && (
          <span> • {selectedCount} selected</span>
        )}
      </div>
      <div className="flex gap-4">
        <span>Health Score Avg: {summaryData.avgHealthScore}%</span>
        <span>Active Contracts: {summaryData.totalActiveContracts}</span>
      </div>
    </div>
  );
};