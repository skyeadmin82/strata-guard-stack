import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedContract {
  id: string;
  contract_number: string;
  title: string;
  description?: string;
  contract_type: string;
  status: string;
  total_value?: number;
  currency: string;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  auto_renewal: boolean;
  client_id: string;
  tenant_id: string;
  created_at: string;
  clients?: { name: string } | null;
  
  // Enhanced fields
  days_until_renewal?: number;
  monthly_revenue?: number;
  profitability_score?: number;
  renewal_risk?: 'low' | 'medium' | 'high';
}

export interface ContractStats {
  total_contracts: number;
  active_contracts: number;
  total_value: number;
  expiring_soon: number;
  renewal_revenue: number;
  avg_profitability: number;
}

export const useEnhancedContractManagement = () => {
  const [contracts, setContracts] = useState<EnhancedContract[]>([]);
  const [stats, setStats] = useState<ContractStats>({
    total_contracts: 0,
    active_contracts: 0,
    total_value: 0,
    expiring_soon: 0,
    renewal_revenue: 0,
    avg_profitability: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      
      const [contractsResult, clientsResult] = await Promise.all([
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name')
      ]);

      if (contractsResult.error) throw contractsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      // Enhance contracts with calculated fields
      const enhancedContracts = contractsResult.data?.map(contract => {
        const client = clientsResult.data?.find(c => c.id === contract.client_id);
        const today = new Date();
        const renewalDate = contract.renewal_date ? new Date(contract.renewal_date) : null;
        const daysUntilRenewal = renewalDate ? 
          Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        // Calculate monthly revenue (simplified)
        const monthlyRevenue = contract.total_value ? contract.total_value / 12 : 0;
        
        // Simple profitability score (would normally be more complex)
        const profitabilityScore = contract.total_value ? 
          Math.min(100, Math.max(0, (contract.total_value * 0.3) / 1000)) : 0;
        
        // Renewal risk assessment
        let renewalRisk: 'low' | 'medium' | 'high' = 'low';
        if (daysUntilRenewal !== null) {
          if (daysUntilRenewal < 30) renewalRisk = 'high';
          else if (daysUntilRenewal < 90) renewalRisk = 'medium';
        }

        return {
          ...contract,
          clients: client || null,
          days_until_renewal: daysUntilRenewal,
          monthly_revenue: monthlyRevenue,
          profitability_score: profitabilityScore,
          renewal_risk: renewalRisk
        };
      }) || [];

      setContracts(enhancedContracts as EnhancedContract[]);
      
      // Calculate stats
      const totalContracts = enhancedContracts.length;
      const activeContracts = enhancedContracts.filter(c => c.status === 'active').length;
      const totalValue = enhancedContracts.reduce((sum, c) => sum + (c.total_value || 0), 0);
      const expiringSoon = enhancedContracts.filter(c => 
        c.days_until_renewal !== null && c.days_until_renewal < 90
      ).length;
      const renewalRevenue = enhancedContracts
        .filter(c => c.days_until_renewal !== null && c.days_until_renewal < 365)
        .reduce((sum, c) => sum + (c.total_value || 0), 0);
      const avgProfitability = enhancedContracts.length > 0 ?
        enhancedContracts.reduce((sum, c) => sum + (c.profitability_score || 0), 0) / enhancedContracts.length : 0;

      setStats({
        total_contracts: totalContracts,
        active_contracts: activeContracts,
        total_value: totalValue,
        expiring_soon: expiringSoon,
        renewal_revenue: renewalRevenue,
        avg_profitability: avgProfitability
      });

    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contracts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const bulkRenewalAction = useCallback(async (contractIds: string[], months: number = 12) => {
    try {
      const updates = contractIds.map(async (id) => {
        const contract = contracts.find(c => c.id === id);
        if (!contract) return;

        const currentEndDate = new Date(contract.end_date || contract.start_date);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + months);
        
        const newRenewalDate = new Date(newEndDate);
        newRenewalDate.setMonth(newRenewalDate.getMonth() - 3); // 3 months before end

        return supabase
          .from('contracts')
          .update({
            end_date: newEndDate.toISOString().split('T')[0],
            renewal_date: newRenewalDate.toISOString().split('T')[0],
            status: 'active'
          })
          .eq('id', id);
      });

      await Promise.all(updates);
      
      toast({
        title: 'Success',
        description: `${contractIds.length} contracts renewed successfully`,
      });
      
      fetchContracts();
      setSelectedContracts([]);
      
    } catch (error) {
      console.error('Bulk renewal error:', error);
      toast({
        title: 'Error',
        description: 'Failed to renew contracts',
        variant: 'destructive',
      });
    }
  }, [contracts, fetchContracts, toast]);

  const toggleContractSelection = useCallback((contractId: string) => {
    setSelectedContracts(prev => 
      prev.includes(contractId)
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  }, []);

  const selectAllContracts = useCallback(() => {
    setSelectedContracts(contracts.map(c => c.id));
  }, [contracts]);

  const clearSelection = useCallback(() => {
    setSelectedContracts([]);
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return {
    contracts,
    stats,
    loading,
    selectedContracts,
    fetchContracts,
    bulkRenewalAction,
    toggleContractSelection,
    selectAllContracts,
    clearSelection
  };
};