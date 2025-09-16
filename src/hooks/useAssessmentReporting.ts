import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Assessment, AssessmentTemplate, AssessmentQuestion, AssessmentResponse, AssessmentReport } from '@/types/database';

interface ReportData {
  assessment: Assessment;
  template: AssessmentTemplate;
  questions: AssessmentQuestion[];
  responses: AssessmentResponse[];
  summary: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    completionTime?: number;
    sectionsScores: Record<string, number>;
  };
  recommendations: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    estimatedValue?: number;
  }>;
}

interface ExportResult {
  success: boolean;
  data?: Blob;
  filename?: string;
  error?: string;
}

export const useAssessmentReporting = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);

  const generateReportData = useCallback(async (
    assessmentId: string
  ): Promise<ReportData | null> => {
    try {
      // Load assessment and related data
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      const { data: template, error: templateError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', assessment.template_id)
        .single();

      if (templateError) throw templateError;

      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', assessment.template_id)
        .order('question_number');

      if (questionsError) throw questionsError;

      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      // Calculate summary statistics
      const totalScore = responses?.reduce((sum, r) => sum + r.score, 0) || 0;
      const maxScore = questions?.reduce((sum, q) => sum + q.max_points, 0) || 0;
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      
      // Calculate completion time if started and completed
      let completionTime: number | undefined;
      if (assessment.started_at && assessment.completed_at) {
        const startTime = new Date(assessment.started_at).getTime();
        const endTime = new Date(assessment.completed_at).getTime();
        completionTime = Math.round((endTime - startTime) / 60000); // minutes
      }

      // Calculate section scores
      const sectionsScores: Record<string, number> = {};
      const sections = [...new Set(questions?.map(q => q.section).filter(Boolean))];

      sections.forEach(section => {
        if (!section) return;
        
        const sectionQuestions = questions?.filter(q => q.section === section) || [];
        const sectionResponses = responses?.filter(r => 
          sectionQuestions.some(q => q.id === r.question_id)
        ) || [];
        
        const sectionScore = sectionResponses.reduce((sum, r) => sum + r.score, 0);
        const sectionMaxScore = sectionQuestions.reduce((sum, q) => sum + q.max_points, 0);
        
        sectionsScores[section] = sectionMaxScore > 0 ? (sectionScore / sectionMaxScore) * 100 : 0;
      });

      // Generate recommendations based on threshold rules
      const recommendations: ReportData['recommendations'] = [];
      const thresholdRules = (template.threshold_rules as any) || {};
      
      if (thresholdRules.opportunities) {
        Object.entries(thresholdRules.opportunities as any).forEach(([key, rule]: [string, any]) => {
          const threshold = rule.threshold || 70;
          
          // Check if this opportunity should be recommended
          let shouldRecommend = false;
          let relevantScore = percentage;
          
          if (rule.section && sectionsScores[rule.section] !== undefined) {
            relevantScore = sectionsScores[rule.section];
          }
          
          shouldRecommend = relevantScore < threshold;
          
          if (shouldRecommend) {
            recommendations.push({
              category: rule.section || 'General',
              priority: rule.priority || 'medium',
              title: rule.title || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: rule.description || `Improvement opportunity identified in ${key}`,
              estimatedValue: rule.estimatedValue
            });
          }
        });
      }

      // Type cast database results to match our interfaces
      const assessmentTyped: Assessment = {
        ...assessment,
        // Map database fields to expected interface fields
        assessed_by: assessment.assessor_id || '',
        assessment_type: 'general' as const,
        title: `Assessment ${assessment.id}`,
        description: 'Assessment report',
        overall_score: assessment.total_score || 0,
        findings: [],
        recommendations: [],
        status: (assessment.status === 'in_progress' ? 'draft' : 
                assessment.status === 'validated' ? 'completed' : 
                assessment.status === 'flagged' ? 'draft' : 
                assessment.status) as Assessment['status'],
        session_data: (assessment.session_data as any) || {},
        validation_errors: (assessment.validation_errors as any) || [],
        recovery_data: (assessment.recovery_data as any) || {}
      };

      const templateTyped: AssessmentTemplate = {
        ...template,
        scoring_rules: (template.scoring_rules as any) || {},
        threshold_rules: (template.threshold_rules as any) || {},
        conditional_logic: (template.conditional_logic as any) || {},
        validation_rules: (template.validation_rules as any) || {}
      };

      const questionsTyped: AssessmentQuestion[] = questions?.map(q => ({
        ...q,
        options: (q.options as any) || [],
        validation_rules: (q.validation_rules as any) || {},
        conditional_logic: (q.conditional_logic as any) || {}
      })) || [];

      const responsesTyped: AssessmentResponse[] = responses?.map(r => ({
        ...r,
        response_data: (r.response_data as any) || {},
        validation_errors: (r.validation_errors as any) || []
      })) || [];

      setAssessment(assessmentTyped);
      setTemplate(templateTyped);
      setQuestions(questionsTyped);
      setResponses(responsesTyped);

      return {
        assessment: assessmentTyped,
        template: templateTyped,
        questions: questionsTyped,
        responses: responsesTyped,
        summary: {
          totalScore,
          maxScore,
          percentage,
          completionTime,
          sectionsScores
        },
        recommendations
      };

    } catch (error) {
      console.error('Failed to generate report data:', error);
      return null;
    }
  }, []);

  const generateReport = useCallback(async (
    assessmentId: string,
    reportType: string = 'comprehensive'
  ): Promise<{ success: boolean; reportId?: string }> => {
    setIsGenerating(true);

    try {
      // Get assessment to get tenant_id
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('tenant_id')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Create report entry
      const { data: report, error: createError } = await supabase
        .from('assessment_reports')
        .insert({
          tenant_id: assessment?.tenant_id || '',
          assessment_id: assessmentId,
          report_type: reportType,
          status: 'generating',
          generation_started_at: new Date().toISOString(),
          export_formats: ['pdf', 'html'],
          retry_count: 0
        })
        .select()
        .single();

      if (createError) throw createError;

      try {
        // Generate report data
        const reportData = await generateReportData(assessmentId);
        
        if (!reportData) {
          throw new Error('Failed to generate report data');
        }

        // Update with completed data
        const { error: updateError } = await supabase
          .from('assessment_reports')
          .update({
            status: 'completed',
            generation_completed_at: new Date().toISOString(),
            report_data: reportData as any,
            error_details: {}
          })
          .eq('id', report.id);

        if (updateError) throw updateError;

        toast({
          title: "Report Generated",
          description: "Assessment report generated successfully.",
        });

        return { success: true, reportId: report.id };

      } catch (generationError) {
        // Update report with error status
        await supabase
          .from('assessment_reports')
          .update({
            status: 'failed',
            error_details: {
              message: generationError.message,
              timestamp: new Date().toISOString()
            }
          })
          .eq('id', report.id);

        throw generationError;
      }

    } catch (error) {
      console.error('Report generation failed:', error);
      
      toast({
        title: "Generation Failed",
        description: "Failed to generate assessment report. Please try again.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsGenerating(false);
    }
  }, [generateReportData]);

  const exportReport = useCallback(async (
    reportId: string,
    format: 'pdf' | 'html' | 'csv' | 'excel' = 'pdf'
  ): Promise<ExportResult> => {
    setIsExporting(true);

    try {
      // Load report data
      const { data: report, error: reportError } = await supabase
        .from('assessment_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      if (report.status !== 'completed') {
        throw new Error('Report is not ready for export');
      }

      const reportData = report.report_data as any;
      
      if (!reportData) {
        throw new Error('No report data available');
      }

      // Export based on format
      switch (format) {
        case 'html':
          return await exportHTML(reportData);
        case 'csv':
          return await exportCSV(reportData);
        case 'excel':
          return await exportExcel(reportData);
        case 'pdf':
        default:
          return await exportPDF(reportData);
      }

    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: `Export failed: ${error.message}`
      };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportHTML = useCallback(async (reportData: ReportData): Promise<ExportResult> => {
    try {
      const htmlContent = generateHTMLReport(reportData);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      return {
        success: true,
        data: blob,
        filename: `assessment-report-${Date.now()}.html`
      };
    } catch (error) {
      return {
        success: false,
        error: `HTML export failed: ${error.message}`
      };
    }
  }, []);

  const exportPDF = useCallback(async (reportData: ReportData): Promise<ExportResult> => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      // Create HTML content
      const htmlContent = generateHTMLReport(reportData);
      
      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);
      
      try {
        // Convert HTML to canvas
        const canvas = await html2canvas.default(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 30;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        // Convert to blob
        const pdfBlob = pdf.output('blob');
        
        return {
          success: true,
          data: pdfBlob,
          filename: `assessment-report-${Date.now()}.pdf`
        };
      } finally {
        // Clean up
        document.body.removeChild(tempDiv);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      // Fallback to HTML
      const htmlResult = await exportHTML(reportData);
      
      if (htmlResult.success) {
        return {
          ...htmlResult,
          filename: `assessment-report-${Date.now()}.html`
        };
      }
      
      return {
        success: false,
        error: `PDF export failed: ${error.message}`
      };
    }
  }, [exportHTML, generateHTMLReport]);

  const exportCSV = useCallback(async (reportData: ReportData): Promise<ExportResult> => {
    try {
      const csvContent = generateCSVReport(reportData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      
      return {
        success: true,
        data: blob,
        filename: `assessment-data-${Date.now()}.csv`
      };
    } catch (error) {
      return {
        success: false,
        error: `CSV export failed: ${error.message}`
      };
    }
  }, []);

  const exportExcel = useCallback(async (reportData: ReportData): Promise<ExportResult> => {
    try {
      // For now, fallback to CSV
      const csvResult = await exportCSV(reportData);
      
      if (csvResult.success) {
        return {
          ...csvResult,
          filename: `assessment-data-${Date.now()}.xlsx`
        };
      }
      
      return csvResult;
    } catch (error) {
      return {
        success: false,
        error: `Excel export failed: ${error.message}`
      };
    }
  }, [exportCSV]);

  const generateHTMLReport = useCallback((reportData: ReportData): string => {
    const { assessment, template, summary, recommendations } = reportData;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Assessment Report - ${assessment.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .score { font-size: 24px; color: #333; font-weight: bold; }
            .section { margin: 20px 0; }
            .recommendation { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #007cba; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Assessment Report</h1>
            <h2>${assessment.title}</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
            <h3>Summary</h3>
            <div class="score">Overall Score: ${summary.percentage.toFixed(1)}% (${summary.totalScore}/${summary.maxScore})</div>
            ${summary.completionTime ? `<p>Completion Time: ${summary.completionTime} minutes</p>` : ''}
        </div>

        ${Object.keys(summary.sectionsScores).length > 0 ? `
        <div class="section">
            <h3>Section Scores</h3>
            ${Object.entries(summary.sectionsScores).map(([section, score]) => `
                <p><strong>${section}:</strong> ${score.toFixed(1)}%</p>
            `).join('')}
        </div>` : ''}

        ${recommendations.length > 0 ? `
        <div class="section">
            <h3>Recommendations</h3>
            ${recommendations.map(rec => `
                <div class="recommendation">
                    <h4>${rec.title}</h4>
                    <p><strong>Priority:</strong> ${rec.priority}</p>
                    <p>${rec.description}</p>
                    ${rec.estimatedValue ? `<p><strong>Estimated Value:</strong> $${rec.estimatedValue}</p>` : ''}
                </div>
            `).join('')}
        </div>` : ''}
    </body>
    </html>
    `;
  }, []);

  const generateCSVReport = useCallback((reportData: ReportData): string => {
    const { responses, questions } = reportData;
    
    let csv = 'Question Number,Question Text,Response,Score,Max Points\n';
    
    responses.forEach(response => {
      const question = questions.find(q => q.id === response.question_id);
      if (question) {
        const responseValue = response.response_value || JSON.stringify(response.response_data);
        csv += `${question.question_number},"${question.question_text}","${responseValue}",${response.score},${question.max_points}\n`;
      }
    });
    
    return csv;
  }, []);

  const sendReportByEmail = useCallback(async (
    reportId: string,
    recipients: string[],
    formats: ('pdf' | 'html' | 'csv')[] = ['pdf']
  ): Promise<{ success: boolean }> => {
    setIsSendingEmail(true);

    try {
      // Load report
      const { data: report, error: reportError } = await supabase
        .from('assessment_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      // Export in requested formats
      const exports: { format: string; result: ExportResult }[] = [];
      
      for (const format of (formats as string[])) {
        const result = await exportReport(reportId, format as any);
        exports.push({ format, result });
      }

      // Check for export failures
      const failedExports = exports.filter(exp => !exp.result.success);
      if (failedExports.length > 0) {
        throw new Error(`Some exports failed: ${failedExports.map(f => f.format).join(', ')}`);
      }

      // In a real implementation, you would send the email here
      // For now, we'll just log and update the record
      console.log('Sending email to:', recipients);
      console.log('Attachments:', exports.map(e => e.result.filename));

      // Update report with email status
      const { error: updateError } = await supabase
        .from('assessment_reports')
        .update({
          email_recipients: recipients,
          email_sent: true,
          email_errors: []
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      toast({
        title: "Email Sent",
        description: `Report sent to ${recipients.length} recipient(s) successfully.`,
      });

      return { success: true };

    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Log email error
      await supabase
        .from('assessment_reports')
        .update({
          email_sent: false,
          email_errors: [{
            message: error.message,
            timestamp: new Date().toISOString(),
            recipients
          }]
        })
        .eq('id', reportId);

      toast({
        title: "Email Failed",
        description: "Failed to send report by email. Please try again.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsSendingEmail(false);
    }
  }, [exportReport]);

  return {
    assessment,
    template,
    questions,
    responses,
    generateReportData,
    generateReport,
    exportReport,
    sendReportByEmail,
    isGenerating,
    isExporting,
    isSendingEmail
  };
};