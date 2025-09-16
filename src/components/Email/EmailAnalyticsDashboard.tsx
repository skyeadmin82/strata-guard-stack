import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailCampaign } from '@/hooks/useEmailAutomation';
import { BarChart3, TrendingUp, Users, Mail } from 'lucide-react';

interface EmailAnalyticsDashboardProps {
  campaigns: EmailCampaign[];
}

export const EmailAnalyticsDashboard: React.FC<EmailAnalyticsDashboardProps> = ({ campaigns }) => {
  const totalSent = campaigns.reduce((sum, c) => sum + c.total_sent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.total_opened, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.total_clicked, 0);
  const totalBounced = campaigns.reduce((sum, c) => sum + c.total_bounced, 0);

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Email Analytics</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {campaigns.length} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalOpened.toLocaleString()} opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clickRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalClicked.toLocaleString()} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bounceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalBounced.toLocaleString()} bounces
            </p>
          </CardContent>
        </Card>
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No analytics data</h3>
              <p className="text-muted-foreground">
                Create and send campaigns to see analytics data here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};