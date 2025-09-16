import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Proposal, 
  ProposalTemplate, 
  ProposalItem, 
  ProposalVersion,
  FormValidationError 
} from '@/types/database';

interface ValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
  warnings: string[];
}

interface ContentValidation {
  spellCheck: boolean;
  grammarCheck: boolean;
  professionalTone: boolean;
  completeness: boolean;
}

interface PricingCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  errors: string[];
}

export const useProposalBuilder = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [proposalItems, setProposalItems] = useState<ProposalItem[]>([]);

  const validateTemplate = useCallback((template: Partial<ProposalTemplate>): ValidationResult => {
    const errors: FormValidationError[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!template.name?.trim()) {
      errors.push({ field: 'name', message: 'Template name is required' });
    }

    if (!template.template_content || Object.keys(template.template_content).length === 0) {
      errors.push({ field: 'template_content', message: 'Template content is required' });
    }

    // Content structure validation
    if (template.template_content) {
      const content = template.template_content as any;
      
      if (!content.sections || !Array.isArray(content.sections) || content.sections.length === 0) {
        errors.push({ field: 'template_content', message: 'Template must have at least one section' });
      }

      // Validate required sections
      const requiredSections = ['overview', 'pricing'];
      const existingSections = content.sections?.map((s: any) => s.id) || [];
      
      requiredSections.forEach(section => {
        if (!existingSections.includes(section)) {
          warnings.push(`Missing recommended section: ${section}`);
        }
      });
    }

    // Pricing structure validation
    if (template.pricing_structure) {
      const pricing = template.pricing_structure as any;
      
      if (!pricing.currency) {
        warnings.push('Currency not specified in pricing structure');
      }

      if (!pricing.tax_rate && pricing.tax_rate !== 0) {
        warnings.push('Tax rate not specified in pricing structure');
      }
    }

    // Validation rules check
    if (template.validation_rules) {
      const rules = template.validation_rules as any;
      
      if (rules.min_amount && rules.max_amount && rules.min_amount >= rules.max_amount) {
        errors.push({ field: 'validation_rules', message: 'Minimum amount must be less than maximum amount' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  const validateContent = useCallback(async (content: Record<string, any>): Promise<ContentValidation> => {
    try {
      // Basic content completeness check
      const hasOverview = content.overview && content.overview.trim().length > 0;
      const hasScope = content.scope && (Array.isArray(content.scope) ? content.scope.length > 0 : content.scope.trim().length > 0);
      const hasPricing = content.pricing || (content.sections && content.sections.some((s: any) => s.type === 'pricing_table'));

      // Simulate spell check (in real implementation, integrate with spell-check API)
      const textContent = JSON.stringify(content).toLowerCase();
      const commonMisspellings = ['teh', 'recieve', 'seperate', 'definately', 'occured'];
      const spellCheck = !commonMisspellings.some(word => textContent.includes(word));

      // Basic grammar and tone check
      const hasProperCapitalization = /[A-Z]/.test(JSON.stringify(content));
      const hasCompleteSentences = !textContent.includes('.  ') && !textContent.includes('...');
      
      return {
        spellCheck,
        grammarCheck: hasProperCapitalization && hasCompleteSentences,
        professionalTone: !textContent.includes('lol') && !textContent.includes('omg'),
        completeness: hasOverview && hasScope && hasPricing
      };

    } catch (error) {
      console.error('Content validation error:', error);
      return {
        spellCheck: false,
        grammarCheck: false,
        professionalTone: false,
        completeness: false
      };
    }
  }, []);

  const calculatePricing = useCallback((items: ProposalItem[], taxRate: number = 0.1, discountRate: number = 0): PricingCalculation => {
    const errors: string[] = [];

    try {
      if (!Array.isArray(items) || items.length === 0) {
        return {
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          finalAmount: 0,
          errors: ['No items to calculate']
        };
      }

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => {
        if (item.quantity <= 0) {
          errors.push(`Item "${item.name}" has invalid quantity: ${item.quantity}`);
        }
        if (item.unit_price < 0) {
          errors.push(`Item "${item.name}" has invalid unit price: ${item.unit_price}`);
        }
        return sum + (item.quantity * item.unit_price);
      }, 0);

      // Apply item-level discounts
      const subtotalAfterItemDiscounts = items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const itemDiscount = (item.discount_percent / 100) * itemTotal;
        return sum + (itemTotal - itemDiscount);
      }, 0);

      // Calculate global discount
      const discountAmount = (discountRate / 100) * subtotalAfterItemDiscounts;
      const subtotalAfterDiscount = subtotalAfterItemDiscounts - discountAmount;

      // Calculate tax
      const taxAmount = (taxRate / 100) * subtotalAfterDiscount;
      
      // Final amount
      const finalAmount = subtotalAfterDiscount + taxAmount;

      // Validation checks
      if (subtotal < 0) {
        errors.push('Subtotal cannot be negative');
      }

      if (finalAmount > 1000000) {
        errors.push('Total amount exceeds maximum limit of $1,000,000');
      }

      return {
        subtotal: Math.round(subtotalAfterItemDiscounts * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
        errors
      };

    } catch (error) {
      console.error('Pricing calculation error:', error);
      return {
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        finalAmount: 0,
        errors: [`Calculation error: ${error.message}`]
      };
    }
  }, []);

  const validateProposal = useCallback(async (proposal: Partial<Proposal>, items: ProposalItem[]): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      const errors: FormValidationError[] = [];
      const warnings: string[] = [];

      // Required field validation
      if (!proposal.title?.trim()) {
        errors.push({ field: 'title', message: 'Proposal title is required' });
      }

      if (!proposal.client_id) {
        errors.push({ field: 'client_id', message: 'Client selection is required' });
      }

      if (!proposal.content || Object.keys(proposal.content).length === 0) {
        errors.push({ field: 'content', message: 'Proposal content is required' });
      }

      // Items validation
      if (!items || items.length === 0) {
        errors.push({ field: 'items', message: 'At least one proposal item is required' });
      }

      // Content validation
      if (proposal.content) {
        const contentValidation = await validateContent(proposal.content);
        
        if (!contentValidation.spellCheck) {
          warnings.push('Potential spelling errors detected');
        }

        if (!contentValidation.grammarCheck) {
          warnings.push('Grammar and formatting issues detected');
        }

        if (!contentValidation.professionalTone) {
          warnings.push('Content may not maintain professional tone');
        }

        if (!contentValidation.completeness) {
          warnings.push('Proposal content appears incomplete');
        }
      }

      // Pricing validation
      if (items && items.length > 0) {
        const pricingResult = calculatePricing(items);
        
        if (pricingResult.errors.length > 0) {
          pricingResult.errors.forEach(error => {
            errors.push({ field: 'pricing', message: error });
          });
        }

        if (pricingResult.finalAmount <= 0) {
          errors.push({ field: 'pricing', message: 'Total proposal amount must be greater than zero' });
        }
      }

      // Validity period validation
      if (proposal.valid_until) {
        const validUntil = new Date(proposal.valid_until);
        const today = new Date();
        
        if (validUntil <= today) {
          errors.push({ field: 'valid_until', message: 'Proposal validity date must be in the future' });
        }

        const daysDiff = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
          warnings.push('Proposal validity period exceeds 1 year');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Proposal validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: `Validation error: ${error.message}` }],
        warnings: []
      };
    } finally {
      setIsValidating(false);
    }
  }, [validateContent, calculatePricing]);

  const saveProposal = useCallback(async (
    proposal: Partial<Proposal>,
    items: ProposalItem[]
  ): Promise<{ success: boolean; proposalId?: string }> => {
    setIsSaving(true);

    try {
      // Validate first
      const validation = await validateProposal(proposal, items);
      
      if (!validation.isValid) {
        toast({
          title: "Validation Failed",
          description: `Found ${validation.errors.length} errors. Please fix them before saving.`,
          variant: "destructive",
        });
        return { success: false };
      }

      // Calculate final pricing
      const pricingResult = calculatePricing(items);
      
      if (pricingResult.errors.length > 0) {
        throw new Error(`Pricing calculation failed: ${pricingResult.errors.join(', ')}`);
      }

      // Prepare proposal data
      const proposalData = {
        tenant_id: 'demo-tenant-id', // Would use actual tenant from auth
        client_id: proposal.client_id!,
        template_id: proposal.template_id,
        proposal_number: proposal.proposal_number || `PROP-${Date.now()}`,
        title: proposal.title!,
        description: proposal.description,
        content: proposal.content || {},
        status: proposal.status || 'draft' as const,
        total_amount: pricingResult.subtotal,
        currency: proposal.currency || 'USD' as const,
        tax_amount: pricingResult.taxAmount,
        discount_amount: pricingResult.discountAmount,
        final_amount: pricingResult.finalAmount,
        valid_until: proposal.valid_until,
        terms_and_conditions: proposal.terms_and_conditions,
        payment_terms: proposal.payment_terms,
        delivery_terms: proposal.delivery_terms,
        validation_errors: validation.warnings.map(w => ({ type: 'warning', message: w }))
      };

      // Save or update proposal
      let savedProposal;
      if (proposal.id) {
        // Update existing proposal
        const { data, error } = await supabase
          .from('proposals')
          .update(proposalData)
          .eq('id', proposal.id)
          .select()
          .single();

        if (error) throw error;
        savedProposal = data;
      } else {
        // Create new proposal
        const { data, error } = await supabase
          .from('proposals')
          .insert(proposalData)
          .select()
          .single();

        if (error) throw error;
        savedProposal = data;
      }

      // Save items
      if (proposal.id) {
        // Delete existing items first
        await supabase
          .from('proposal_items')
          .delete()
          .eq('proposal_id', proposal.id);
      }

      // Insert new items
      const itemsWithProposalId = items.map((item, index) => ({
        ...item,
        id: `item-${savedProposal.id}-${index + 1}`,
        tenant_id: 'demo-tenant-id',
        proposal_id: savedProposal.id,
        item_order: index + 1,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('proposal_items')
        .insert(itemsWithProposalId);

      if (itemsError) throw itemsError;

      // Create version record for change tracking
      if (proposal.id) {
        await supabase
          .from('proposal_versions')
          .insert({
            tenant_id: 'demo-tenant-id',
            proposal_id: savedProposal.id,
            version_number: (currentProposal?.updated_at ? 
              Math.floor(Date.now() / 1000) : 1),
            content_snapshot: {
              proposal: savedProposal,
              items: itemsWithProposalId
            },
            changes_summary: 'Proposal updated',
            change_type: 'update'
          });
      }

      setCurrentProposal(savedProposal);
      setProposalItems(itemsWithProposalId);

      // Show success message with warnings if any
      if (validation.warnings.length > 0) {
        toast({
          title: "Proposal Saved with Warnings",
          description: `Proposal saved successfully. ${validation.warnings.length} warnings to review.`,
        });
      } else {
        toast({
          title: "Proposal Saved",
          description: "Proposal saved successfully.",
        });
      }

      return { success: true, proposalId: savedProposal.id };

    } catch (error) {
      console.error('Proposal save error:', error);
      
      // Log error for debugging
      await supabase
        .from('error_logs')
        .insert({
          tenant_id: 'demo-tenant-id',
          error_type: 'proposal_save_failed',
          error_message: error.message,
          context: {
            proposal_id: proposal.id,
            action: 'save_proposal'
          }
        });

      toast({
        title: "Save Failed",
        description: "Failed to save proposal. Please try again.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [validateProposal, calculatePricing, currentProposal]);

  const generatePreview = useCallback(async (
    proposalId: string,
    format: 'html' | 'pdf' = 'html'
  ): Promise<{ success: boolean; previewUrl?: string; fallbackHtml?: string }> => {
    setIsGeneratingPreview(true);

    try {
      // Load proposal and items
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      const { data: items, error: itemsError } = await supabase
        .from('proposal_items')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('item_order');

      if (itemsError) throw itemsError;

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', proposal.client_id)
        .single();

      if (clientError) {
        console.warn('Client data not found for preview');
      }

      // Generate HTML preview
      const fallbackHtml = generateProposalHTML(proposal, items, client);

      if (format === 'html') {
        return {
          success: true,
          fallbackHtml
        };
      }

      // For PDF, try to generate but fallback to HTML if it fails
      try {
        // In a real implementation, this would use a PDF generation service
        // For now, we'll simulate PDF generation and provide HTML fallback
        console.log('PDF generation requested, providing HTML fallback');
        
        return {
          success: true,
          fallbackHtml
        };
      } catch (pdfError) {
        console.warn('PDF generation failed, providing HTML fallback:', pdfError);
        
        return {
          success: true,
          fallbackHtml
        };
      }

    } catch (error) {
      console.error('Preview generation failed:', error);
      
      toast({
        title: "Preview Generation Failed",
        description: "Could not generate proposal preview. Please try again.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsGeneratingPreview(false);
    }
  }, []);

  const generateProposalHTML = useCallback((
    proposal: any,
    items: any[],
    client?: any
  ): string => {
    const content = proposal.content || {};
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Proposal - ${proposal.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin: 30px 0; }
            .pricing-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .pricing-table th, .pricing-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .pricing-table th { background-color: #f5f5f5; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .terms { background: #f5f5f5; padding: 20px; border-left: 4px solid #007cba; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${proposal.title}</h1>
            <p><strong>Proposal #:</strong> ${proposal.proposal_number}</p>
            ${client ? `<p><strong>Client:</strong> ${client.name}</p>` : ''}
            <p><strong>Date:</strong> ${new Date(proposal.created_date).toLocaleDateString()}</p>
            ${proposal.valid_until ? `<p><strong>Valid Until:</strong> ${new Date(proposal.valid_until).toLocaleDateString()}</p>` : ''}
        </div>
        
        ${content.overview ? `
        <div class="section">
            <h2>Project Overview</h2>
            <p>${content.overview}</p>
        </div>` : ''}

        ${content.scope ? `
        <div class="section">
            <h2>Scope of Work</h2>
            ${Array.isArray(content.scope) ? 
              `<ul>${content.scope.map(item => `<li>${item}</li>`).join('')}</ul>` :
              `<p>${content.scope}</p>`
            }
        </div>` : ''}

        <div class="section">
            <h2>Pricing</h2>
            <table class="pricing-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.description || ''}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.unit_price.toFixed(2)}</td>
                        <td>$${item.total_price.toFixed(2)}</td>
                    </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="4">Subtotal</td>
                        <td>$${(proposal.total_amount || 0).toFixed(2)}</td>
                    </tr>
                    ${proposal.discount_amount > 0 ? `
                    <tr>
                        <td colspan="4">Discount</td>
                        <td>-$${proposal.discount_amount.toFixed(2)}</td>
                    </tr>` : ''}
                    <tr>
                        <td colspan="4">Tax</td>
                        <td>$${(proposal.tax_amount || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="4"><strong>Total</strong></td>
                        <td><strong>$${(proposal.final_amount || 0).toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        ${proposal.terms_and_conditions ? `
        <div class="section">
            <h2>Terms and Conditions</h2>
            <div class="terms">
                <p>${proposal.terms_and_conditions}</p>
            </div>
        </div>` : ''}

        ${proposal.payment_terms ? `
        <div class="section">
            <h2>Payment Terms</h2>
            <p>${proposal.payment_terms}</p>
        </div>` : ''}
    </body>
    </html>
    `;
  }, []);

  const duplicateProposal = useCallback(async (
    proposalId: string,
    newTitle: string
  ): Promise<{ success: boolean; newProposalId?: string }> => {
    try {
      // Load original proposal and items
      const { data: originalProposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      const { data: originalItems, error: itemsError } = await supabase
        .from('proposal_items')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('item_order');

      if (itemsError) throw itemsError;

      // Create new proposal
      const newProposal = {
        ...originalProposal,
        id: undefined,
        proposal_number: `PROP-${Date.now()}`,
        title: newTitle,
        status: 'draft' as const,
        sent_date: null,
        viewed_date: null,
        accepted_date: null,
        view_count: 0,
        created_at: undefined,
        updated_at: undefined
      };

      const result = await saveProposal(newProposal, originalItems);

      if (result.success) {
        toast({
          title: "Proposal Duplicated",
          description: `Proposal duplicated as "${newTitle}".`,
        });
      }

      return result;

    } catch (error) {
      console.error('Proposal duplication error:', error);
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate proposal. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [saveProposal]);

  return {
    // State
    currentProposal,
    proposalItems,
    isValidating,
    isSaving,
    isGeneratingPreview,

    // Methods
    validateTemplate,
    validateContent,
    validateProposal,
    calculatePricing,
    saveProposal,
    generatePreview,
    duplicateProposal,

    // Setters
    setCurrentProposal,
    setProposalItems
  };
};