import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, BarChart3, Plus, Eye, Edit, Trash, TestTube } from 'lucide-react';
import { useEmailAutomation, EmailTemplate, EmailCampaign, EmailRecipient } from '@/hooks/useEmailAutomation';
import { EmailTemplateDialog } from '@/components/Email/EmailTemplateDialog';
import { EmailCampaignDialog } from '@/components/Email/EmailCampaignDialog';
import { EmailRecipientDialog } from '@/components/Email/EmailRecipientDialog';
import { EmailAnalyticsDashboard } from '@/components/Email/EmailAnalyticsDashboard';

export const EmailMarketingPage: React.FC = () => {
  const { 
    getTemplates, 
    getCampaigns, 
    getRecipients,
    isLoading 
  } = useEmailAutomation();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);

  const loadData = async () => {
    try {
      const [templatesData, campaignsData, recipientsData] = await Promise.all([
        getTemplates(),
        getCampaigns(),
        getRecipients()
      ]);
      setTemplates(templatesData as EmailTemplate[]);
      setCampaigns(campaignsData as EmailCampaign[]);
      setRecipients(recipientsData as EmailRecipient[]);
    } catch (error) {
      console.error('Error loading email data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowTemplateDialog(true);
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowCampaignDialog(true);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setShowCampaignDialog(true);
  };

  const handleDialogClose = () => {
    setShowTemplateDialog(false);
    setShowCampaignDialog(false);
    setShowRecipientDialog(false);
    setEditingTemplate(null);
    setEditingCampaign(null);
    loadData(); // Refresh data after changes
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'sent':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'sending':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Email Marketing</h1>
              <p className="text-muted-foreground">
                Manage email campaigns, templates, and track performance with SMTP2GO integration.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
              <Button onClick={handleCreateCampaign} variant="outline">
                <Send className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{templates.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {templates.filter(t => t.status === 'active').length} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    <Send className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaigns.filter(c => ['sending', 'scheduled'].includes(c.status)).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {campaigns.length} total campaigns
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{recipients.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {recipients.filter(r => r.status === 'active').length} active subscribers
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sends</CardTitle>
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {campaigns.reduce((sum, c) => sum + c.total_sent, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {campaigns.reduce((sum, c) => sum + c.total_opened, 0)} opens
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Campaigns</CardTitle>
                    <CardDescription>Your latest email campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {campaigns.slice(0, 5).map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {campaign.total_sent} sent • {campaign.total_opened} opened
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                      ))}
                      {campaigns.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No campaigns yet. Create your first campaign!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Templates</CardTitle>
                    <CardDescription>Your available email templates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {templates.slice(0, 5).map((template) => (
                        <div key={template.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.category || 'General'}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(template.status)}>
                            {template.status}
                          </Badge>
                        </div>
                      ))}
                      {templates.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No templates yet. Create your first template!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Email Templates</h2>
                <Button onClick={handleCreateTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(template.status)}>
                          {template.status}
                        </Badge>
                      </div>
                      {template.description && (
                        <CardDescription>{template.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Subject: {template.subject_template}
                        </p>
                        {template.category && (
                          <p className="text-sm text-muted-foreground">
                            Category: {template.category}
                          </p>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline">
                            <TestTube className="w-3 h-3 mr-1" />
                            Test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {templates.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No email templates</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first email template to get started with email marketing.
                        </p>
                        <Button onClick={handleCreateTemplate}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Email Campaigns</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowRecipientDialog(true)} variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Recipients
                  </Button>
                  <Button onClick={handleCreateCampaign}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          {campaign.description && (
                            <CardDescription>{campaign.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCampaign(campaign)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm font-medium">Sent</p>
                          <p className="text-2xl font-bold">{campaign.total_sent}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Delivered</p>
                          <p className="text-2xl font-bold">{campaign.total_delivered}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Opened</p>
                          <p className="text-2xl font-bold">{campaign.total_opened}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.total_sent > 0 ? Math.round((campaign.total_opened / campaign.total_sent) * 100) : 0}% rate
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Clicked</p>
                          <p className="text-2xl font-bold">{campaign.total_clicked}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.total_sent > 0 ? Math.round((campaign.total_clicked / campaign.total_sent) * 100) : 0}% rate
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {campaigns.length === 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first email campaign to start reaching your audience.
                        </p>
                        <Button onClick={handleCreateCampaign}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Campaign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Email Recipients</h2>
                <Button onClick={() => setShowRecipientDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recipients
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{recipient.email}</p>
                            <Badge variant={getStatusBadgeVariant(recipient.status)}>
                              {recipient.status}
                            </Badge>
                          </div>
                          {(recipient.first_name || recipient.last_name) && (
                            <p className="text-sm text-muted-foreground">
                              {recipient.first_name} {recipient.last_name}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{recipient.total_sends} sends</span>
                            <span>{recipient.total_opens} opens</span>
                            <span>{recipient.total_clicks} clicks</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {recipient.tags && recipient.tags.length > 0 && (
                            <div className="flex gap-1">
                              {recipient.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {recipient.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{recipient.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {recipients.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No recipients yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add email recipients to start sending campaigns.
                        </p>
                        <Button onClick={() => setShowRecipientDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Recipients
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <EmailAnalyticsDashboard campaigns={campaigns} />
            </TabsContent>
          </Tabs>

          {/* Dialogs */}
          <EmailTemplateDialog
            open={showTemplateDialog}
            onOpenChange={setShowTemplateDialog}
            template={editingTemplate}
            onClose={handleDialogClose}
          />

          <EmailCampaignDialog
            open={showCampaignDialog}
            onOpenChange={setShowCampaignDialog}
            campaign={editingCampaign}
            templates={templates}
            onClose={handleDialogClose}
          />

          <EmailRecipientDialog
            open={showRecipientDialog}
            onOpenChange={setShowRecipientDialog}
            onClose={handleDialogClose}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};