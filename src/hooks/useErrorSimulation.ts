import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';

export interface ErrorScenario {
  id: string;
  name: string;
  type: 'network' | 'database' | 'api_timeout' | 'concurrent_users' | 'data_corruption';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: any;
  results?: any;
  duration?: number;
  createdAt: string;
}

export interface NetworkFailureConfig {
  failure_rate: number; // 0-1
  timeout_ms: number;
  retry_attempts: number;
  endpoints: string[];
}

export interface DatabaseErrorConfig {
  error_type: 'connection_lost' | 'query_timeout' | 'constraint_violation' | 'deadlock';
  tables: string[];
  duration_seconds: number;
}

export interface ConcurrentUserConfig {
  user_count: number;
  actions_per_user: number;
  duration_minutes: number;
  target_endpoints: string[];
}

export const useErrorSimulation = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorScenarios, setErrorScenarios] = useState<ErrorScenario[]>([]);
  const [simulationResults, setSimulationResults] = useState<any[]>([]);
  const { toast } = useToast();
  const { tenant: currentTenant } = useTenant();

  const simulateNetworkFailure = useCallback(async (config: NetworkFailureConfig) => {
    setIsSimulating(true);
    try {
      const startTime = Date.now();
      const results = [];

      for (const endpoint of config.endpoints) {
        for (let attempt = 0; attempt < config.retry_attempts; attempt++) {
          const shouldFail = Math.random() < config.failure_rate;
          const requestStart = Date.now();

          if (shouldFail) {
            // Simulate network failure
            await new Promise(resolve => setTimeout(resolve, config.timeout_ms));
            results.push({
              endpoint,
              attempt: attempt + 1,
              status: 'failed',
              error: 'Network timeout',
              duration: config.timeout_ms
            });
          } else {
            // Simulate successful request
            const responseTime = Math.random() * 200 + 50;
            await new Promise(resolve => setTimeout(resolve, responseTime));
            results.push({
              endpoint,
              attempt: attempt + 1,
              status: 'success',
              duration: responseTime
            });
            break; // Success, no need to retry
          }
        }
      }

      const duration = Date.now() - startTime;
      const failureRate = results.filter(r => r.status === 'failed').length / results.length;

      toast({
        title: "Network Failure Simulation Complete",
        description: `Failure rate: ${(failureRate * 100).toFixed(1)}%, Duration: ${duration}ms`,
        variant: failureRate > 0.5 ? "destructive" : "default",
      });

      return {
        duration,
        failureRate,
        totalRequests: results.length,
        results
      };
    } catch (error) {
      console.error('Network simulation failed:', error);
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  }, [toast]);

  const simulateDatabaseError = useCallback(async (config: DatabaseErrorConfig) => {
    if (!currentTenant?.id) return;
    
    setIsSimulating(true);
    try {
      const startTime = Date.now();
      const results = [];

      // Log the simulation start
      const { error: logError } = await supabase
        .from('error_logs')
        .insert({
          tenant_id: currentTenant.id,
          error_type: 'database_simulation',
          error_message: `Simulating ${config.error_type} for ${config.duration_seconds}s`,
          context: {
            simulation: true,
            config,
            timestamp: new Date().toISOString()
          },
          environment: 'demo'
        });

      if (logError) console.error('Failed to log simulation:', logError);

      // Simulate different database errors
      switch (config.error_type) {
        case 'connection_lost':
          await simulateConnectionLoss(config);
          break;
        case 'query_timeout':
          await simulateQueryTimeout(config);
          break;
        case 'constraint_violation':
          await simulateConstraintViolation(config);
          break;
        case 'deadlock':
          await simulateDeadlock(config);
          break;
      }

      await new Promise(resolve => setTimeout(resolve, config.duration_seconds * 1000));

      const duration = Date.now() - startTime;

      toast({
        title: "Database Error Simulation Complete",
        description: `Simulated ${config.error_type} for ${config.duration_seconds} seconds`,
      });

      return {
        duration,
        errorType: config.error_type,
        affectedTables: config.tables,
        recoveryTime: duration
      };
    } catch (error) {
      console.error('Database simulation failed:', error);
      toast({
        title: "Database Simulation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  }, [currentTenant?.id, toast]);

  const simulateApiTimeout = useCallback(async (endpoints: string[], timeoutMs: number = 5000) => {
    setIsSimulating(true);
    try {
      const startTime = Date.now();
      const results = [];

      for (const endpoint of endpoints) {
        const requestStart = Date.now();
        
        try {
          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
          });

          // Simulate API call with timeout
          const apiCall = new Promise(resolve => {
            setTimeout(() => resolve({ status: 'success' }), Math.random() * (timeoutMs * 2));
          });

          await Promise.race([apiCall, timeoutPromise]);
          
          results.push({
            endpoint,
            status: 'success',
            duration: Date.now() - requestStart
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'timeout',
            duration: Date.now() - requestStart,
            error: error instanceof Error ? error.message : 'Timeout'
          });
        }
      }

      const duration = Date.now() - startTime;
      const timeoutRate = results.filter(r => r.status === 'timeout').length / results.length;

      toast({
        title: "API Timeout Simulation Complete",
        description: `Timeout rate: ${(timeoutRate * 100).toFixed(1)}%`,
        variant: timeoutRate > 0.3 ? "destructive" : "default",
      });

      return {
        duration,
        timeoutRate,
        totalRequests: results.length,
        results
      };
    } catch (error) {
      console.error('API timeout simulation failed:', error);
      toast({
        title: "API Simulation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  }, [toast]);

  const simulateConcurrentUsers = useCallback(async (config: ConcurrentUserConfig) => {
    setIsSimulating(true);
    try {
      const startTime = Date.now();
      const userPromises = [];

      // Create concurrent user simulations
      for (let i = 0; i < config.user_count; i++) {
        const userSimulation = simulateUserSession(i + 1, config);
        userPromises.push(userSimulation);
      }

      const userResults = await Promise.all(userPromises);
      const duration = Date.now() - startTime;

      const totalActions = userResults.reduce((sum, user) => sum + user.completedActions, 0);
      const totalErrors = userResults.reduce((sum, user) => sum + user.errors, 0);
      const errorRate = totalErrors / totalActions;

      toast({
        title: "Concurrent User Simulation Complete",
        description: `${config.user_count} users, ${totalActions} actions, ${(errorRate * 100).toFixed(1)}% error rate`,
        variant: errorRate > 0.1 ? "destructive" : "default",
      });

      return {
        duration,
        totalUsers: config.user_count,
        totalActions,
        totalErrors,
        errorRate,
        userResults
      };
    } catch (error) {
      console.error('Concurrent user simulation failed:', error);
      toast({
        title: "Concurrent Simulation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  }, [toast]);

  const simulateDataCorruption = useCallback(async (tableName: string, corruptionType: 'missing_fields' | 'invalid_data' | 'orphaned_records') => {
    if (!currentTenant?.id) return;
    
    setIsSimulating(true);
    try {
      const startTime = Date.now();
      
      // Log the simulation
      const { error: logError } = await supabase
        .from('error_logs')
        .insert({
          tenant_id: currentTenant.id,
          error_type: 'data_corruption_simulation',
          error_message: `Simulating ${corruptionType} in ${tableName}`,
          context: {
            simulation: true,
            tableName,
            corruptionType,
            timestamp: new Date().toISOString()
          },
          environment: 'demo'
        });

      if (logError) console.error('Failed to log simulation:', logError);

      // Simulate data corruption detection and recovery
      let detectionResults;
      switch (corruptionType) {
        case 'missing_fields':
          detectionResults = await detectMissingFields(tableName);
          break;
        case 'invalid_data':
          detectionResults = await detectInvalidData(tableName);
          break;
        case 'orphaned_records':
          detectionResults = await detectOrphanedRecords(tableName);
          break;
      }

      const duration = Date.now() - startTime;

      toast({
        title: "Data Corruption Simulation Complete",
        description: `Detected ${detectionResults.issues} issues in ${tableName}`,
        variant: detectionResults.issues > 0 ? "destructive" : "default",
      });

      return {
        duration,
        tableName,
        corruptionType,
        ...detectionResults
      };
    } catch (error) {
      console.error('Data corruption simulation failed:', error);
      toast({
        title: "Corruption Simulation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  }, [currentTenant?.id, toast]);

  // Helper simulation functions
  const simulateConnectionLoss = async (config: DatabaseErrorConfig) => {
    // Simulate connection recovery attempts
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Connection recovery attempt ${i + 1}/3`);
    }
  };

  const simulateQueryTimeout = async (config: DatabaseErrorConfig) => {
    // Simulate slow queries on specified tables
    for (const table of config.tables) {
      console.log(`Simulating slow query on ${table}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const simulateConstraintViolation = async (config: DatabaseErrorConfig) => {
    // Simulate constraint violation attempts
    console.log('Simulating constraint violations');
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const simulateDeadlock = async (config: DatabaseErrorConfig) => {
    // Simulate deadlock scenario
    console.log('Simulating database deadlock');
    await new Promise(resolve => setTimeout(resolve, 3000));
  };

  const simulateUserSession = async (userId: number, config: ConcurrentUserConfig) => {
    const results = {
      userId,
      completedActions: 0,
      errors: 0,
      duration: 0
    };

    const startTime = Date.now();
    
    for (let action = 0; action < config.actions_per_user; action++) {
      try {
        // Simulate random API calls
        const endpoint = config.target_endpoints[Math.floor(Math.random() * config.target_endpoints.length)];
        const actionDelay = Math.random() * 1000 + 100;
        
        await new Promise(resolve => setTimeout(resolve, actionDelay));
        
        // Random chance of error (increases with concurrent load)
        const errorChance = Math.min(0.1 + (config.user_count / 100), 0.3);
        if (Math.random() < errorChance) {
          results.errors++;
        }
        
        results.completedActions++;
      } catch (error) {
        results.errors++;
      }
    }

    results.duration = Date.now() - startTime;
    return results;
  };

  const detectMissingFields = async (tableName: string) => {
    // Simulate missing field detection
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      issues: Math.floor(Math.random() * 5),
      missingFields: ['field1', 'field2'],
      recoverable: true
    };
  };

  const detectInvalidData = async (tableName: string) => {
    // Simulate invalid data detection
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      issues: Math.floor(Math.random() * 10),
      invalidRecords: Math.floor(Math.random() * 20),
      recoverable: true
    };
  };

  const detectOrphanedRecords = async (tableName: string) => {
    // Simulate orphaned record detection
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      issues: Math.floor(Math.random() * 3),
      orphanedRecords: Math.floor(Math.random() * 15),
      recoverable: false
    };
  };

  const createErrorScenario = useCallback(async (scenario: Omit<ErrorScenario, 'id' | 'createdAt'>) => {
    const newScenario: ErrorScenario = {
      ...scenario,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    setErrorScenarios(prev => [...prev, newScenario]);
    return newScenario;
  }, []);

  const runErrorScenario = useCallback(async (scenarioId: string) => {
    const scenario = errorScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    setErrorScenarios(prev =>
      prev.map(s => s.id === scenarioId ? { ...s, status: 'running' } : s)
    );

    try {
      const startTime = Date.now();
      let results;

      switch (scenario.type) {
        case 'network':
          results = await simulateNetworkFailure(scenario.config);
          break;
        case 'database':
          results = await simulateDatabaseError(scenario.config);
          break;
        case 'api_timeout':
          results = await simulateApiTimeout(scenario.config.endpoints, scenario.config.timeout_ms);
          break;
        case 'concurrent_users':
          results = await simulateConcurrentUsers(scenario.config);
          break;
        case 'data_corruption':
          results = await simulateDataCorruption(scenario.config.table_name, scenario.config.corruption_type);
          break;
        default:
          throw new Error(`Unknown error scenario type: ${scenario.type}`);
      }

      const duration = Date.now() - startTime;

      setErrorScenarios(prev =>
        prev.map(s => s.id === scenarioId ? {
          ...s,
          status: 'completed',
          results,
          duration
        } : s)
      );

      return results;
    } catch (error) {
      setErrorScenarios(prev =>
        prev.map(s => s.id === scenarioId ? {
          ...s,
          status: 'failed',
          results: { error: error instanceof Error ? error.message : 'Unknown error' }
        } : s)
      );
    }
  }, [errorScenarios, simulateNetworkFailure, simulateDatabaseError, simulateApiTimeout, simulateConcurrentUsers, simulateDataCorruption]);

  return {
    simulateNetworkFailure,
    simulateDatabaseError,
    simulateApiTimeout,
    simulateConcurrentUsers,
    simulateDataCorruption,
    createErrorScenario,
    runErrorScenario,
    errorScenarios,
    simulationResults,
    isSimulating
  };
};