import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Users, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Plus,
  Send,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';
import { EmailTemplateDialog } from './EmailTemplateDialog';
import { EmailCampaignDialog } from './EmailCampaignDialog';

export const EmailMarketingDashboard: React.FC = () => {
  const { 
    getTemplates, 
    getCampaigns, 
    getRecipients,
    isLoading 
  } = useEmailAutomation();
  
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalSent: 12500,
    openRate: 24.8,
    clickRate: 3.2,
    subscriberCount: 2840
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, campaignsData, recipientsData] = await Promise.all([
        getTemplates(),
        getCampaigns(),
        getRecipients()
      ]);
      
      setTemplates(templatesData);
      setCampaigns(campaignsData);
      setRecipients(recipientsData);
    } catch (error) {
      console.error('Error loading email marketing data:', error);
    }
  };

  // Remove mockRecentCampaigns - use real data from database

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-foreground">Email Marketing</h1>
          <p className="text-muted-foreground">
            Create, send, and analyze email campaigns to engage your clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={() => setShowCampaignDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.2%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> improvement
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.clickRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-0.3%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.subscriberCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+45</span> new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Marketing Tabs */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Campaigns</h3>
            <Button onClick={() => setShowCampaignDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {campaigns.slice(0, 3).map((campaign, index) => (
                  <div 
                    key={campaign.id} 
                    className={`flex items-center justify-between p-4 ${
                      index < 2 ? 'border-b' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{campaign.created_at ? format(new Date(campaign.created_at), 'MMM dd') : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{campaign.total_sent || 0}</p>
                          <p className="text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{campaign.total_opened || 0}</p>
                          <p className="text-muted-foreground">Opens</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{campaign.total_clicked || 0}</p>
                          <p className="text-muted-foreground">Clicks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Email Templates</h3>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Newsletter Template {i}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Professional newsletter template for client updates and company news.
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Active</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="recipients" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Email Recipients</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Recipients
            </Button>
          </div>
          
          <Card>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Recipient management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mr-2" />
                  Performance charts coming soon
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Best Send Time</span>
                    <span className="font-medium">10:00 AM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Top Performing Day</span>
                    <span className="font-medium">Tuesday</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Email Length</span>
                    <span className="font-medium">650 words</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EmailTemplateDialog 
        open={showTemplateDialog} 
        onClose={() => setShowTemplateDialog(false)}
        onOpenChange={setShowTemplateDialog}
      />
      
      <EmailCampaignDialog 
        open={showCampaignDialog} 
        onClose={() => setShowCampaignDialog(false)}
        onOpenChange={setShowCampaignDialog}
        templates={[]}
      />
    </div>
  );
};