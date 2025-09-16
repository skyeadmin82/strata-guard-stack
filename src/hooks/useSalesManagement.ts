import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSalesManagement = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all sales data
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      const [agentsResponse, leadsResponse, dealsResponse, commissionsResponse] = await Promise.all([
        supabase.from('sales_agents').select('*').order('created_at', { ascending: false }),
        supabase.from('sales_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('sales_deals').select('*').order('created_at', { ascending: false }),
        supabase.from('commission_transactions').select('*').order('created_at', { ascending: false })
      ]);

      if (agentsResponse.error) throw agentsResponse.error;
      if (leadsResponse.error) throw leadsResponse.error;
      if (dealsResponse.error) throw dealsResponse.error;
      if (commissionsResponse.error) throw commissionsResponse.error;

      setAgents(agentsResponse.data || []);
      setLeads(leadsResponse.data || []);
      setDeals(dealsResponse.data || []);
      setCommissions(commissionsResponse.data || []);

    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Agent management
  const createAgent = async (agentData: any) => {
    try {
      const { data, error } = await supabase
        .from('sales_agents')
        .insert([agentData])
        .select()
        .single();

      if (error) throw error;

      setAgents(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Sales agent created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "Failed to create sales agent",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAgent = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('sales_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAgents(prev => prev.map(agent => agent.id === id ? data : agent));
      toast({
        title: "Success",
        description: "Sales agent updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Error",
        description: "Failed to update sales agent",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Lead management
  const createLead = async (leadData: any) => {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateLead = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => prev.map(lead => lead.id === id ? data : lead));
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
      throw error;
    }
  };

  const assignLead = async (leadId: string, agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .update({ 
          assigned_agent_id: agentId,  
          assigned_at: new Date().toISOString() 
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => prev.map(lead => lead.id === leadId ? data : lead));
      toast({
        title: "Success",
        description: "Lead assigned successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: "Error",
        description: "Failed to assign lead",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deal management
  const createDeal = async (dealData: any) => {
    try {
      const { data, error } = await supabase
        .from('sales_deals')
        .insert([dealData])
        .select()
        .single();

      if (error) throw error;

      setDeals(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Deal created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDeal = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('sales_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDeals(prev => prev.map(deal => deal.id === id ? data : deal));
      toast({
        title: "Success",
        description: "Deal updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Commission management
  const createCommissionTransaction = async (commissionData: any) => {
    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .insert([commissionData])
        .select()
        .single();

      if (error) throw error;

      setCommissions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Commission transaction created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating commission:', error);
      toast({
        title: "Error",
        description: "Failed to create commission transaction",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Analytics and reporting
  const getSalesAnalytics = () => {
    const totalRevenue = deals.reduce((sum: number, deal: any) => sum + (deal.deal_value || 0), 0);
    const totalCommissions = commissions.reduce((sum: number, comm: any) => sum + (comm.amount || 0), 0);
    const activeLeads = leads.filter((lead: any) => ['new', 'contacted', 'qualified'].includes(lead.status)).length;
    const wonDeals = deals.filter((deal: any) => deal.stage === 'closed_won').length;
    const totalDeals = deals.length;
    const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    return {
      totalRevenue,
      totalCommissions,
      activeLeads,
      wonDeals,
      totalDeals,
      conversionRate,
      activeAgents: agents.filter((agent: any) => agent.status === 'active').length,
      totalAgents: agents.length
    };
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  return {
    // Data
    agents,
    leads,
    deals,
    commissions,
    loading,
    
    // Agent functions
    createAgent,
    updateAgent,
    
    // Lead functions
    createLead,
    updateLead,
    assignLead,
    
    // Deal functions
    createDeal,
    updateDeal,
    
    // Commission functions
    createCommissionTransaction,
    
    // Analytics
    getSalesAnalytics,
    
    // Refresh
    refetch: fetchSalesData
  };
};