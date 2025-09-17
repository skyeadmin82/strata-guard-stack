import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSalesManagement } from "@/hooks/useSalesManagement";
import { SalesAgentCard } from "./SalesAgentCard";
import { SalesLeadCard } from "./SalesLeadCard";
import { SalesErrorBoundary } from "./SalesErrorBoundary";
import { SalesExportManager } from "./SalesExportManager";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  Target,
  Calendar,
  Plus,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

export const SalesDashboard = () => {
  const {
    agents,
    leads,
    deals,
    commissions,
    loading,
    getSalesAnalytics,
    createAgent,
    createLead,
    assignLead,
    refetch
  } = useSalesManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('agents');
  const analytics = getSalesAnalytics();

  // Enhanced loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const filteredAgents = agents.filter((agent: any) =>
    `${agent.first_name} ${agent.last_name} ${agent.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter((lead: any) =>
    `${lead.company_name} ${lead.contact_name || ''} ${lead.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <SalesErrorBoundary>
      <div className="p-6 space-y-6 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
            <p className="text-muted-foreground">
              Manage your sales team, leads, and commission tracking
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            <SalesExportManager 
              data={{ agents, leads, deals, commissions }}
              activeTab={activeTab}
            />
            <Button onClick={refetch}>
              Refresh Data
            </Button>
          </div>
        </div>

      {/* Enhanced Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${analytics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {analytics.totalDeals} deals • +12.5% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              Of {analytics.totalAgents} total • ${Math.round(analytics.totalRevenue / Math.max(analytics.activeAgents, 1)).toLocaleString()} avg per agent
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.activeLeads}</div>
            <p className="text-xs text-muted-foreground">
              Pipeline value: ${Math.round(leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.wonDeals} won deals • Target: 25%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents" className="relative">
            Sales Agents
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {agents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="leads" className="relative">
            Leads
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {leads.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deals" className="relative">
            Deals
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {deals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="relative">
            Commissions
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {commissions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Search and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
            <SalesExportManager 
              data={{ agents, leads, deals, commissions }}
              activeTab={activeTab}
            />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        {/* Sales Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sales Agents ({filteredAgents.length})</h2>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent: any) => (
              <SalesAgentCard
                key={agent.id}
                agent={agent}
                onEdit={(agent) => console.log('Edit agent:', agent)}
                onViewDetails={(agent) => console.log('View agent:', agent)}
              />
            ))}
            {filteredAgents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No agents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search' : 'Add your first sales agent to get started'}
                </p>
                {!searchTerm && (
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Sales Agent
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Sales Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sales Leads ({filteredLeads.length})</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead: any) => (
              <SalesLeadCard
                key={lead.id}
                lead={lead}
                agents={agents}
                onAssign={assignLead}
                onEdit={(lead) => console.log('Edit lead:', lead)}
                onConvert={(lead) => console.log('Convert lead:', lead)}
              />
            ))}
            {filteredLeads.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No leads found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search' : 'Add your first lead to get started'}
                </p>
                {!searchTerm && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sales Deals ({deals.length})</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {deals.map((deal: any) => (
              <Card key={deal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{deal.deal_name}</CardTitle>
                    <Badge>{deal.stage}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-semibold text-lg">${deal.deal_value?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Probability</p>
                        <p className="font-semibold text-lg">{deal.probability}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Commission</p>
                        <p className="font-semibold text-lg text-green-600">${deal.commission_amount?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Close</p>
                        <p className="font-semibold">
                          {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'TBD'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Probability Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Deal Progress</span>
                        <span>{deal.probability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${deal.probability}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Deal Type & Source */}
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{deal.deal_type || 'Standard Deal'}</Badge>
                      <span className="text-muted-foreground">
                        Created {new Date(deal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {deals.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No deals yet</h3>
                <p className="text-muted-foreground mb-4">Start tracking your sales opportunities</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deal
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Commission Transactions ({commissions.length})</h2>
            <div className="text-sm text-muted-foreground">
              Total: ${analytics.totalCommissions.toLocaleString()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {commissions.map((commission: any) => (
              <Card key={commission.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold capitalize">{commission.transaction_type?.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(commission.created_at).toLocaleDateString()}
                          {commission.notes && ` • ${commission.notes}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-green-600">
                          ${commission.amount?.toLocaleString()}
                        </p>
                        <Badge variant={
                          commission.status === 'paid' ? 'default' : 
                          commission.status === 'approved' ? 'secondary' :
                          commission.status === 'pending' ? 'outline' : 'secondary'
                        }>
                          {commission.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Additional Commission Details */}
                    {(commission.rate || commission.payment_date) && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          {commission.rate && (
                            <span>Rate: {commission.rate}%</span>
                          )}
                          {commission.payment_date && (
                            <span>
                              Pay Date: {new Date(commission.payment_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {commissions.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No commission transactions</h3>
                <p className="text-muted-foreground mb-4">Commission data will appear here as deals close</p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Manual Commission Entry
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </SalesErrorBoundary>
  );
};