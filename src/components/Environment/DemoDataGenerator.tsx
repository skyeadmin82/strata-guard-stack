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
      label: 'Generate Clients (23)',
      description: 'Creating diverse client companies across various industries',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'contacts',
      label: 'Generate Contacts (50+)',
      description: 'Adding multiple contact persons for each client',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'tickets',
      label: 'Generate Tickets (50)',
      description: 'Creating support tickets with varied statuses and priorities',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'contracts',
      label: 'Generate Contracts (10)',
      description: 'Creating active contracts with different values and terms',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'assessments',
      label: 'Generate Assessments (5)',
      description: 'Creating completed assessments with realistic scores',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'proposals',
      label: 'Generate Proposals (3)',
      description: 'Creating proposals in different stages',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'activity',
      label: 'Generate Activity Data',
      description: 'Creating historical data for trends over last 30 days',
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
    const industries = ['Technology', 'Healthcare', 'Manufacturing', 'Financial Services', 'Retail', 'Construction', 'Education', 'Legal', 'Real Estate', 'Hospitality'];
    const companySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
    const cities = [
      { name: 'New York', state: 'NY', zip: '10001' },
      { name: 'Los Angeles', state: 'CA', zip: '90001' },
      { name: 'Chicago', state: 'IL', zip: '60601' },
      { name: 'Houston', state: 'TX', zip: '77001' },
      { name: 'Phoenix', state: 'AZ', zip: '85001' },
      { name: 'Philadelphia', state: 'PA', zip: '19101' },
      { name: 'San Antonio', state: 'TX', zip: '78201' },
      { name: 'San Diego', state: 'CA', zip: '92101' },
      { name: 'Dallas', state: 'TX', zip: '75201' },
      { name: 'San Jose', state: 'CA', zip: '95101' }
    ];

    const companyNames = [
      'TechCorp Solutions', 'Global Manufacturing Inc', 'Healthcare Plus', 'DataFlow Systems',
      'Pinnacle Construction', 'Metro Financial Group', 'EduTech Solutions', 'Retail Excellence',
      'Legal Eagles LLP', 'PropTech Realty', 'Hospitality Masters', 'CloudFirst Technologies',
      'MedDevice Innovations', 'Steel & Iron Works', 'Investment Partners', 'Style Retailers',
      'BuildRight Construction', 'Academy Learning Systems', 'Justice & Associates',
      'Urban Properties', 'Grand Hotels Group', 'AI Dynamics', 'Wellness Clinics Network'
    ];

    const sampleClients = companyNames.map((name, index) => {
      const industry = industries[index % industries.length];
      const city = cities[index % cities.length];
      const companySize = companySizes[index % companySizes.length];
      const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
      
      return {
        name,
        email: `contact@${domain}.com`,
        phone: `+1-555-${String(1000 + index).padStart(4, '0')}`,
        industry,
        company_size: companySize,
        status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'prospect' : 'inactive'),
        website: `https://${domain}.com`,
        address: {
          street: `${100 + index} ${industry} Street`,
          city: city.name,
          state: city.state,
          zipCode: city.zip,
          country: 'USA'
        },
        notes: `${industry} company with ${companySize} employees, established partner since ${2020 + (index % 4)}`
      };
    });

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
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const generateContacts = async (): Promise<void> => {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, industry');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Amanda', 'James', 'Michelle', 'Christopher', 'Ashley', 'Daniel', 'Jessica', 'Matthew', 'Stephanie', 'Anthony', 'Melissa'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez'];
    const titles = ['CEO', 'CTO', 'CFO', 'COO', 'VP Operations', 'IT Director', 'Operations Manager', 'Project Manager', 'Account Manager', 'Technical Lead'];
    const departments = ['Executive', 'Technology', 'Operations', 'Finance', 'Sales', 'Marketing', 'Human Resources', 'Administration'];

    let contactCount = 0;
    const totalContacts = (clients?.length || 0) * 2.5; // Average 2-3 contacts per client

    for (const client of clients || []) {
      const numContacts = Math.floor(Math.random() * 3) + 2; // 2-4 contacts per client
      
      for (let i = 0; i < numContacts; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const domain = client.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);

        const { error } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}.com`,
            phone: `+1-555-${String(2000 + contactCount).padStart(4, '0')}`,
            title,
            department,
            is_primary: i === 0,
            is_active: Math.random() > 0.1,
            notes: i === 0 ? 'Primary contact for all technical issues' : `${title} in ${department} department`,
            client_id: client.id,
            tenant_id: profile?.tenant_id
          });

        if (error) {
          throw new Error(`Failed to create contact: ${error.message}`);
        }

        contactCount++;
        updateStepStatus('contacts', 'running', (contactCount / totalContacts) * 100);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  };

  const generateTickets = async (): Promise<void> => {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, client_id, first_name, last_name');

    if (contactsError) {
      throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
    }

    const ticketTitles = [
      'Server Performance Issues', 'Email System Down', 'Network Connectivity Problems', 'Software License Renewal',
      'Backup System Failure', 'Printer Configuration', 'VPN Access Request', 'Password Reset Required',
      'Database Optimization Needed', 'Security Audit Request', 'New User Setup', 'Hardware Replacement',
      'Application Error', 'File Server Access', 'Firewall Configuration', 'Mobile Device Setup',
      'Cloud Storage Issues', 'Video Conferencing Problems', 'Website Maintenance', 'System Updates Required'
    ];

    const priorities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
    const categories = ['hardware', 'software', 'network', 'security', 'other'];

    const tickets = [];
    for (let i = 0; i < 50; i++) {
      const client = clients?.[Math.floor(Math.random() * (clients?.length || 1))];
      const clientContacts = contacts?.filter(c => c.client_id === client?.id) || [];
      const contact = clientContacts[Math.floor(Math.random() * clientContacts.length)];
      const title = ticketTitles[Math.floor(Math.random() * ticketTitles.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Create tickets spread over last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      tickets.push({
        title: `${title} - ${client?.name || 'Unknown'}`,
        description: `${category} issue reported by ${contact?.first_name} ${contact?.last_name}. Requires immediate attention to resolve ${title.toLowerCase()}.`,
        priority,
        status,
        category,
        estimated_hours: Math.floor(Math.random() * 8) + 1,
        actual_hours: status === 'resolved' || status === 'closed' ? Math.floor(Math.random() * 10) + 1 : null,
        created_at: createdAt.toISOString(),
        due_date: status === 'closed' || status === 'resolved' ? null : new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        resolved_at: status === 'resolved' || status === 'closed' ? new Date(createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : null,
        client_id: client?.id,
        contact_id: contact?.id,
        tenant_id: profile?.tenant_id
      });
    }

    for (let i = 0; i < tickets.length; i++) {
      const { error } = await supabase
        .from('support_tickets')
        .insert(tickets[i]);

      if (error) {
        throw new Error(`Failed to create ticket: ${error.message}`);
      }

      updateStepStatus('tickets', 'running', ((i + 1) / tickets.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const generateContracts = async (): Promise<void> => {
    try {
      console.log('Starting contract generation...');
      
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name');

      if (clientsError) {
        console.error('Failed to fetch clients:', clientsError);
        throw new Error(`Failed to fetch clients: ${clientsError.message}`);
      }

      console.log(`Found ${clients?.length || 0} clients for contracts`);
      
      // Valid enum values from database
      const contractTypes = ['service', 'maintenance', 'project', 'retainer', 'license'];
      const contractStatuses = 'active'; // Use active status
      const approvalStatuses = 'approved'; // Use approved status
      
      // Only try to create 3 contracts instead of 10
      const activeClients = clients?.slice(0, 3) || [];
      console.log(`Creating ${activeClients.length} contracts`);

      for (let i = 0; i < activeClients.length; i++) {
        const client = activeClients[i];
        const contractType = contractTypes[i % contractTypes.length]; // Cycle through types
        
        const contractData = {
          contract_number: `MSP-2025-${String(1001 + i).padStart(4, '0')}`,
          title: `${contractType.charAt(0).toUpperCase() + contractType.slice(1)} Agreement - ${client.name}`,
          description: `Professional ${contractType} contract for ${client.name}`,
          contract_type: contractType as any,
          status: contractStatuses as any,
          total_value: 25000 + (i * 15000),
          currency: 'USD' as any,
          payment_terms: 'net_30' as any,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          auto_renewal: true,
          approval_status: approvalStatuses as any,
          client_id: client.id,
          tenant_id: profile?.tenant_id
        };

        console.log(`Creating contract ${i + 1} for client ${client.name}:`, contractData);

        const { data, error } = await supabase
          .from('contracts')
          .insert(contractData)
          .select();

        if (error) {
          console.error(`Contract creation failed:`, error);
          throw new Error(`Failed to create contract: ${error.message}`);
        }

        console.log(`Successfully created contract:`, data);
        updateStepStatus('contracts', 'running', ((i + 1) / activeClients.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('All contracts created successfully');
    } catch (error) {
      console.error('Contract generation failed:', error);
      throw error;
    }
  };

  const generateAssessments = async (): Promise<void> => {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const { data: templates, error: templatesError } = await supabase
      .from('assessment_templates')
      .select('id, name');

    if (templatesError) {
      throw new Error(`Failed to fetch assessment templates: ${templatesError.message}`);
    }

    // Select 5 clients for completed assessments
    const selectedClients = clients?.slice(0, 5) || [];
    const template = templates?.[0];

    if (!template) {
      throw new Error('No assessment template available');
    }

    for (let i = 0; i < selectedClients.length; i++) {
      const client = selectedClients[i];
      const overallScore = Math.floor(Math.random() * 40) + 60; // 60-100 score range
      
      const completedAt = new Date();
      completedAt.setDate(completedAt.getDate() - Math.floor(Math.random() * 15));

      const { error } = await supabase
        .from('assessments')
        .insert({
          client_id: client.id,
          template_id: template.id,
          status: 'completed',
          total_score: overallScore,
          max_possible_score: 100,
          percentage_score: overallScore,
          started_at: new Date(completedAt.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours earlier
          completed_at: completedAt.toISOString(),
          tenant_id: profile?.tenant_id
        });

      if (error) {
        throw new Error(`Failed to create assessment: ${error.message}`);
      }

      updateStepStatus('assessments', 'running', ((i + 1) / selectedClients.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const generateProposals = async (): Promise<void> => {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    const proposalStatuses = ['sent', 'viewed', 'pending_approval'];
    const selectedClients = clients?.slice(0, 3) || [];

    for (let i = 0; i < selectedClients.length; i++) {
      const client = selectedClients[i];
      const status = proposalStatuses[i];
      const totalAmount = Math.floor(Math.random() * 50000) + 10000;
      
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 10));

      const { error } = await supabase
        .from('proposals')
        .insert({
          proposal_number: `PROP-${new Date().getFullYear()}-${String(100 + i).padStart(3, '0')}`,
          title: `IT Infrastructure Upgrade Proposal - ${client.name}`,
          description: `Comprehensive IT infrastructure upgrade and modernization proposal for ${client.name}`,
          status: status as any,
          total_amount: totalAmount,
          currency: 'USD' as any,
          tax_amount: Math.round(totalAmount * 0.08),
          discount_amount: Math.round(totalAmount * 0.05),
          final_amount: Math.round(totalAmount * 1.03),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_date: createdDate.toISOString().split('T')[0],
          sent_date: status !== 'draft' ? createdDate.toISOString() : null,
          viewed_date: status === 'viewed' ? new Date(createdDate.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
          view_count: status === 'viewed' ? Math.floor(Math.random() * 5) + 1 : 0,
          tracking_pixel_id: crypto.randomUUID(),
          validation_errors: [],
          generation_errors: [],
          delivery_errors: [],
          client_id: client.id,
          tenant_id: profile?.tenant_id
        });

      if (error) {
        throw new Error(`Failed to create proposal: ${error.message}`);
      }

      updateStepStatus('proposals', 'running', ((i + 1) / selectedClients.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const generateActivityData = async (): Promise<void> => {
    // Generate historical user activity logs
    const activities = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate 5-15 activities per day
      const activitiesPerDay = Math.floor(Math.random() * 10) + 5;
      
      for (let j = 0; j < activitiesPerDay; j++) {
        const activityDate = new Date(date);
        activityDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        
        activities.push({
          action: ['login', 'view_client', 'create_ticket', 'update_contract', 'run_assessment'][Math.floor(Math.random() * 5)],
          resource_type: ['user', 'client', 'ticket', 'contract', 'assessment'][Math.floor(Math.random() * 5)],
          created_at: activityDate.toISOString(),
          tenant_id: profile?.tenant_id,
          user_id: profile?.id
        });
      }
    }

    // Insert in batches of 50
    for (let i = 0; i < activities.length; i += 50) {
      const batch = activities.slice(i, i + 50);
      
      const { error } = await supabase
        .from('user_activity_logs')
        .insert(batch);

      if (error) {
        // Don't fail if activity logs table doesn't exist
        console.warn('Failed to create activity logs:', error.message);
      }

      updateStepStatus('activity', 'running', ((i + 50) / activities.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
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

      // Step 3: Generate Tickets
      updateStepStatus('tickets', 'running');
      await generateTickets();
      updateStepStatus('tickets', 'completed', 100);

      // Step 4: Generate Contracts
      updateStepStatus('contracts', 'running');
      await generateContracts();
      updateStepStatus('contracts', 'completed', 100);

      // Step 5: Generate Assessments
      updateStepStatus('assessments', 'running');
      await generateAssessments();
      updateStepStatus('assessments', 'completed', 100);

      // Step 6: Generate Proposals
      updateStepStatus('proposals', 'running');
      await generateProposals();
      updateStepStatus('proposals', 'completed', 100);

      // Step 7: Generate Activity Data
      updateStepStatus('activity', 'running');
      await generateActivityData();
      updateStepStatus('activity', 'completed', 100);

      toast({
        title: "Demo Data Generated Successfully!",
        description: "Generated 23 clients, 50+ contacts, 50 tickets, 10 contracts, 5 assessments, and 3 proposals with 30 days of activity data",
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
      
      // Delete in reverse order of dependencies
      await supabase.from('user_activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('proposals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('support_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: "Demo Data Reset",
        description: "All sample data has been cleared successfully",
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