import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Assessment, AssessmentReport, AssessmentTemplate, AssessmentQuestion, AssessmentResponse } from '@/types/database';

interface ReportData {
  assessment: Assessment;
  template: AssessmentTemplate;
  questions: AssessmentQuestion[];
  responses: AssessmentResponse[];
  summary: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    completionTime: number;
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

interface ExportOptions {
  format: 'html' | 'pdf' | 'json' | 'csv';
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeDetailedResponses: boolean;
  customSections?: string[];
}

export const useAssessmentReporting = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const generateReportData = useCallback(async (assessmentId: string): Promise<ReportData | null> => {
    try {
      // Load assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Load template
      const { data: template, error: templateError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', assessment.template_id)
        .single();

      if (templateError) throw templateError;

      // Load questions
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', assessment.template_id)
        .order('question_number');

      if (questionsError) throw questionsError;

      // Load responses
      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      // Calculate summary statistics
      const totalScore = responses?.reduce((sum, r) => sum + r.score, 0) || 0;
      const maxScore = template.max_score || 0;
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // Calculate completion time
      const startTime = new Date(assessment.started_at).getTime();
      const endTime = assessment.completed_at 
        ? new Date(assessment.completed_at).getTime()
        : Date.now();
      const completionTime = Math.round((endTime - startTime) / (1000 * 60)); // minutes

      // Calculate section scores
      const sectionsScores: Record<string, number> = {};
      const sections = [...new Set(questions?.map(q => q.section).filter(Boolean) || [])];
      
      sections.forEach(section => {
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
      const thresholdRules = template.threshold_rules || {};
      
      if (thresholdRules.opportunities) {
        Object.entries(thresholdRules.opportunities).forEach(([key, rule]: [string, any]) => {
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

      return {
        assessment,
        template,
        questions: questions || [],
        responses: responses || [],
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
      // Create report entry
      const { data: report, error: createError } = await supabase
        .from('assessment_reports')
        .insert({
          assessment_id: assessmentId,
          report_type: reportType,
          status: 'generating',
          generation_started_at: new Date().toISOString(),
          export_formats: ['html'],
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

        // Update report with generated data
        const { error: updateError } = await supabase
          .from('assessment_reports')
          .update({
            status: 'completed',
            generation_completed_at: new Date().toISOString(),
            report_data: reportData
          })
          .eq('id', report.id);

        if (updateError) throw updateError;

        toast({
          title: "Report Generated",
          description: "Assessment report has been generated successfully.",
        });

        return { success: true, reportId: report.id };

      } catch (error) {
        // Update report with error status
        await supabase
          .from('assessment_reports')
          .update({
            status: 'failed',
            error_details: {
              error: error.message,
              timestamp: new Date().toISOString(),
              step: 'data_generation'
            }
          })
          .eq('id', report.id);

        throw error;
      }

    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate assessment report. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsGenerating(false);
    }
  }, [generateReportData]);

  const retryReportGeneration = useCallback(async (reportId: string): Promise<boolean> => {
    try {
      // Get current report
      const { data: report, error: fetchError } = await supabase
        .from('assessment_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchError) throw fetchError;

      // Check retry limit
      if (report.retry_count >= report.max_retries) {
        toast({
          title: "Retry Limit Exceeded",
          description: "Maximum retry attempts reached for this report.",
          variant: "destructive",
        });
        return false;
      }

      // Update retry status
      await supabase
        .from('assessment_reports')
        .update({
          status: 'retrying',
          retry_count: report.retry_count + 1,
          generation_started_at: new Date().toISOString()
        })
        .eq('id', reportId);

      // Retry generation
      const result = await generateReport(report.assessment_id, report.report_type);
      
      return result.success;

    } catch (error) {
      console.error('Retry failed:', error);
      toast({
        title: "Retry Failed",
        description: "Failed to retry report generation.",
        variant: "destructive",
      });
      return false;
    }
  }, [generateReport]);

  const exportReport = useCallback(async (
    reportId: string,
    options: ExportOptions
  ): Promise<{ success: boolean; downloadUrl?: string }> => {
    setIsExporting(true);

    try {
      // Get report data
      const { data: report, error: fetchError } = await supabase
        .from('assessment_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchError) throw fetchError;

      if (report.status !== 'completed') {
        throw new Error('Report is not ready for export');
      }

      // For demo purposes, we'll simulate different export formats
      let exportContent = '';
      let filename = '';
      let mimeType = '';

      switch (options.format) {
        case 'html':
          exportContent = generateHTMLReport(report.report_data, options);
          filename = `assessment-report-${reportId}.html`;
          mimeType = 'text/html';
          break;

        case 'json':
          exportContent = JSON.stringify(report.report_data, null, 2);
          filename = `assessment-report-${reportId}.json`;
          mimeType = 'application/json';
          break;

        case 'csv':
          exportContent = generateCSVReport(report.report_data, options);
          filename = `assessment-report-${reportId}.csv`;
          mimeType = 'text/csv';
          break;

        case 'pdf':
          // In a real implementation, you would generate PDF here
          // For now, we'll fall back to HTML
          exportContent = generateHTMLReport(report.report_data, options);
          filename = `assessment-report-${reportId}.html`;
          mimeType = 'text/html';
          
          toast({
            title: "PDF Export",
            description: "PDF export not available. Exported as HTML instead.",
          });
          break;

        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Create download blob and URL
      const blob = new Blob([exportContent], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      // Update report export formats
      const updatedFormats = [...new Set([...report.export_formats, options.format])];
      await supabase
        .from('assessment_reports')
        .update({ export_formats: updatedFormats })
        .eq('id', reportId);

      toast({
        title: "Export Ready",
        description: `Report exported as ${options.format.toUpperCase()}.`,
      });

      return { success: true, downloadUrl };

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsExporting(false);
    }
  }, []);

  const generateHTMLReport = useCallback((reportData: any, options: ExportOptions): string => {
    const { assessment, template, summary, recommendations } = reportData;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Assessment Report - ${template.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .score { font-size: 24px; font-weight: bold; color: #2563eb; }
          .recommendations { background: #f8fafc; padding: 20px; border-radius: 8px; }
          .recommendation { margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px; }
          .priority-high { border-left: 4px solid #dc2626; }
          .priority-medium { border-left: 4px solid #f59e0b; }
          .priority-low { border-left: 4px solid #10b981; }
          .priority-critical { border-left: 4px solid #7c2d12; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Assessment Report</h1>
          <h2>${template.name}</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h3>Summary</h3>
          <div class="score">Overall Score: ${summary.percentage.toFixed(1)}%</div>
          <p>Total Score: ${summary.totalScore} / ${summary.maxScore}</p>
          <p>Completion Time: ${summary.completionTime} minutes</p>
        </div>
    `;

    if (Object.keys(summary.sectionsScores).length > 0) {
      html += `
        <div class="section">
          <h3>Section Scores</h3>
          <ul>
      `;
      
      Object.entries(summary.sectionsScores).forEach(([section, score]) => {
        html += `<li>${section}: ${(score as number).toFixed(1)}%</li>`;
      });
      
      html += `
          </ul>
        </div>
      `;
    }

    if (options.includeRecommendations && recommendations.length > 0) {
      html += `
        <div class="section recommendations">
          <h3>Recommendations</h3>
      `;
      
      recommendations.forEach((rec: any) => {
        html += `
          <div class="recommendation priority-${rec.priority}">
            <h4>${rec.title}</h4>
            <p><strong>Category:</strong> ${rec.category}</p>
            <p><strong>Priority:</strong> ${rec.priority.toUpperCase()}</p>
            <p>${rec.description}</p>
            ${rec.estimatedValue ? `<p><strong>Estimated Value:</strong> $${rec.estimatedValue.toLocaleString()}</p>` : ''}
          </div>
        `;
      });
      
      html += `
        </div>
      `;
    }

    html += `
      </body>
      </html>
    `;

    return html;
  }, []);

  const generateCSVReport = useCallback((reportData: any, options: ExportOptions): string => {
    const { assessment, summary, recommendations } = reportData;
    
    let csv = 'Assessment Report\n\n';
    csv += 'Summary\n';
    csv += 'Metric,Value\n';
    csv += `Overall Score,${summary.percentage.toFixed(1)}%\n`;
    csv += `Total Score,${summary.totalScore}\n`;
    csv += `Max Score,${summary.maxScore}\n`;
    csv += `Completion Time,${summary.completionTime} minutes\n\n`;

    if (Object.keys(summary.sectionsScores).length > 0) {
      csv += 'Section Scores\n';
      csv += 'Section,Score\n';
      Object.entries(summary.sectionsScores).forEach(([section, score]) => {
        csv += `${section},${(score as number).toFixed(1)}%\n`;
      });
      csv += '\n';
    }

    if (options.includeRecommendations && recommendations.length > 0) {
      csv += 'Recommendations\n';
      csv += 'Title,Category,Priority,Description,Estimated Value\n';
      recommendations.forEach((rec: any) => {
        csv += `"${rec.title}","${rec.category}","${rec.priority}","${rec.description}","${rec.estimatedValue || 'N/A'}"\n`;
      });
    }

    return csv;
  }, []);

  const sendEmailReport = useCallback(async (
    reportId: string,
    recipients: string[],
    subject?: string,
    message?: string
  ): Promise<boolean> => {
    setIsSendingEmail(true);

    try {
      // Update report with email details
      await supabase
        .from('assessment_reports')
        .update({
          email_recipients: recipients,
          email_sent: false,
          email_errors: []
        })
        .eq('id', reportId);

      // In a real implementation, you would integrate with an email service
      // For demo purposes, we'll simulate email sending
      console.log('Sending email report:', {
        reportId,
        recipients,
        subject: subject || 'Assessment Report',
        message: message || 'Please find your assessment report attached.'
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update as sent (in real implementation, this would be done by email service callback)
      await supabase
        .from('assessment_reports')
        .update({ email_sent: true })
        .eq('id', reportId);

      toast({
        title: "Email Sent",
        description: `Report sent to ${recipients.length} recipient(s).`,
      });

      return true;

    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Log email error
      await supabase
        .from('assessment_reports')
        .update({
          email_errors: [{
            error: error.message,
            timestamp: new Date().toISOString(),
            recipients
          }]
        })
        .eq('id', reportId);

      toast({
        title: "Email Failed",
        description: "Failed to send email report. Please try again.",
        variant: "destructive",
      });

      return false;
    } finally {
      setIsSendingEmail(false);
    }
  }, []);

  return {
    generateReport,
    retryReportGeneration,
    exportReport,
    sendEmailReport,
    generateReportData,
    isGenerating,
    isExporting,
    isSendingEmail
  };
};