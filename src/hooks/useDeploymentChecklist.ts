import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';

export interface ChecklistItem {
  id: string;
  category: 'environment' | 'database' | 'security' | 'performance' | 'monitoring' | 'documentation';
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  validationScript?: string;
  rollbackScript?: string;
  estimatedTime?: number;
  actualTime?: number;
  assignedTo?: string;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
  dependencies?: string[];
  healthChecks?: string[];
}

export interface DeploymentEnvironment {
  name: string;
  type: 'development' | 'staging' | 'production';
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastChecked?: string;
  config: Record<string, any>;
  healthChecks: HealthCheck[];
}

export interface HealthCheck {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedStatus: number;
  timeout: number;
  status: 'pending' | 'running' | 'passed' | 'failed';
  lastRun?: string;
  responseTime?: number;
  errorMessage?: string;
}

export interface MigrationScript {
  id: string;
  version: string;
  name: string;
  type: 'schema' | 'data' | 'config';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  script: string;
  rollbackScript?: string;
  executedAt?: string;
  executedBy?: string;
  duration?: number;
  checksum: string;
}

export interface DeploymentReadiness {
  overall: number; // 0-100
  categories: Record<string, number>;
  critical_blocks: ChecklistItem[];
  recommendations: string[];
  estimated_completion: string;
}

export const useDeploymentChecklist = () => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [environments, setEnvironments] = useState<DeploymentEnvironment[]>([]);
  const [migrations, setMigrations] = useState<MigrationScript[]>([]);
  const [readinessScore, setReadinessScore] = useState<DeploymentReadiness | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRunningHealthChecks, setIsRunningHealthChecks] = useState(false);
  const { toast } = useToast();
  const { tenant: currentTenant } = useTenant();

  // Initialize default checklist
  useEffect(() => {
    const defaultChecklist: Omit<ChecklistItem, 'id'>[] = [
      // Environment Configuration
      {
        category: 'environment',
        name: 'Environment Variables',
        description: 'Validate all required environment variables are set',
        status: 'pending',
        priority: 'critical',
        automated: true,
        validationScript: 'checkEnvVars()',
        estimatedTime: 5
      },
      {
        category: 'environment',
        name: 'SSL Certificates',
        description: 'Ensure SSL certificates are valid and not expiring soon',
        status: 'pending',
        priority: 'critical',
        automated: true,
        validationScript: 'checkSSLCerts()',
        estimatedTime: 10
      },
      {
        category: 'environment',
        name: 'Domain Configuration',
        description: 'Verify domain DNS settings and routing',
        status: 'pending',
        priority: 'high',
        automated: false,
        estimatedTime: 15
      },

      // Database
      {
        category: 'database',
        name: 'Database Connectivity',
        description: 'Test database connection and authentication',
        status: 'pending',
        priority: 'critical',
        automated: true,
        validationScript: 'testDBConnection()',
        estimatedTime: 5
      },
      {
        category: 'database',
        name: 'Migration Scripts',
        description: 'Validate and execute pending migration scripts',
        status: 'pending',
        priority: 'critical',
        automated: true,
        validationScript: 'validateMigrations()',
        rollbackScript: 'rollbackMigrations()',
        estimatedTime: 30
      },
      {
        category: 'database',
        name: 'Database Backup',
        description: 'Create pre-deployment database backup',
        status: 'pending',
        priority: 'critical',
        automated: true,
        validationScript: 'createBackup()',
        estimatedTime: 20
      },

      // Security
      {
        category: 'security',
        name: 'Security Headers',
        description: 'Verify security headers are properly configured',
        status: 'pending',
        priority: 'high',
        automated: true,
        validationScript: 'checkSecurityHeaders()',
        estimatedTime: 10
      },
      {
        category: 'security',
        name: 'API Rate Limiting',
        description: 'Configure and test API rate limiting',
        status: 'pending',
        priority: 'high',
        automated: true,
        validationScript: 'testRateLimiting()',
        estimatedTime: 15
      },
      {
        category: 'security',
        name: 'Authentication',
        description: 'Test authentication and authorization flows',
        status: 'pending',
        priority: 'critical',
        automated: true,
        validationScript: 'testAuth()',
        estimatedTime: 20
      },

      // Performance
      {
        category: 'performance',
        name: 'Load Testing',
        description: 'Execute load tests and verify performance benchmarks',
        status: 'pending',
        priority: 'medium',
        automated: true,
        validationScript: 'runLoadTests()',
        estimatedTime: 60
      },
      {
        category: 'performance',
        name: 'CDN Configuration',
        description: 'Verify CDN setup and cache invalidation',
        status: 'pending',
        priority: 'medium',
        automated: false,
        estimatedTime: 30
      },

      // Monitoring
      {
        category: 'monitoring',
        name: 'Health Endpoints',
        description: 'Set up and test application health check endpoints',
        status: 'pending',
        priority: 'high',
        automated: true,
        validationScript: 'testHealthEndpoints()',
        estimatedTime: 15,
        healthChecks: ['/health', '/api/health', '/status']
      },
      {
        category: 'monitoring',
        name: 'Error Monitoring',
        description: 'Configure error tracking and alerting',
        status: 'pending',
        priority: 'high',
        automated: false,
        estimatedTime: 20
      },
      {
        category: 'monitoring',
        name: 'Performance Monitoring',
        description: 'Set up performance monitoring and metrics collection',
        status: 'pending',
        priority: 'medium',
        automated: false,
        estimatedTime: 25
      },

      // Documentation
      {
        category: 'documentation',
        name: 'API Documentation',
        description: 'Ensure API documentation is up to date',
        status: 'pending',
        priority: 'medium',
        automated: false,
        estimatedTime: 45
      },
      {
        category: 'documentation',
        name: 'Deployment Guide',
        description: 'Update deployment and rollback procedures',
        status: 'pending',
        priority: 'medium',
        automated: false,
        estimatedTime: 30
      },
      {
        category: 'documentation',
        name: 'Troubleshooting Guide',
        description: 'Create troubleshooting documentation',
        status: 'pending',
        priority: 'low',
        automated: false,
        estimatedTime: 40
      }
    ];

    setChecklistItems(
      defaultChecklist.map(item => ({
        ...item,
        id: crypto.randomUUID()
      }))
    );

    // Initialize default environments
    setEnvironments([
      {
        name: 'Development',
        type: 'development',
        status: 'unknown',
        config: {
          supabase_url: 'https://ghczhzfywivhrcvncffl.supabase.co',
          environment: 'development'
        },
        healthChecks: [
          {
            id: crypto.randomUUID(),
            name: 'API Health',
            endpoint: '/api/health',
            method: 'GET',
            expectedStatus: 200,
            timeout: 5000,
            status: 'pending'
          }
        ]
      },
      {
        name: 'Staging',
        type: 'staging',
        status: 'unknown',
        config: {
          supabase_url: 'https://ghczhzfywivhrcvncffl.supabase.co',
          environment: 'staging'
        },
        healthChecks: [
          {
            id: crypto.randomUUID(),
            name: 'API Health',
            endpoint: '/api/health',
            method: 'GET',
            expectedStatus: 200,
            timeout: 5000,
            status: 'pending'
          }
        ]
      },
      {
        name: 'Production',
        type: 'production',
        status: 'unknown',
        config: {
          supabase_url: 'https://ghczhzfywivhrcvncffl.supabase.co',
          environment: 'production'
        },
        healthChecks: [
          {
            id: crypto.randomUUID(),
            name: 'API Health',
            endpoint: '/api/health',
            method: 'GET',
            expectedStatus: 200,
            timeout: 5000,
            status: 'pending'
          },
          {
            id: crypto.randomUUID(),
            name: 'Database Health',
            endpoint: '/api/health/db',
            method: 'GET',
            expectedStatus: 200,
            timeout: 10000,
            status: 'pending'
          }
        ]
      }
    ]);
  }, []);

  const validateEnvironmentConfig = useCallback(async (envName: string) => {
    setIsValidating(true);
    try {
      const environment = environments.find(env => env.name === envName);
      if (!environment) throw new Error(`Environment ${envName} not found`);

      // Simulate environment validation
      const validationResults = {
        envVars: Math.random() > 0.2, // 80% success rate
        ssl: Math.random() > 0.1, // 90% success rate
        dns: Math.random() > 0.3, // 70% success rate
        connectivity: Math.random() > 0.05 // 95% success rate
      };

      const overallHealth = Object.values(validationResults).every(Boolean);
      
      setEnvironments(prev =>
        prev.map(env =>
          env.name === envName
            ? {
                ...env,
                status: overallHealth ? 'healthy' : 'error',
                lastChecked: new Date().toISOString()
              }
            : env
        )
      );

      toast({
        title: "Environment Validation Complete",
        description: `${envName} environment is ${overallHealth ? 'healthy' : 'unhealthy'}`,
        variant: overallHealth ? "default" : "destructive",
      });

      return validationResults;
    } catch (error) {
      console.error('Environment validation failed:', error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }, [environments, toast]);

  const runHealthChecks = useCallback(async (envName?: string) => {
    setIsRunningHealthChecks(true);
    try {
      const targetEnvironments = envName 
        ? environments.filter(env => env.name === envName)
        : environments;

      for (const environment of targetEnvironments) {
        for (const healthCheck of environment.healthChecks) {
          const startTime = Date.now();
          
          try {
            // Simulate health check
            const success = Math.random() > 0.1; // 90% success rate
            const responseTime = Math.random() * 1000 + 100;
            
            await new Promise(resolve => setTimeout(resolve, responseTime));
            
            // Update health check status
            setEnvironments(prev =>
              prev.map(env =>
                env.name === environment.name
                  ? {
                      ...env,
                      healthChecks: env.healthChecks.map(hc =>
                        hc.id === healthCheck.id
                          ? {
                              ...hc,
                              status: success ? 'passed' : 'failed',
                              lastRun: new Date().toISOString(),
                              responseTime,
                              errorMessage: success ? undefined : 'Health check failed'
                            }
                          : hc
                      )
                    }
                  : env
              )
            );
          } catch (error) {
            setEnvironments(prev =>
              prev.map(env =>
                env.name === environment.name
                  ? {
                      ...env,
                      healthChecks: env.healthChecks.map(hc =>
                        hc.id === healthCheck.id
                          ? {
                              ...hc,
                              status: 'failed',
                              lastRun: new Date().toISOString(),
                              responseTime: Date.now() - startTime,
                              errorMessage: error instanceof Error ? error.message : 'Unknown error'
                            }
                          : hc
                      )
                    }
                  : env
              )
            );
          }
        }
      }

      toast({
        title: "Health Checks Complete",
        description: `Completed health checks for ${targetEnvironments.length} environment(s)`,
      });
    } catch (error) {
      console.error('Health checks failed:', error);
      toast({
        title: "Health Checks Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsRunningHealthChecks(false);
    }
  }, [environments, toast]);

  const updateChecklistItem = useCallback((itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklistItems(prev =>
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
  }, []);

  const runAutomatedChecks = useCallback(async () => {
    setIsValidating(true);
    try {
      const automatedItems = checklistItems.filter(item => item.automated);
      
      for (const item of automatedItems) {
        updateChecklistItem(item.id, { status: 'in_progress' });
        
        // Simulate automated validation
        const startTime = Date.now();
        const success = Math.random() > 0.15; // 85% success rate
        const duration = Math.random() * (item.estimatedTime || 10) * 1000;
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
        updateChecklistItem(item.id, {
          status: success ? 'completed' : 'failed',
          actualTime: Math.round(duration / 1000),
          completedBy: 'Automated System',
          notes: success ? 'Validation passed' : 'Automated validation failed'
        });
      }

      toast({
        title: "Automated Checks Complete",
        description: `Completed ${automatedItems.length} automated validation checks`,
      });
    } catch (error) {
      console.error('Automated checks failed:', error);
      toast({
        title: "Automated Checks Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }, [checklistItems, updateChecklistItem, toast]);

  const calculateReadiness = useCallback(() => {
    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter(item => item.status === 'completed').length;
    const criticalBlocks = checklistItems.filter(
      item => item.priority === 'critical' && item.status !== 'completed'
    );

    const categoryScores = checklistItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { total: 0, completed: 0 };
      }
      acc[item.category].total++;
      if (item.status === 'completed') {
        acc[item.category].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    const categoryPercentages = Object.entries(categoryScores).reduce(
      (acc, [category, scores]) => {
        acc[category] = Math.round((scores.completed / scores.total) * 100);
        return acc;
      },
      {} as Record<string, number>
    );

    const recommendations = [];
    
    if (criticalBlocks.length > 0) {
      recommendations.push(`Complete ${criticalBlocks.length} critical items before deployment`);
    }
    
    if (categoryPercentages.security < 100) {
      recommendations.push('Complete all security validations');
    }
    
    if (categoryPercentages.database < 100) {
      recommendations.push('Ensure database migrations are tested and ready');
    }

    const overall = Math.round((completedItems / totalItems) * 100);
    
    // Estimate completion time
    const remainingItems = checklistItems.filter(item => item.status !== 'completed');
    const estimatedMinutes = remainingItems.reduce(
      (sum, item) => sum + (item.estimatedTime || 0),
      0
    );
    const estimatedCompletion = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString();

    const readiness: DeploymentReadiness = {
      overall,
      categories: categoryPercentages,
      critical_blocks: criticalBlocks,
      recommendations,
      estimated_completion: estimatedCompletion
    };

    setReadinessScore(readiness);
    return readiness;
  }, [checklistItems]);

  // Recalculate readiness when checklist changes
  useEffect(() => {
    calculateReadiness();
  }, [calculateReadiness]);

  const createMigrationScript = useCallback((migration: Omit<MigrationScript, 'id' | 'checksum'>) => {
    const checksum = btoa(migration.script).slice(0, 8); // Simple checksum
    const newMigration: MigrationScript = {
      ...migration,
      id: crypto.randomUUID(),
      checksum
    };
    
    setMigrations(prev => [...prev, newMigration]);
    return newMigration;
  }, []);

  const executeMigration = useCallback(async (migrationId: string) => {
    const migration = migrations.find(m => m.id === migrationId);
    if (!migration) return;

    setMigrations(prev =>
      prev.map(m =>
        m.id === migrationId ? { ...m, status: 'running' } : m
      )
    );

    try {
      const startTime = Date.now();
      
      // Simulate migration execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const duration = Date.now() - startTime;
      
      setMigrations(prev =>
        prev.map(m =>
          m.id === migrationId
            ? {
                ...m,
                status: 'completed',
                executedAt: new Date().toISOString(),
                executedBy: 'System',
                duration: Math.round(duration / 1000)
              }
            : m
        )
      );

      toast({
        title: "Migration Complete",
        description: `Successfully executed migration ${migration.name}`,
      });
    } catch (error) {
      setMigrations(prev =>
        prev.map(m =>
          m.id === migrationId ? { ...m, status: 'failed' } : m
        )
      );
      
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  }, [migrations, toast]);

  return {
    checklistItems,
    environments,
    migrations,
    readinessScore,
    isValidating,
    isRunningHealthChecks,
    validateEnvironmentConfig,
    runHealthChecks,
    updateChecklistItem,
    runAutomatedChecks,
    calculateReadiness,
    createMigrationScript,
    executeMigration
  };
};