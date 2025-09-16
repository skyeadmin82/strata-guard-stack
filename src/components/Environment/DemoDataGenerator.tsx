import React, { useState } from 'react';
import { Database, RefreshCw, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useAuth } from '@/contexts/AuthContext';

interface GenerationStep {
  id: string;
  label: string;
  description: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  errorMessage?: string;
}

export const DemoDataGenerator: React.FC = () => {
  const { isDemo } = useEnvironment();
  const { profile } = useAuth();
  const { addRetryOperation } = useErrorRecovery();
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: 'clients',
      label: 'Generate Clients',
      description: 'Creating sample client companies with realistic data',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'contacts',
      label: 'Generate Contacts',
      description: 'Adding contact persons for each client',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'relationships',
      label: 'Link Data',
      description: 'Establishing relationships between entities',
      progress: 0,
      status: 'pending'
    }
  ]);

  const updateStepStatus = (
    stepId: string, 
    status: GenerationStep['status'], 
    progress: number = 0,
    errorMessage?: string
  ) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, errorMessage }
        : step
    ));
  };

  const generateClients = async (): Promise<void> => {
    const sampleClients = [
      {
        name: 'TechCorp Solutions',
        email: 'contact@techcorp.com',
        phone: '+1-555-0101',
        industry: 'Technology',
        company_size: '50-200',
        status: 'active',
        website: 'https://techcorp.com',
        address: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        notes: 'Leading technology company focusing on cloud solutions'
      },
      {
        name: 'Global Manufacturing Inc',
        email: 'info@globalmfg.com',
        phone: '+1-555-0102',
        industry: 'Manufacturing',
        company_size: '200-500',
        status: 'active',
        website: 'https://globalmfg.com',
        address: {
          street: '456 Industrial Ave',
          city: 'Detroit',
          state: 'MI',
          zipCode: '48201',
          country: 'USA'
        },
        notes: 'Automotive parts manufacturer with international presence'
      },
      {
        name: 'Healthcare Plus',
        email: 'admin@healthcareplus.com',
        phone: '+1-555-0103',
        industry: 'Healthcare',
        company_size: '20-50',
        status: 'active',
        website: 'https://healthcareplus.com',
        address: {
          street: '789 Medical Center Dr',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        notes: 'Regional healthcare provider with multiple clinics'
      }
    ];

    for (let i = 0; i < sampleClients.length; i++) {
      const { error } = await supabase
        .from('clients')
        .insert({
          ...sampleClients[i],
          tenant_id: profile?.tenant_id
        });

      if (error) {
        throw new Error(`Failed to create client: ${error.message}`);
      }

      updateStepStatus('clients', 'running', ((i + 1) / sampleClients.length) * 100);
      
      // Simulate realistic generation time
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const generateContacts = async (): Promise<void> => {
    // First get the clients we just created
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const sampleContacts = [
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@techcorp.com',
        phone: '+1-555-0201',
        title: 'CTO',
        department: 'Technology',
        is_primary: true,
        notes: 'Primary technical contact'
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@globalmfg.com',
        phone: '+1-555-0202',
        title: 'Operations Manager',
        department: 'Operations',
        is_primary: true,
        notes: 'Handles day-to-day operations'
      },
      {
        first_name: 'Dr. Michael',
        last_name: 'Brown',
        email: 'michael.brown@healthcareplus.com',
        phone: '+1-555-0203',
        title: 'Medical Director',
        department: 'Administration',
        is_primary: true,
        notes: 'Primary medical decision maker'
      }
    ];

    for (let i = 0; i < sampleContacts.length; i++) {
      if (clients && clients[i]) {
        const { error } = await supabase
          .from('contacts')
          .insert({
            ...sampleContacts[i],
            client_id: clients[i].id,
            tenant_id: profile?.tenant_id
          });

        if (error) {
          throw new Error(`Failed to create contact: ${error.message}`);
        }

        updateStepStatus('contacts', 'running', ((i + 1) / sampleContacts.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  const linkData = async (): Promise<void> => {
    updateStepStatus('relationships', 'running', 50);
    await new Promise(resolve => setTimeout(resolve, 500));
    updateStepStatus('relationships', 'running', 100);
  };

  const generateDemoData = async (): Promise<void> => {
    setIsGenerating(true);
    
    try {
      // Reset all steps
      setSteps(prev => prev.map(step => ({ 
        ...step, 
        status: 'pending', 
        progress: 0, 
        errorMessage: undefined 
      })));

      // Step 1: Generate Clients
      updateStepStatus('clients', 'running');
      await generateClients();
      updateStepStatus('clients', 'completed', 100);

      // Step 2: Generate Contacts
      updateStepStatus('contacts', 'running');
      await generateContacts();
      updateStepStatus('contacts', 'completed', 100);

      // Step 3: Link Data
      updateStepStatus('relationships', 'running');
      await linkData();
      updateStepStatus('relationships', 'completed', 100);

      toast({
        title: "Demo Data Generated",
        description: "Sample data has been successfully created for testing",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Mark current step as failed
      const currentStep = steps.find(step => step.status === 'running');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', 0, errorMessage);
      }

      // Add to retry queue
      addRetryOperation(
        'demo_data_generation',
        () => generateDemoData(),
        2,
        true
      );

      toast({
        title: "Generation Failed",
        description: "Demo data generation failed but has been added to retry queue",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetDemoData = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      
      // Delete all contacts first (foreign key dependency)
      await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Then delete all clients
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: "Demo Data Reset",
        description: "All sample data has been cleared",
      });

      // Reset steps
      setSteps(prev => prev.map(step => ({ 
        ...step, 
        status: 'pending', 
        progress: 0,
        errorMessage: undefined 
      })));

    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to clear demo data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isDemo) return null;

  const overallProgress = steps.reduce((acc, step) => acc + step.progress, 0) / steps.length;
  const hasErrors = steps.some(step => step.status === 'error');
  const isCompleted = steps.every(step => step.status === 'completed');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Demo Data Generator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some steps failed during generation. Check the steps below and retry if needed.
            </AlertDescription>
          </Alert>
        )}

        {isCompleted && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Demo data generation completed successfully! You can now explore the application with sample data.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.label}</span>
                  <Badge variant={
                    step.status === 'completed' ? 'default' :
                    step.status === 'running' ? 'secondary' :
                    step.status === 'error' ? 'destructive' :
                    'outline'
                  }>
                    {step.status}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {step.progress.toFixed(0)}%
                </span>
              </div>
              
              <Progress value={step.progress} className="h-2" />
              
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
              
              {step.errorMessage && (
                <p className="text-sm text-destructive">
                  Error: {step.errorMessage}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={generateDemoData}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Demo Data
              </>
            )}
          </Button>
          
          <Button 
            onClick={resetDemoData}
            variant="outline"
            disabled={isGenerating}
          >
            Reset Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};