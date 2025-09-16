import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSalesManagement } from "@/hooks/useSalesManagement";
import { SalesAgentCard } from "./SalesAgentCard";
import { SalesLeadCard } from "./SalesLeadCard";
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
  const analytics = getSalesAnalytics();

  if (loading) {
    return <div className="p-6">Loading sales data...</div>;
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground">
            Manage your sales team, leads, and commission tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={refetch}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {analytics.totalDeals} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              Of {analytics.totalAgents} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeLeads}</div>
            <p className="text-xs text-muted-foreground">
              New opportunities to pursue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.wonDeals} won deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Sales Agents</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        {/* Search and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Quick Actions
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
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search' : 'Add your first sales agent to get started'}
                </p>
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
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search' : 'Add your first lead to get started'}
                </p>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="font-semibold">${deal.deal_value?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Probability</p>
                      <p className="font-semibold">{deal.probability}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="font-semibold">${deal.commission_amount?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Close</p>
                      <p className="font-semibold">
                        {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {deals.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No deals yet</h3>
                <p className="text-muted-foreground">Start tracking your sales opportunities</p>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{commission.transaction_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${commission.amount?.toLocaleString()}
                      </p>
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {commissions.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No commission transactions</h3>
                <p className="text-muted-foreground">Commission data will appear here as deals close</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};