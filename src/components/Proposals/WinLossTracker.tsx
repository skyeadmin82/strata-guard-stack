import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

interface WinLossData {
  status: string;
  count: number;
  value: number;
}

interface WinLossTrackerProps {
  proposals: Array<{
    id: string;
    status: string;
    total_amount?: number;
    final_amount?: number;
    currency: string;
    created_at: string;
  }>;
}

export const WinLossTracker: React.FC<WinLossTrackerProps> = ({ proposals }) => {
  const [winLossData, setWinLossData] = useState<WinLossData[]>([]);

  useEffect(() => {
    const processWinLossData = () => {
      const statusGroups = proposals.reduce((acc, proposal) => {
        const status = proposal.status;
        const amount = proposal.final_amount || proposal.total_amount || 0;
        
        if (!acc[status]) {
          acc[status] = { count: 0, value: 0 };
        }
        
        acc[status].count += 1;
        acc[status].value += amount;
        
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const data = Object.entries(statusGroups).map(([status, data]) => ({
        status,
        count: data.count,
        value: data.value,
      }));

      setWinLossData(data);
    };

    processWinLossData();
  }, [proposals]);

  const wonProposals = proposals.filter(p => p.status === 'accepted' || p.status === 'approved');
  const lostProposals = proposals.filter(p => p.status === 'rejected' || p.status === 'cancelled');
  const pendingProposals = proposals.filter(p => p.status === 'sent' || p.status === 'viewed' || p.status === 'pending_approval');

  const winRate = proposals.length > 0 ? (wonProposals.length / proposals.length) * 100 : 0;
  const lossRate = proposals.length > 0 ? (lostProposals.length / proposals.length) * 100 : 0;

  const totalWonValue = wonProposals.reduce((sum, p) => sum + (p.final_amount || p.total_amount || 0), 0);
  const totalLostValue = lostProposals.reduce((sum, p) => sum + (p.final_amount || p.total_amount || 0), 0);

  const pieColors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Win/Loss Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {wonProposals.length} of {proposals.length} proposals won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loss Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lossRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {lostProposals.length} of {proposals.length} proposals lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Value</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalWonValue)}
            </div>
            <p className="text-xs text-muted-foreground">Total revenue from won proposals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingProposals.length}</div>
            <p className="text-xs text-muted-foreground">Proposals awaiting decision</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Proposal Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
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
              <BarChart data={winLossData}>
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

      {/* Recent Win/Loss Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...wonProposals, ...lostProposals]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10)
              .map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={proposal.status === 'accepted' || proposal.status === 'approved' ? 'default' : 'destructive'}
                    >
                      {proposal.status}
                    </Badge>
                    <span className="font-medium">
                      {formatCurrency(proposal.final_amount || proposal.total_amount || 0)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(proposal.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};