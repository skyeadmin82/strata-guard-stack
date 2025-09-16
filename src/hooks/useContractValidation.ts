import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ContractExtended, ContractTemplate, FormValidationError } from '@/types/database';

interface ContractValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
  warnings: string[];
}

interface ContractData {
  name: string;
  client_id: string;
  contract_type: 'msp' | 'project' | 'support' | 'consulting';
  start_date: string;
  end_date?: string;
  value?: number;
  currency: string;
  billing_frequency?: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  payment_terms: 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt';
  auto_renewal: boolean;
  template_id?: string;
}

export const useContractValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { user } = useAuth();

  const validateRequiredFields = useCallback((data: Partial<ContractData>, template?: ContractTemplate): FormValidationError[] => {
    const errors: FormValidationError[] = [];
    
    // Basic required fields
    if (!data.name?.trim()) {
      errors.push({ field: 'name', message: 'Contract name is required' });
    }
    
    if (!data.client_id) {
      errors.push({ field: 'client_id', message: 'Client selection is required' });
    }
    
    if (!data.contract_type) {
      errors.push({ field: 'contract_type', message: 'Contract type is required' });
    }
    
    if (!data.start_date) {
      errors.push({ field: 'start_date', message: 'Start date is required' });
    }
    
    if (!data.currency) {
      errors.push({ field: 'currency', message: 'Currency is required' });
    }

    // Template-specific required fields
    if (template?.required_fields) {
      template.required_fields.forEach(field => {
        if (!data[field as keyof ContractData]) {
          errors.push({ field, message: `${field.replace('_', ' ').toUpperCase()} is required by template` });
        }
      });
    }

    return errors;
  }, []);

  const validateDateRange = useCallback((startDate: string, endDate?: string): FormValidationError[] => {
    const errors: FormValidationError[] = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const now = new Date();

    if (start < now) {
      errors.push({ field: 'start_date', message: 'Start date cannot be in the past' });
    }

    if (end && end <= start) {
      errors.push({ field: 'end_date', message: 'End date must be after start date' });
    }

    return errors;
  }, []);

  const checkConflicts = useCallback(async (data: ContractData): Promise<FormValidationError[]> => {
    try {
      // Simplified conflict checking - would normally check database
      const errors: FormValidationError[] = [];
      
      // Simulate basic conflict detection
      if (data.name.toLowerCase().includes('conflict')) {
        errors.push({
          field: 'name',
          message: 'Contract name conflicts with existing contract'
        });
      }

      return errors;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  }, []);

  const validateContract = useCallback(async (data: ContractData): Promise<ContractValidationResult> => {
    setIsValidating(true);
    
    try {
      let template: ContractTemplate | null = null;
      
      // Simulate template fetching - would normally fetch from database
      if (data.template_id) {
        console.log(`Fetching template ${data.template_id}`);
        // template would be fetched here
      }

      // Run all validations
      const requiredFieldErrors = validateRequiredFields(data, template || undefined);
      const dateErrors = validateDateRange(data.start_date, data.end_date);
      const conflictErrors = await checkConflicts(data);

      const allErrors = [...requiredFieldErrors, ...dateErrors, ...conflictErrors];
      const warnings: string[] = [];

      // Add warnings
      if (!data.end_date && !data.auto_renewal) {
        warnings.push('Consider setting an end date or enabling auto-renewal');
      }

      if (data.value && data.value < 1000) {
        warnings.push('Contract value seems low - please verify');
      }

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings
      };

    } catch (error) {
      console.error('Contract validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate contract. Please try again.",
        variant: "destructive",
      });

      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed - please try again' }],
        warnings: []
      };
    } finally {
      setIsValidating(false);
    }
  }, [validateRequiredFields, validateDateRange, checkConflicts]);

  const validateContractUpdate = useCallback(async (
    contractId: string, 
    updates: Partial<ContractData>
  ): Promise<ContractValidationResult> => {
    setIsValidating(true);

    try {
      // Simulate fetching current contract - would normally fetch from database
      console.log(`Validating updates for contract ${contractId}`, updates);

      // Simulate merged data - would normally merge with existing contract
      const mergedData: ContractData = {
        name: updates.name || 'Existing Contract',
        client_id: updates.client_id || 'existing-client-id',
        contract_type: updates.contract_type || 'msp',
        start_date: updates.start_date || new Date().toISOString().split('T')[0],
        end_date: updates.end_date,
        value: updates.value,
        currency: updates.currency || 'USD',
        billing_frequency: updates.billing_frequency || 'monthly',
        payment_terms: updates.payment_terms || 'net_30',
        auto_renewal: updates.auto_renewal !== undefined ? updates.auto_renewal : false,
        template_id: updates.template_id
      };

      return await validateContract(mergedData);

    } catch (error) {
      console.error('Contract update validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Failed to validate contract updates' }],
        warnings: []
      };
    } finally {
      setIsValidating(false);
    }
  }, [validateContract]);

  return {
    validateContract,
    validateContractUpdate,
    validateRequiredFields,
    validateDateRange,
    checkConflicts,
    isValidating
  };
};