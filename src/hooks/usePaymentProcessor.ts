import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PaymentTransaction } from '@/types/database';

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface PaymentValidation {
  isValid: boolean;
  errors: Record<string, string>;
  cardType?: string;
  isDemo?: boolean;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  errorCode?: string;
  requiresRetry?: boolean;
}

interface PCBancardConfig {
  merchantId: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  webhookUrl?: string;
}

export const usePaymentProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<PaymentTransaction | null>(null);

  // Credit card validation patterns
  const cardPatterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    pcbancard: /^9[0-9]{15}$/ // Custom pattern for PCBancard
  };

  const validateCreditCard = useCallback((paymentForm: PaymentForm): PaymentValidation => {
    const errors: Record<string, string> = {};
    let cardType: string | undefined;
    let isDemo = false;

    // Clean card number
    const cardNumber = paymentForm.cardNumber.replace(/\s/g, '');

    // Card number validation
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      errors.cardNumber = 'Invalid card number length';
    } else {
      // Check card type
      for (const [type, pattern] of Object.entries(cardPatterns)) {
        if (pattern.test(cardNumber)) {
          cardType = type;
          break;
        }
      }

      if (!cardType) {
        errors.cardNumber = 'Unsupported card type';
      }

      // Demo card numbers (for testing)
      const demoCards = [
        '4111111111111111', // Visa test card
        '5555555555554444', // Mastercard test card
        '378282246310005',  // Amex test card
        '9000000000000001'  // PCBancard demo card
      ];

      if (demoCards.includes(cardNumber)) {
        isDemo = true;
      }

      // Luhn algorithm validation (except for demo cards)
      if (!isDemo && !isValidLuhn(cardNumber)) {
        errors.cardNumber = 'Invalid card number';
      }
    }

    // Expiry date validation
    if (!paymentForm.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else {
      const expiryMatch = paymentForm.expiryDate.match(/^(\d{2})\/(\d{2,4})$/);
      if (!expiryMatch) {
        errors.expiryDate = 'Invalid expiry format (MM/YY or MM/YYYY)';
      } else {
        const month = parseInt(expiryMatch[1]);
        let year = parseInt(expiryMatch[2]);
        
        if (year < 100) {
          year += 2000; // Convert YY to YYYY
        }

        if (month < 1 || month > 12) {
          errors.expiryDate = 'Invalid month';
        } else {
          const expiry = new Date(year, month - 1);
          const now = new Date();
          
          if (expiry < now) {
            errors.expiryDate = 'Card has expired';
          }
        }
      }
    }

    // CVV validation
    if (!paymentForm.cvv) {
      errors.cvv = 'Security code is required';
    } else {
      const cvvLength = cardType === 'amex' ? 4 : 3;
      if (paymentForm.cvv.length !== cvvLength) {
        errors.cvv = `Security code must be ${cvvLength} digits`;
      } else if (!/^\d+$/.test(paymentForm.cvv)) {
        errors.cvv = 'Security code must contain only numbers';
      }
    }

    // Cardholder name validation
    if (!paymentForm.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    } else if (paymentForm.cardholderName.trim().length < 2) {
      errors.cardholderName = 'Cardholder name too short';
    } else if (!/^[a-zA-Z\s-'\.]+$/.test(paymentForm.cardholderName)) {
      errors.cardholderName = 'Invalid characters in cardholder name';
    }

    // Billing address validation
    const { billingAddress } = paymentForm;
    
    if (!billingAddress.street.trim()) {
      errors.billingStreet = 'Billing address is required';
    }

    if (!billingAddress.city.trim()) {
      errors.billingCity = 'City is required';
    }

    if (!billingAddress.zipCode.trim()) {
      errors.billingZipCode = 'ZIP code is required';
    } else if (billingAddress.country === 'US') {
      // US ZIP code validation
      if (!/^\d{5}(-\d{4})?$/.test(billingAddress.zipCode)) {
        errors.billingZipCode = 'Invalid US ZIP code format';
      }
    }

    if (!billingAddress.country) {
      errors.billingCountry = 'Country is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      cardType,
      isDemo
    };
  }, []);

  // Luhn algorithm for credit card validation
  const isValidLuhn = useCallback((cardNumber: string): boolean => {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }, []);

  const processPayment = useCallback(async (
    proposalId: string,
    amount: number,
    paymentForm: PaymentForm,
    pcbancardConfig?: PCBancardConfig
  ): Promise<PaymentResult> => {
    setIsProcessing(true);

    try {
      // Validate payment form first
      const validation = validateCreditCard(paymentForm);
      
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return {
          success: false,
          error: firstError,
          errorCode: 'VALIDATION_ERROR'
        };
      }

      // Get client IP and user agent for audit trail
      const userAgent = navigator.userAgent;
      const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
      const clientIp = ipResponse ? (await ipResponse.json()).ip : null;

      // Create payment transaction record
      const transactionData = {
        tenant_id: 'demo-tenant-id',
        proposal_id: proposalId,
        client_id: 'demo-client-id', // Would get from proposal
        transaction_id: `TXN-${Date.now()}`,
        payment_method: validation.cardType === 'pcbancard' ? 'pcbancard' as const : 'credit_card' as const,
        payment_processor: validation.cardType === 'pcbancard' ? 'pcbancard' : 'stripe',
        amount: amount,
        currency: 'USD' as const,
        status: 'pending' as const,
        card_last_four: paymentForm.cardNumber.slice(-4),
        card_brand: validation.cardType,
        audit_trail: {
          ip_address: clientIp,
          user_agent: userAgent,
          validation_result: {
            is_demo: validation.isDemo,
            card_type: validation.cardType
          },
          billing_address: paymentForm.billingAddress
        },
        ip_address: clientIp,
        user_agent: userAgent
      };

      const { data: transaction, error: createError } = await supabase
        .from('payment_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (createError) throw createError;

      setCurrentTransaction(transaction as PaymentTransaction);

      // Process payment based on card type and demo mode
      if (validation.isDemo) {
        // Demo mode - simulate payment processing
        const result = await simulatePaymentProcessing(transaction.id, validation.cardType!);
        return result;
      } else if (validation.cardType === 'pcbancard' && pcbancardConfig) {
        // PCBancard processing
        const result = await processPCBancardPayment(transaction.id, paymentForm, pcbancardConfig);
        return result;
      } else {
        // Standard credit card processing (would integrate with actual payment processor)
        const result = await processStandardPayment(transaction.id, paymentForm);
        return result;
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Log payment error
      await supabase
        .from('error_logs')
        .insert({
          tenant_id: 'demo-tenant-id',
          error_type: 'payment_processing_failed',
          error_message: error.message,
          context: {
            proposal_id: proposalId,
            amount,
            payment_method: 'credit_card'
          }
        });

      return {
        success: false,
        error: 'Payment processing failed. Please try again.',
        errorCode: 'PROCESSING_ERROR',
        requiresRetry: true
      };
    } finally {
      setIsProcessing(false);
    }
  }, [validateCreditCard]);

  const simulatePaymentProcessing = useCallback(async (
    transactionId: string,
    cardType: string
  ): Promise<PaymentResult> => {
    try {
      // Update transaction to processing
      await supabase
        .from('payment_transactions')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate different outcomes for demo
      const outcomes = {
        '4111111111111111': 'success',    // Visa - success
        '5555555555554444': 'success',    // Mastercard - success
        '378282246310005': 'declined',    // Amex - declined for demo
        '9000000000000001': 'success'     // PCBancard - success
      };

      const cardNumbers = Object.keys(outcomes);
      const outcome = outcomes[cardNumbers.find(num => cardType === 'visa' || cardType === 'mastercard' || cardType === 'amex' || cardType === 'pcbancard') || cardNumbers[0]];

      if (outcome === 'success') {
        // Update transaction to completed
        await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            external_transaction_id: `DEMO-${Date.now()}`
          })
          .eq('id', transactionId);

        toast({
          title: "Payment Successful",
          description: "Payment has been processed successfully.",
        });

        return {
          success: true,
          transactionId
        };
      } else {
        // Update transaction to failed
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            error_code: 'CARD_DECLINED',
            error_message: 'Card was declined by the issuing bank',
            error_details: { reason: 'insufficient_funds', demo_mode: true }
          })
          .eq('id', transactionId);

        return {
          success: false,
          error: 'Card was declined. Please try a different card.',
          errorCode: 'CARD_DECLINED',
          requiresRetry: true
        };
      }

    } catch (error) {
      console.error('Demo payment processing error:', error);
      return {
        success: false,
        error: 'Simulation failed. Please try again.',
        errorCode: 'SIMULATION_ERROR'
      };
    }
  }, []);

  const processPCBancardPayment = useCallback(async (
    transactionId: string,
    paymentForm: PaymentForm,
    config: PCBancardConfig
  ): Promise<PaymentResult> => {
    try {
      // Update transaction to processing
      await supabase
        .from('payment_transactions')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      // PCBancard API integration (simulated)
      const pcbancardPayload = {
        merchant_id: config.merchantId,
        transaction_id: transactionId,
        amount: currentTransaction?.amount,
        currency: currentTransaction?.currency,
        card_data: {
          number: paymentForm.cardNumber.replace(/\s/g, ''),
          expiry: paymentForm.expiryDate,
          cvv: paymentForm.cvv,
          holder_name: paymentForm.cardholderName
        },
        billing_address: paymentForm.billingAddress,
        webhook_url: config.webhookUrl
      };

      // In real implementation, this would be a secure server-side call
      console.log('PCBancard payment request (demo):', {
        ...pcbancardPayload,
        card_data: { ...pcbancardPayload.card_data, number: '****', cvv: '***' }
      });

      // Simulate PCBancard response
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResponse = {
        success: true,
        transaction_reference: `PCB-${Date.now()}`,
        authorization_code: `AUTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        processing_fee: currentTransaction?.amount ? currentTransaction.amount * 0.029 : 0 // 2.9% fee
      };

      if (mockResponse.success) {
        // Update transaction to completed
        await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            external_transaction_id: mockResponse.transaction_reference,
            processing_fee: mockResponse.processing_fee,
            net_amount: currentTransaction?.amount ? currentTransaction.amount - mockResponse.processing_fee : 0,
            audit_trail: {
              ...currentTransaction?.audit_trail,
              pcbancard_response: {
                authorization_code: mockResponse.authorization_code,
                processed_at: new Date().toISOString()
              }
            }
          })
          .eq('id', transactionId);

        toast({
          title: "Payment Successful",
          description: "Payment processed successfully via PCBancard.",
        });

        return {
          success: true,
          transactionId: mockResponse.transaction_reference
        };
      } else {
        throw new Error('PCBancard payment failed');
      }

    } catch (error) {
      console.error('PCBancard payment error:', error);

      // Update transaction to failed with retry logic
      const retryCount = (currentTransaction?.retry_count || 0) + 1;
      const canRetry = retryCount < (currentTransaction?.max_retries || 3);

      await supabase
        .from('payment_transactions')
        .update({
          status: canRetry ? 'pending' : 'failed',
          error_code: 'PCBANCARD_ERROR',
          error_message: error.message,
          error_details: { pcbancard_error: error.message, timestamp: new Date().toISOString() },
          retry_count: retryCount
        })
        .eq('id', transactionId);

      return {
        success: false,
        error: 'PCBancard payment failed. Please try again.',
        errorCode: 'PCBANCARD_ERROR',
        requiresRetry: canRetry
      };
    }
  }, [currentTransaction]);

  const processStandardPayment = useCallback(async (
    transactionId: string,
    paymentForm: PaymentForm
  ): Promise<PaymentResult> => {
    try {
      // Update transaction to processing
      await supabase
        .from('payment_transactions')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      // Standard payment processing (would integrate with Stripe, etc.)
      console.log('Standard payment processing (demo)');

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success for demo
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          external_transaction_id: `STD-${Date.now()}`
        })
        .eq('id', transactionId);

      toast({
        title: "Payment Successful",
        description: "Payment has been processed successfully.",
      });

      return {
        success: true,
        transactionId
      };

    } catch (error) {
      console.error('Standard payment error:', error);
      return {
        success: false,
        error: 'Payment processing failed. Please try again.',
        errorCode: 'STANDARD_PAYMENT_ERROR',
        requiresRetry: true
      };
    }
  }, []);

  const retryPayment = useCallback(async (transactionId: string): Promise<PaymentResult> => {
    try {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      if (transaction.retry_count >= transaction.max_retries) {
        return {
          success: false,
          error: 'Maximum retry attempts exceeded',
          errorCode: 'MAX_RETRIES_EXCEEDED'
        };
      }

      // Simulate retry logic - in real implementation, would re-attempt with payment processor
      const retryResult = await simulatePaymentProcessing(transactionId, transaction.card_brand || 'visa');
      return retryResult;

    } catch (error) {
      console.error('Payment retry error:', error);
      return {
        success: false,
        error: 'Retry failed. Please try again.',
        errorCode: 'RETRY_ERROR'
      };
    }
  }, [simulatePaymentProcessing]);

  const getTransactionStatus = useCallback(async (transactionId: string) => {
    try {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      return transaction;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return null;
    }
  }, []);

  return {
    // State
    isProcessing,
    isValidating,
    currentTransaction,

    // Methods
    validateCreditCard,
    processPayment,
    retryPayment,
    getTransactionStatus,

    // Utils
    cardPatterns,
    
    // Setters
    setCurrentTransaction
  };
};