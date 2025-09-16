import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PricingRule, ContractPricingHistory } from '@/types/database';

interface PricingCalculation {
  basePrice: number;
  discountAmount: number;
  taxAmount: number;
  finalPrice: number;
  currency: string;
  breakdown: Record<string, any>;
  errors: string[];
  warnings: string[];
}

interface PricingParams {
  baseAmount: number;
  currency: string;
  quantity?: number;
  discountRules?: Record<string, any>;
  taxRules?: Record<string, any>;
  clientType?: string;
  contractTerm?: number;
  volume?: number;
}

export const usePricingEngine = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingHistory, setPricingHistory] = useState<ContractPricingHistory[]>([]);
  const { user } = useAuth();

  const validateCurrency = useCallback((currency: string): boolean => {
    const validCurrencies = ['USD', 'EUR', 'GBP'];
    return validCurrencies.includes(currency);
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, []);

  const calculateDiscount = useCallback((
    baseAmount: number,
    discountRules: Record<string, any>
  ): { amount: number; details: Record<string, any> } => {
    let discountAmount = 0;
    const details: Record<string, any> = {};

    try {
      // Percentage discount
      if (discountRules.percentage && discountRules.percentage > 0) {
        const percentageDiscount = baseAmount * (discountRules.percentage / 100);
        discountAmount += percentageDiscount;
        details.percentage = { rate: discountRules.percentage, amount: percentageDiscount };
      }

      // Fixed amount discount
      if (discountRules.fixed && discountRules.fixed > 0) {
        discountAmount += discountRules.fixed;
        details.fixed = discountRules.fixed;
      }

      // Volume discount
      if (discountRules.volume && discountRules.quantity) {
        const volumeRules = discountRules.volume;
        const quantity = discountRules.quantity;
        
        for (const tier of volumeRules) {
          if (quantity >= tier.minQuantity && quantity <= (tier.maxQuantity || Infinity)) {
            const volumeDiscount = baseAmount * (tier.discount / 100);
            discountAmount += volumeDiscount;
            details.volume = { tier, amount: volumeDiscount };
            break;
          }
        }
      }

      // Ensure discount doesn't exceed base amount
      discountAmount = Math.min(discountAmount, baseAmount * 0.95); // Max 95% discount

    } catch (error) {
      console.error('Discount calculation error:', error);
    }

    return { amount: discountAmount, details };
  }, []);

  const calculateTax = useCallback((
    amount: number,
    taxRules: Record<string, any>
  ): { amount: number; details: Record<string, any> } => {
    let taxAmount = 0;
    const details: Record<string, any> = {};

    try {
      // Standard tax rate
      if (taxRules.rate && taxRules.rate > 0) {
        taxAmount = amount * (taxRules.rate / 100);
        details.standard = { rate: taxRules.rate, amount: taxAmount };
      }

      // Additional tax rules (VAT, state tax, etc.)
      if (taxRules.additional) {
        for (const [taxType, taxRule] of Object.entries(taxRules.additional)) {
          const additionalTax = amount * ((taxRule as any).rate / 100);
          taxAmount += additionalTax;
          details[taxType] = { rate: (taxRule as any).rate, amount: additionalTax };
        }
      }

    } catch (error) {
      console.error('Tax calculation error:', error);
    }

    return { amount: taxAmount, details };
  }, []);

  const calculatePricing = useCallback(async (
    params: PricingParams,
    pricingRuleId?: string
  ): Promise<PricingCalculation> => {
    setIsCalculating(true);
    
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate inputs
      if (!params.baseAmount || params.baseAmount <= 0) {
        errors.push('Base amount must be greater than 0');
      }

      if (!validateCurrency(params.currency)) {
        errors.push('Invalid currency code');
      }

      if (errors.length > 0) {
        return {
          basePrice: 0,
          discountAmount: 0,
          taxAmount: 0,
          finalPrice: 0,
          currency: params.currency,
          breakdown: {},
          errors,
          warnings
        };
      }

      // Simulate pricing rule fetching
      let pricingRule: PricingRule | null = null;
      if (pricingRuleId) {
        console.log(`Fetching pricing rule ${pricingRuleId}`);
        // Would normally fetch from database
      }

      let basePrice = params.baseAmount;
      let discountAmount = 0;
      let taxAmount = 0;

      // Apply quantity multiplier
      if (params.quantity && params.quantity > 0) {
        basePrice *= params.quantity;
      }

      // Calculate discounts
      const discountRules = pricingRule?.discount_rules || params.discountRules || {};
      const discountCalc = calculateDiscount(basePrice, discountRules);
      discountAmount = discountCalc.amount;

      // Calculate tax on discounted amount
      const taxableAmount = basePrice - discountAmount;
      const taxRules = pricingRule?.tax_rules || params.taxRules || {};
      const taxCalc = calculateTax(taxableAmount, taxRules);
      taxAmount = taxCalc.amount;

      const finalPrice = taxableAmount + taxAmount;

      // Validation checks
      if (finalPrice < 0) {
        errors.push('Final price cannot be negative');
      }

      if (discountAmount > basePrice * 0.95) {
        warnings.push('Discount exceeds 95% of base price');
      }

      return {
        basePrice,
        discountAmount,
        taxAmount,
        finalPrice,
        currency: params.currency,
        breakdown: {
          base: basePrice,
          discount: discountCalc.details,
          tax: taxCalc.details,
          final: finalPrice
        },
        errors,
        warnings
      };

    } catch (error) {
      console.error('Pricing calculation error:', error);
      return {
        basePrice: 0,
        discountAmount: 0,
        taxAmount: 0,
        finalPrice: 0,
        currency: params.currency,
        breakdown: {},
        errors: ['Calculation failed - please try again'],
        warnings: []
      };
    } finally {
      setIsCalculating(false);
    }
  }, [validateCurrency, calculateDiscount, calculateTax]);

  const savePricingHistory = useCallback(async (
    contractId: string,
    changeType: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    calculationDetails: Record<string, any>,
    changeReason?: string
  ): Promise<void> => {
    try {
      // Simulate saving pricing history
      console.log('Saving pricing history:', {
        contractId,
        changeType,
        oldValues,
        newValues,
        calculationDetails,
        changeReason,
        timestamp: new Date().toISOString()
      });

      // Update local history
      const newHistoryEntry: ContractPricingHistory = {
        id: `history_${Date.now()}`,
        contract_id: contractId,
        tenant_id: 'demo-tenant',
        change_type: changeType,
        old_values: oldValues,
        new_values: newValues,
        change_reason: changeReason,
        calculation_details: calculationDetails,
        changed_by: 'current-user',
        changed_at: new Date().toISOString()
      };

      setPricingHistory(prev => [newHistoryEntry, ...prev]);

    } catch (error) {
      console.error('Failed to save pricing history:', error);
      toast({
        title: "Warning",
        description: "Price calculation saved but history tracking failed",
        variant: "destructive",
      });
    }
  }, []);

  const rollbackPricing = useCallback(async (historyId: string): Promise<boolean> => {
    try {
      // Simulate rollback functionality
      console.log(`Rolling back pricing for history entry ${historyId}`);

      // Find the history entry to rollback
      const historyEntry = pricingHistory.find(h => h.id === historyId);
      if (!historyEntry) {
        toast({
          title: "Error",
          description: "History entry not found",
          variant: "destructive",
        });
        return false;
      }

      // Apply rollback
      await savePricingHistory(
        historyEntry.contract_id,
        'rollback',
        historyEntry.new_values,
        historyEntry.old_values,
        { rollback_from: historyId },
        'Manual rollback'
      );

      toast({
        title: "Success",
        description: "Pricing rolled back successfully",
      });

      return true;

    } catch (error) {
      console.error('Rollback error:', error);
      toast({
        title: "Error",
        description: "Failed to rollback pricing",
        variant: "destructive",
      });
      return false;
    }
  }, [pricingHistory, savePricingHistory]);

  const fetchPricingHistory = useCallback(async (contractId: string): Promise<void> => {
    try {
      // Simulate fetching pricing history
      console.log(`Fetching pricing history for contract ${contractId}`);
      
      // Would normally fetch from database
      setPricingHistory([]);

    } catch (error) {
      console.error('Failed to fetch pricing history:', error);
    }
  }, []);

  return {
    calculatePricing,
    savePricingHistory,
    rollbackPricing,
    fetchPricingHistory,
    formatCurrency,
    validateCurrency,
    pricingHistory,
    isCalculating
  };
};