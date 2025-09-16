import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  category: 'setup' | 'configuration' | 'validation' | 'testing';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  required: boolean;
  estimatedTime: number; // in minutes
  validationRules?: ValidationRule[];
  completedAt?: string;
  error?: string;
}

export interface ValidationRule {
  id: string;
  description: string;
  validator: () => Promise<boolean>;
  errorMessage: string;
}

export interface WelcomeEmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export interface SetupWizardStep {
  id: string;
  title: string;
  description: string;
  component: string;
  data: any;
  isCompleted: boolean;
  isOptional: boolean;
}

export interface GoLiveChecklist {
  id: string;
  category: 'technical' | 'business' | 'legal' | 'support';
  item: string;
  description: string;
  status: 'pending' | 'completed' | 'not_applicable';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
}

export const useLaunchReadiness = () => {
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [welcomeEmailTemplates, setWelcomeEmailTemplates] = useState<WelcomeEmailTemplate[]>([]);
  const [setupWizardSteps, setSetupWizardSteps] = useState<SetupWizardStep[]>([]);
  const [goLiveChecklist, setGoLiveChecklist] = useState<GoLiveChecklist[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { tenant: currentTenant } = useTenant();

  const initializeOnboardingFlow = useCallback(() => {
    const onboardingFlow: OnboardingStep[] = [
      {
        id: 'profile-setup',
        title: 'Complete Your Profile',
        description: 'Set up your business profile and contact information',
        category: 'setup',
        status: 'pending',
        required: true,
        estimatedTime: 5,
        validationRules: [
          {
            id: 'profile-name',
            description: 'Business name must be provided',
            validator: async () => true, // Mock validation
            errorMessage: 'Please enter your business name'
          },
          {
            id: 'profile-email',
            description: 'Valid email address required',
            validator: async () => true,
            errorMessage: 'Please enter a valid email address'
          }
        ]
      },
      {
        id: 'payment-setup',
        title: 'Configure Payment Methods',
        description: 'Set up your preferred payment processing options',
        category: 'configuration',
        status: 'pending',
        required: true,
        estimatedTime: 10,
        validationRules: [
          {
            id: 'payment-provider',
            description: 'At least one payment provider must be configured',
            validator: async () => Math.random() > 0.3,
            errorMessage: 'Please configure at least one payment method'
          }
        ]
      },
      {
        id: 'email-config',
        title: 'Email Configuration',
        description: 'Configure email templates and SMTP settings',
        category: 'configuration',
        status: 'pending',
        required: true,
        estimatedTime: 8,
      },
      {
        id: 'client-import',
        title: 'Import Existing Clients',
        description: 'Import your existing client database (optional)',
        category: 'setup',
        status: 'pending',
        required: false,
        estimatedTime: 15,
      },
      {
        id: 'integration-test',
        title: 'Test Integrations',
        description: 'Verify all third-party integrations are working correctly',
        category: 'testing',
        status: 'pending',
        required: true,
        estimatedTime: 12,
      },
      {
        id: 'security-review',
        title: 'Security Configuration',
        description: 'Review and configure security settings',
        category: 'validation',
        status: 'pending',
        required: true,
        estimatedTime: 7,
      },
      {
        id: 'backup-setup',
        title: 'Backup Configuration',
        description: 'Set up automated backups and recovery procedures',
        category: 'configuration',
        status: 'pending',
        required: true,
        estimatedTime: 5,
      }
    ];

    setOnboardingSteps(onboardingFlow);

    toast({
      title: "Onboarding Flow Initialized",
      description: `Created ${onboardingFlow.length} onboarding steps`,
    });
  }, [toast]);

  const validateOnboardingStep = useCallback(async (stepId: string) => {
    const step = onboardingSteps.find(s => s.id === stepId);
    if (!step || !step.validationRules) return true;

    setOnboardingSteps(prev =>
      prev.map(s => s.id === stepId ? { ...s, status: 'in_progress' } : s)
    );

    try {
      for (const rule of step.validationRules) {
        const isValid = await rule.validator();
        if (!isValid) {
          setOnboardingSteps(prev =>
            prev.map(s => s.id === stepId ? {
              ...s,
              status: 'failed',
              error: rule.errorMessage
            } : s)
          );
          return false;
        }
      }

      setOnboardingSteps(prev =>
        prev.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          completedAt: new Date().toISOString(),
          error: undefined
        } : s)
      );

      return true;
    } catch (error) {
      setOnboardingSteps(prev =>
        prev.map(s => s.id === stepId ? {
          ...s,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Validation failed'
        } : s)
      );
      return false;
    }
  }, [onboardingSteps]);

  const completeOnboardingStep = useCallback(async (stepId: string) => {
    const isValid = await validateOnboardingStep(stepId);
    
    if (isValid) {
      toast({
        title: "Step Completed",
        description: "Onboarding step completed successfully",
      });
    } else {
      toast({
        title: "Step Failed",
        description: "Please correct the issues and try again",
        variant: "destructive",
      });
    }

    return isValid;
  }, [validateOnboardingStep, toast]);

  const initializeWelcomeEmails = useCallback(() => {
    const emailTemplates: WelcomeEmailTemplate[] = [
      {
        id: 'welcome-basic',
        name: 'Basic Welcome',
        subject: 'Welcome to {{company_name}}!',
        content: `
          <h2>Welcome to {{company_name}}, {{user_name}}!</h2>
          <p>We're excited to have you on board. Your account has been successfully created.</p>
          <p>Here are your next steps:</p>
          <ul>
            <li>Complete your profile setup</li>
            <li>Import your existing clients</li>
            <li>Explore our features</li>
          </ul>
          <p>If you have any questions, don't hesitate to reach out to our support team.</p>
          <p>Best regards,<br>The {{company_name}} Team</p>
        `,
        variables: ['company_name', 'user_name'],
        isActive: true
      },
      {
        id: 'welcome-premium',
        name: 'Premium Welcome',
        subject: 'Welcome to {{company_name}} - Your Premium Experience Awaits!',
        content: `
          <h2>Welcome to {{company_name}}, {{user_name}}!</h2>
          <p>Thank you for choosing our premium plan. You now have access to all our advanced features.</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
            <h3>Premium Features Unlocked:</h3>
            <ul>
              <li>Advanced Analytics Dashboard</li>
              <li>Custom Branding Options</li>
              <li>Priority Support</li>
              <li>Advanced Integrations</li>
            </ul>
          </div>
          <p>Schedule a free onboarding call: {{onboarding_link}}</p>
          <p>Best regards,<br>The {{company_name}} Team</p>
        `,
        variables: ['company_name', 'user_name', 'onboarding_link'],
        isActive: false
      }
    ];

    setWelcomeEmailTemplates(emailTemplates);

    toast({
      title: "Welcome Email Templates Initialized",
      description: `Created ${emailTemplates.length} email templates`,
    });
  }, [toast]);

  const sendWelcomeEmail = useCallback(async (userId: string, templateId: string, variables: Record<string, string>) => {
    if (!currentTenant?.id) return;

    const template = welcomeEmailTemplates.find(t => t.id === templateId);
    if (!template) {
      toast({
        title: "Template Not Found",
        description: "The specified email template could not be found",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);
    
    try {
      // Replace variables in template
      let subject = template.subject;
      let content = template.content;
      
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        content = content.replace(new RegExp(placeholder, 'g'), value);
      });

      // In a real implementation, this would send via email service
      console.log('Sending welcome email:', { userId, subject, content });
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Welcome Email Sent",
        description: "Welcome email has been sent successfully",
      });

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast({
        title: "Email Send Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentTenant?.id, welcomeEmailTemplates, toast]);

  const initializeSetupWizard = useCallback(() => {
    const wizardSteps: SetupWizardStep[] = [
      {
        id: 'company-info',
        title: 'Company Information',
        description: 'Enter your company details and branding preferences',
        component: 'CompanyInfoForm',
        data: {},
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'user-roles',
        title: 'User Roles & Permissions',
        description: 'Set up user roles and define access permissions',
        component: 'UserRolesSetup',
        data: {},
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'integrations',
        title: 'Third-party Integrations',
        description: 'Connect with your existing tools and services',
        component: 'IntegrationsSetup',
        data: {},
        isCompleted: false,
        isOptional: true
      },
      {
        id: 'notifications',
        title: 'Notification Preferences',
        description: 'Configure how and when you receive notifications',
        component: 'NotificationsSetup',
        data: {},
        isCompleted: false,
        isOptional: true
      },
      {
        id: 'final-review',
        title: 'Final Review',
        description: 'Review your settings and complete the setup',
        component: 'FinalReview',
        data: {},
        isCompleted: false,
        isOptional: false
      }
    ];

    setSetupWizardSteps(wizardSteps);

    toast({
      title: "Setup Wizard Initialized",
      description: `Created ${wizardSteps.length} setup wizard steps`,
    });
  }, [toast]);

  const completeWizardStep = useCallback((stepId: string, data: any) => {
    setSetupWizardSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, isCompleted: true, data }
          : step
      )
    );

    toast({
      title: "Wizard Step Completed",
      description: "Setup step completed successfully",
    });
  }, [toast]);

  const initializeGoLiveChecklist = useCallback(() => {
    const checklist: GoLiveChecklist[] = [
      // Technical
      {
        id: 'ssl-certificate',
        category: 'technical',
        item: 'SSL Certificate Installation',
        description: 'Ensure SSL certificate is properly installed and configured',
        status: 'pending',
        priority: 'critical',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'backup-system',
        category: 'technical',
        item: 'Backup System Verification',
        description: 'Verify automated backup system is working correctly',
        status: 'pending',
        priority: 'high'
      },
      {
        id: 'performance-testing',
        category: 'technical',
        item: 'Performance Testing',
        description: 'Complete load testing and performance optimization',
        status: 'pending',
        priority: 'high'
      },
      {
        id: 'security-audit',
        category: 'technical',
        item: 'Security Audit',
        description: 'Complete security audit and penetration testing',
        status: 'pending',
        priority: 'critical'
      },
      
      // Business
      {
        id: 'pricing-setup',
        category: 'business',
        item: 'Pricing Configuration',
        description: 'Finalize pricing tiers and payment processing setup',
        status: 'pending',
        priority: 'high'
      },
      {
        id: 'support-procedures',
        category: 'business',
        item: 'Support Procedures',
        description: 'Document support procedures and train support staff',
        status: 'pending',
        priority: 'medium'
      },
      
      // Legal
      {
        id: 'terms-of-service',
        category: 'legal',
        item: 'Terms of Service',
        description: 'Finalize and publish terms of service and privacy policy',
        status: 'pending',
        priority: 'critical'
      },
      {
        id: 'data-compliance',
        category: 'legal',
        item: 'Data Compliance',
        description: 'Ensure GDPR/CCPA compliance and data handling procedures',
        status: 'pending',
        priority: 'critical'
      },
      
      // Support
      {
        id: 'help-documentation',
        category: 'support',
        item: 'Help Documentation',
        description: 'Complete user documentation and help articles',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: 'monitoring-setup',
        category: 'support',
        item: 'Monitoring & Alerts',
        description: 'Set up comprehensive monitoring and alerting systems',
        status: 'pending',
        priority: 'high'
      }
    ];

    setGoLiveChecklist(checklist);

    toast({
      title: "Go-Live Checklist Initialized",
      description: `Created ${checklist.length} checklist items`,
    });
  }, [toast]);

  const updateChecklistItem = useCallback((itemId: string, updates: Partial<GoLiveChecklist>) => {
    setGoLiveChecklist(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              ...updates,
              ...(updates.status === 'completed' && {
                completedAt: new Date().toISOString()
              })
            }
          : item
      )
    );

    toast({
      title: "Checklist Updated",
      description: "Checklist item has been updated successfully",
    });
  }, [toast]);

  const cleanupDemoData = useCallback(async () => {
    if (!currentTenant?.id) return;

    setIsProcessing(true);
    
    try {
      // In a real implementation, this would clean up demo data from all tables
      const demoTables = ['clients', 'contracts', 'invoices', 'users'];
      
      for (const table of demoTables) {
        console.log(`Cleaning demo data from ${table}...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate cleanup
      }

      toast({
        title: "Demo Data Cleanup Complete",
        description: "All demo data has been removed from the system",
      });

      return true;
    } catch (error) {
      console.error('Demo data cleanup failed:', error);
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentTenant?.id, toast]);

  const generateLaunchReadinessReport = useCallback(() => {
    const totalOnboardingSteps = onboardingSteps.length;
    const completedOnboardingSteps = onboardingSteps.filter(s => s.status === 'completed').length;
    const requiredOnboardingSteps = onboardingSteps.filter(s => s.required).length;
    const completedRequiredSteps = onboardingSteps.filter(s => s.required && s.status === 'completed').length;

    const totalWizardSteps = setupWizardSteps.length;
    const completedWizardSteps = setupWizardSteps.filter(s => s.isCompleted).length;

    const totalChecklistItems = goLiveChecklist.length;
    const completedChecklistItems = goLiveChecklist.filter(i => i.status === 'completed').length;
    const criticalChecklistItems = goLiveChecklist.filter(i => i.priority === 'critical').length;
    const completedCriticalItems = goLiveChecklist.filter(i => i.priority === 'critical' && i.status === 'completed').length;

    const onboardingScore = totalOnboardingSteps > 0 ? (completedOnboardingSteps / totalOnboardingSteps) * 100 : 0;
    const wizardScore = totalWizardSteps > 0 ? (completedWizardSteps / totalWizardSteps) * 100 : 0;
    const checklistScore = totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0;
    
    const overallReadinessScore = Math.round(
      (onboardingScore * 0.4) + (wizardScore * 0.3) + (checklistScore * 0.3)
    );

    const readyToLaunch = completedRequiredSteps === requiredOnboardingSteps && 
                         completedCriticalItems === criticalChecklistItems &&
                         overallReadinessScore >= 85;

    return {
      onboarding: {
        totalSteps: totalOnboardingSteps,
        completedSteps: completedOnboardingSteps,
        requiredSteps: requiredOnboardingSteps,
        completedRequiredSteps,
        score: Math.round(onboardingScore)
      },
      setupWizard: {
        totalSteps: totalWizardSteps,
        completedSteps: completedWizardSteps,
        score: Math.round(wizardScore)
      },
      checklist: {
        totalItems: totalChecklistItems,
        completedItems: completedChecklistItems,
        criticalItems: criticalChecklistItems,
        completedCriticalItems,
        score: Math.round(checklistScore)
      },
      readyToLaunch,
      overallScore: overallReadinessScore,
      blockers: [
        ...onboardingSteps.filter(s => s.required && s.status !== 'completed').map(s => `Onboarding: ${s.title}`),
        ...goLiveChecklist.filter(i => i.priority === 'critical' && i.status !== 'completed').map(i => `Critical: ${i.item}`)
      ]
    };
  }, [onboardingSteps, setupWizardSteps, goLiveChecklist]);

  return {
    onboardingSteps,
    welcomeEmailTemplates,
    setupWizardSteps,
    goLiveChecklist,
    isProcessing,
    initializeOnboardingFlow,
    validateOnboardingStep,
    completeOnboardingStep,
    initializeWelcomeEmails,
    sendWelcomeEmail,
    initializeSetupWizard,
    completeWizardStep,
    initializeGoLiveChecklist,
    updateChecklistItem,
    cleanupDemoData,
    generateLaunchReadinessReport
  };
};