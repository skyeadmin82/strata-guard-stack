import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, FileText } from 'lucide-react';

interface ProposalPDFGeneratorProps {
  proposalId: string;
  proposalTitle: string;
  onGenerateComplete?: (pdfUrl: string) => void;
}

export const ProposalPDFGenerator: React.FC<ProposalPDFGeneratorProps> = ({
  proposalId,
  proposalTitle,
  onGenerateComplete
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateProposalHTML = async () => {
    try {
      // Fetch proposal data
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      // Fetch client data separately
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('name, email, phone, address')
        .eq('id', proposal.client_id)
        .single();

      if (clientError) throw clientError;

      // Fetch proposal items
      const { data: items, error: itemsError } = await supabase
        .from('proposal_items')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('item_order');

      if (itemsError) throw itemsError;

      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Proposal - ${proposalTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #3b82f6; margin: 0; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .client-info { background: #f9fafb; padding: 15px; border-radius: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .items-table th { background: #f3f4f6; font-weight: 600; }
            .items-table .text-right { text-align: right; }
            .total-section { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-row.grand-total { font-weight: bold; font-size: 1.2em; border-top: 1px solid #374151; padding-top: 10px; }
            .terms { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${proposal.title}</h1>
            <p>Proposal #${proposal.proposal_number}</p>
            <p>Date: ${new Date(proposal.created_at).toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>Client Information</h2>
            <div class="client-info">
              <p><strong>${client?.name}</strong></p>
              <p>Email: ${client?.email}</p>
              ${client?.phone ? `<p>Phone: ${client.phone}</p>` : ''}
            </div>
          </div>

          ${proposal.description ? `
          <div class="section">
            <h2>Description</h2>
            <p>${proposal.description}</p>
          </div>
          ` : ''}

          ${items && items.length > 0 ? `
          <div class="section">
            <h2>Items & Services</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.description}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">$${Number(item.unit_price).toFixed(2)}</td>
                    <td class="text-right">$${Number(item.total_price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${Number(proposal.total_amount || 0).toFixed(2)}</span>
            </div>
            ${proposal.discount_amount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-$${Number(proposal.discount_amount).toFixed(2)}</span>
            </div>
            ` : ''}
            ${proposal.tax_amount > 0 ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>$${Number(proposal.tax_amount).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Total:</span>
              <span>$${Number(proposal.final_amount || proposal.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          ${proposal.valid_until ? `
          <div class="section">
            <h2>Validity</h2>
            <p>This proposal is valid until: <strong>${new Date(proposal.valid_until).toLocaleDateString()}</strong></p>
          </div>
          ` : ''}

          ${proposal.terms_and_conditions ? `
          <div class="terms">
            <h3>Terms & Conditions</h3>
            <p>${proposal.terms_and_conditions}</p>
          </div>
          ` : ''}

          ${proposal.payment_terms ? `
          <div class="section">
            <h2>Payment Terms</h2>
            <p>${proposal.payment_terms}</p>
          </div>
          ` : ''}
        </body>
        </html>
      `;

      return htmlContent;
    } catch (error) {
      console.error('Error generating HTML:', error);
      throw error;
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Get proposal data first for filename
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('proposal_number')
        .eq('id', proposalId)
        .single();

      // Create a temporary element to render HTML
      const htmlContent = await generateProposalHTML();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        width: 800,
        height: tempDiv.scrollHeight,
        scale: 2
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Generate filename
      const filename = `proposal-${proposalData?.proposal_number || proposalId}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      toast({
        title: 'Success',
        description: 'PDF generated successfully',
      });

      onGenerateComplete?.(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadHTML = async () => {
    try {
      const htmlContent = await generateProposalHTML();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${proposalId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'HTML file downloaded',
      });
    } catch (error) {
      console.error('Error downloading HTML:', error);
      toast({
        title: 'Error',
        description: 'Failed to download HTML',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={generatePDF}
        disabled={isGenerating}
      >
        <Download className="w-4 h-4 mr-2" />
        {isGenerating ? 'Generating...' : 'Download PDF'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={downloadHTML}
      >
        <FileText className="w-4 h-4 mr-2" />
        Download HTML
      </Button>
    </div>
  );
};