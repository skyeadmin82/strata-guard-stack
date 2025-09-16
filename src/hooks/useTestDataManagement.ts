import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'pending' | 'running' | 'passed' | 'failed';
  data: any;
  expectedResults: any;
  actualResults?: any;
  duration?: number;
  createdAt: string;
}

export interface ValidationRule {
  field: string;
  rule: string;
  expected: any;
  actual?: any;
  status: 'pending' | 'passed' | 'failed';
}

export interface LoadTestConfig {
  concurrent_users: number;
  duration_minutes: number;
  ramp_up_seconds: number;
  target_endpoint: string;
  expected_response_time_ms: number;
}

export const useTestDataManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadTesting, setIsLoadTesting] = useState(false);
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationRule[]>([]);
  const { toast } = useToast();
  const { tenant: currentTenant } = useTenant();

  const generateTestData = useCallback(async (dataType: string, count: number = 100) => {
    if (!currentTenant?.id) return;
    
    setIsGenerating(true);
    try {
      const generators = {
        clients: () => ({
          name: `Test Client ${Math.floor(Math.random() * 1000)}`,
          email: `client${Math.floor(Math.random() * 1000)}@test.com`,
          phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          industry: ['Technology', 'Healthcare', 'Finance', 'Retail'][Math.floor(Math.random() * 4)],
          company_size: ['Small', 'Medium', 'Large', 'Enterprise'][Math.floor(Math.random() * 4)],
          status: 'active',
          tenant_id: currentTenant.id,
          address: {
            street: `${Math.floor(Math.random() * 999)} Test St`,
            city: 'Test City',
            state: 'TS',
            zip: String(Math.floor(Math.random() * 90000) + 10000)
          }
        }),
        
        contracts: () => ({
          contract_number: `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: `Test Contract ${Math.floor(Math.random() * 1000)}`,
          contract_type: ['service', 'maintenance', 'support'][Math.floor(Math.random() * 3)],
          status: ['draft', 'active', 'completed'][Math.floor(Math.random() * 3)],
          total_value: Math.floor(Math.random() * 100000) + 1000,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tenant_id: currentTenant.id
        }),
        
        invoices: () => ({
          invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          amount: Math.floor(Math.random() * 10000) + 100,
          currency: 'USD',
          status: ['draft', 'sent', 'paid', 'overdue'][Math.floor(Math.random() * 4)],
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tenant_id: currentTenant.id
        })
      };

      const generator = generators[dataType];
      if (!generator) {
        throw new Error(`Unknown data type: ${dataType}`);
      }

      const testData: any[] = [];
      for (let i = 0; i < count; i++) {
        testData.push(generator());
      }
      
      // Insert test data - use type assertion for dynamic table names
      const { error } = await supabase
        .from(dataType as any)
        .insert(testData);

      if (error) throw error;

      toast({
        title: "Test Data Generated",
        description: `Successfully generated ${count} test ${dataType} records`,
      });

      return testData;
    } catch (error) {
      console.error('Test data generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentTenant?.id, toast]);

  const validateData = useCallback(async (tableName: string, rules: Omit<ValidationRule, 'status'>[]) => {
    if (!currentTenant?.id) return;
    
    setIsValidating(true);
    try {
      const results: ValidationRule[] = [];
      
      for (const rule of rules) {
        let query = supabase.from(tableName as any).select('*', { count: 'exact' });
        
        // Apply tenant filter
        query = query.eq('tenant_id', currentTenant.id);
        
        // Apply validation rule
        switch (rule.rule) {
          case 'not_null':
            query = query.not(rule.field, 'is', null);
            break;
          case 'unique':
            // Check for duplicates
            const { data: duplicates } = await supabase
              .from(tableName as any)
              .select(rule.field, { count: 'exact' })
              .eq('tenant_id', currentTenant.id)
              .not(rule.field, 'is', null);
            
            const uniqueValues = new Set(duplicates?.map(item => item[rule.field]));
            results.push({
              ...rule,
              actual: uniqueValues.size === duplicates?.length,
              status: uniqueValues.size === duplicates?.length ? 'passed' : 'failed'
            });
            continue;
          case 'min_length':
            query = query.gte(rule.field, rule.expected);
            break;
          case 'max_length':
            query = query.lte(rule.field, rule.expected);
            break;
          case 'format_email':
            query = query.like(rule.field, '%@%.%');
            break;
        }
        
        const { count, error } = await query;
        if (error) throw error;
        
        results.push({
          ...rule,
          actual: count,
          status: count === rule.expected ? 'passed' : 'failed'
        });
      }
      
      setValidationResults(results);
      
      const passedCount = results.filter(r => r.status === 'passed').length;
      toast({
        title: "Data Validation Complete",
        description: `${passedCount}/${results.length} validation rules passed`,
        variant: passedCount === results.length ? "default" : "destructive",
      });
      
      return results;
    } catch (error) {
      console.error('Data validation failed:', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }, [currentTenant?.id, toast]);

  const runLoadTest = useCallback(async (config: LoadTestConfig) => {
    setIsLoadTesting(true);
    try {
      const startTime = Date.now();
      const results = [];
      
      // Simulate load test
      for (let i = 0; i < config.concurrent_users; i++) {
        const userStartTime = Date.now();
        
        // Simulate API calls
        try {
          const response = await fetch(config.target_endpoint);
          const responseTime = Date.now() - userStartTime;
          
          results.push({
            user: i + 1,
            responseTime,
            status: response.status,
            success: response.ok
          });
        } catch (error) {
          results.push({
            user: i + 1,
            responseTime: Date.now() - userStartTime,
            status: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const successRate = results.filter(r => r.success).length / results.length * 100;
      
      toast({
        title: "Load Test Complete",
        description: `Avg response time: ${avgResponseTime.toFixed(2)}ms, Success rate: ${successRate.toFixed(1)}%`,
        variant: avgResponseTime <= config.expected_response_time_ms ? "default" : "destructive",
      });
      
      return {
        duration: Date.now() - startTime,
        avgResponseTime,
        successRate,
        results
      };
    } catch (error) {
      console.error('Load test failed:', error);
      toast({
        title: "Load Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsLoadTesting(false);
    }
  }, [toast]);

  const createTestScenario = useCallback(async (scenario: Omit<TestScenario, 'id' | 'createdAt'>) => {
    const newScenario: TestScenario = {
      ...scenario,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    setTestScenarios(prev => [...prev, newScenario]);
    return newScenario;
  }, []);

  const runTestScenario = useCallback(async (scenarioId: string) => {
    const scenario = testScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;
    
    setTestScenarios(prev => 
      prev.map(s => s.id === scenarioId ? { ...s, status: 'running' } : s)
    );
    
    try {
      const startTime = Date.now();
      
      // Simulate test execution based on type
      let actualResults;
      switch (scenario.type) {
        case 'unit':
          actualResults = await simulateUnitTest(scenario.data);
          break;
        case 'integration':
          actualResults = await simulateIntegrationTest(scenario.data);
          break;
        case 'e2e':
          actualResults = await simulateE2ETest(scenario.data);
          break;
        case 'performance':
          actualResults = await simulatePerformanceTest(scenario.data);
          break;
        case 'security':
          actualResults = await simulateSecurityTest(scenario.data);
          break;
        default:
          throw new Error(`Unknown test type: ${scenario.type}`);
      }
      
      const duration = Date.now() - startTime;
      const status = JSON.stringify(actualResults) === JSON.stringify(scenario.expectedResults) ? 'passed' : 'failed';
      
      setTestScenarios(prev =>
        prev.map(s => s.id === scenarioId ? {
          ...s,
          status,
          actualResults,
          duration
        } : s)
      );
      
      return { status, actualResults, duration };
    } catch (error) {
      setTestScenarios(prev =>
        prev.map(s => s.id === scenarioId ? {
          ...s,
          status: 'failed',
          actualResults: { error: error instanceof Error ? error.message : 'Unknown error' }
        } : s)
      );
    }
  }, [testScenarios]);

  // Simulation functions
  const simulateUnitTest = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { result: 'unit test passed', data };
  };

  const simulateIntegrationTest = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { result: 'integration test passed', data };
  };

  const simulateE2ETest = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { result: 'e2e test passed', data };
  };

  const simulatePerformanceTest = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { result: 'performance test passed', responseTime: Math.random() * 1000, data };
  };

  const simulateSecurityTest = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { result: 'security test passed', vulnerabilities: [], data };
  };

  const cleanupTestData = useCallback(async (dataType: string) => {
    if (!currentTenant?.id) return;
    
    try {
      const { error } = await supabase
        .from(dataType as any)
        .delete()
        .eq('tenant_id', currentTenant.id)
        .like('name', 'Test %');

      if (error) throw error;

      toast({
        title: "Test Data Cleaned",
        description: `Removed test data from ${dataType} table`,
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  }, [currentTenant?.id, toast]);

  return {
    generateTestData,
    validateData,
    runLoadTest,
    createTestScenario,
    runTestScenario,
    cleanupTestData,
    testScenarios,
    validationResults,
    isGenerating,
    isValidating,
    isLoadTesting
  };
};