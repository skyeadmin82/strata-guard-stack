import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTestDataManagement } from '@/hooks/useTestDataManagement';
import { useErrorSimulation } from '@/hooks/useErrorSimulation';
import { useDeploymentChecklist } from '@/hooks/useDeploymentChecklist';
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  Network,
  Users,
  Zap,
  Bug,
  Shield,
  Server,
  FileText,
  Monitor
} from 'lucide-react';

export const TestingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [testConfig, setTestConfig] = useState({
    dataType: 'clients',
    recordCount: 100,
    concurrentUsers: 10,
    duration: 5
  });

  const {
    generateTestData,
    validateData,
    runLoadTest,
    testScenarios,
    validationResults,
    isGenerating,
    isValidating,
    isLoadTesting
  } = useTestDataManagement();

  const {
    errorScenarios,
    simulateNetworkFailure,
    simulateApiTimeout,
    simulateConcurrentUsers,
    isSimulating
  } = useErrorSimulation();

  const {
    checklistItems,
    readinessScore,
    runAutomatedChecks,
    runHealthChecks,
    isValidating: isValidatingDeployment,
    isRunningHealthChecks
  } = useDeploymentChecklist();

  const getCategoryIcon = (category: string) => {
    const icons = {
      environment: Server,
      database: Database,
      security: Shield,
      performance: Zap,
      monitoring: Monitor,
      documentation: FileText
    };
    return icons[category as keyof typeof icons] || FileText;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'text-green-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      case 'running':
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'default';
      case 'failed':
      case 'error':
        return 'destructive';
      case 'running':
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Testing & Deployment Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive testing suite and deployment readiness tracking</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="test-data">Test Data</TabsTrigger>
          <TabsTrigger value="error-simulation">Error Simulation</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Scenarios</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testScenarios.length}</div>
                <p className="text-xs text-muted-foreground">
                  {testScenarios.filter(s => s.status === 'passed').length} passed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Simulations</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errorScenarios.length}</div>
                <p className="text-xs text-muted-foreground">
                  {errorScenarios.filter(s => s.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deployment Readiness</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readinessScore?.overall || 0}%</div>
                <Progress value={readinessScore?.overall || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readinessScore?.critical_blocks.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Blocking deployment
                </p>
              </CardContent>
            </Card>
          </div>

          {readinessScore && readinessScore.critical_blocks.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {readinessScore.critical_blocks.length} critical issues must be resolved before deployment.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Readiness</CardTitle>
                <CardDescription>Deployment readiness by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {readinessScore && Object.entries(readinessScore.categories).map(([category, score]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={score} className="w-20" />
                        <span className="text-sm font-medium">{score}%</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Test Results</CardTitle>
                <CardDescription>Latest test scenario results</CardDescription>
              </CardHeader>
              <CardContent>
                {testScenarios.slice(-5).map(scenario => (
                  <div key={scenario.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(scenario.status)}`} />
                      <span className="text-sm">{scenario.name}</span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(scenario.status)}>
                      {scenario.status}
                    </Badge>
                  </div>
                ))}
                {testScenarios.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No test scenarios yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Test Data Tab */}
        <TabsContent value="test-data" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Test Data</CardTitle>
                <CardDescription>Create test data for different entity types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data-type">Data Type</Label>
                    <Select
                      value={testConfig.dataType}
                      onValueChange={(value) => setTestConfig(prev => ({ ...prev, dataType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clients">Clients</SelectItem>
                        <SelectItem value="contracts">Contracts</SelectItem>
                        <SelectItem value="invoices">Invoices</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="record-count">Record Count</Label>
                    <Input
                      id="record-count"
                      type="number"
                      value={testConfig.recordCount}
                      onChange={(e) => setTestConfig(prev => ({ ...prev, recordCount: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="1000"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => generateTestData(testConfig.dataType, testConfig.recordCount)}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Generate Test Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Validation</CardTitle>
                <CardDescription>Validate data integrity and constraints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => validateData('clients', [
                    { field: 'email', rule: 'format_email', expected: true },
                    { field: 'name', rule: 'not_null', expected: true },
                    { field: 'phone', rule: 'min_length', expected: 10 }
                  ])}
                  disabled={isValidating}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Run Validation
                    </>
                  )}
                </Button>

                {validationResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Validation Results</h4>
                    {validationResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{result.field} ({result.rule})</span>
                        <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                          {result.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Load Testing</CardTitle>
              <CardDescription>Test system performance under load</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="concurrent-users">Concurrent Users</Label>
                  <Input
                    id="concurrent-users"
                    type="number"
                    value={testConfig.concurrentUsers}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, concurrentUsers: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={testConfig.duration}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="60"
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => runLoadTest({
                      concurrent_users: testConfig.concurrentUsers,
                      duration_minutes: testConfig.duration,
                      ramp_up_seconds: 30,
                      target_endpoint: '/api/health',
                      expected_response_time_ms: 500
                    })}
                    disabled={isLoadTesting}
                    className="w-full"
                  >
                    {isLoadTesting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Run Load Test
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Simulation Tab */}
        <TabsContent value="error-simulation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Network Failures</CardTitle>
                <CardDescription>Simulate network connectivity issues</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => simulateNetworkFailure({
                    failure_rate: 0.3,
                    timeout_ms: 5000,
                    retry_attempts: 3,
                    endpoints: ['/api/health', '/api/clients']
                  })}
                  disabled={isSimulating}
                  className="w-full"
                >
                  <Network className="mr-2 h-4 w-4" />
                  Simulate Network Issues
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Timeouts</CardTitle>
                <CardDescription>Test timeout handling and recovery</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => simulateApiTimeout(['/api/health'], 3000)}
                  disabled={isSimulating}
                  className="w-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Simulate Timeouts
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Concurrent Users</CardTitle>
                <CardDescription>Stress test with multiple users</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => simulateConcurrentUsers({
                    user_count: 50,
                    actions_per_user: 10,
                    duration_minutes: 2,
                    target_endpoints: ['/api/clients', '/api/contracts']
                  })}
                  disabled={isSimulating}
                  className="w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Simulate Load
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Error Scenarios</CardTitle>
              <CardDescription>Manage and track error simulation scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              {errorScenarios.length > 0 ? (
                <div className="space-y-4">
                  {errorScenarios.map(scenario => (
                    <div key={scenario.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{scenario.type}</Badge>
                          <Badge variant={scenario.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {scenario.severity}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(scenario.status)}>
                          {scenario.status}
                        </Badge>
                        {scenario.duration && (
                          <span className="text-sm text-muted-foreground">
                            {scenario.duration}ms
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No error scenarios created yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Deployment Checklist</h2>
              <p className="text-muted-foreground">Track deployment readiness and requirements</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runAutomatedChecks}
                disabled={isValidatingDeployment}
              >
                {isValidatingDeployment ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Running Checks...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Automated Checks
                  </>
                )}
              </Button>
              <Button 
                onClick={() => runHealthChecks()}
                disabled={isRunningHealthChecks}
                variant="outline"
              >
                {isRunningHealthChecks ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Monitor className="mr-2 h-4 w-4" />
                    Health Checks
                  </>
                )}
              </Button>
            </div>
          </div>

          {readinessScore && (
            <Card>
              <CardHeader>
                <CardTitle>Deployment Readiness Score</CardTitle>
                <CardDescription>Overall deployment readiness: {readinessScore.overall}%</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={readinessScore.overall} className="mb-4" />
                
                {readinessScore.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Recommendations</h4>
                    <ul className="space-y-1">
                      {readinessScore.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Checklist Items</CardTitle>
              <CardDescription>Complete all items for deployment readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  checklistItems.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                  }, {} as Record<string, typeof checklistItems>)
                ).map(([category, items]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{category}</span>
                        <Badge variant="outline">
                          {items.filter(i => i.status === 'completed').length}/{items.length}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 ml-6">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.name}</h4>
                                <Badge variant={item.priority === 'critical' ? 'destructive' : 'secondary'}>
                                  {item.priority}
                                </Badge>
                                {item.automated && (
                                  <Badge variant="outline">Automated</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              {item.estimatedTime && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Est. time: {item.estimatedTime} minutes
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.status === 'completed' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : item.status === 'failed' ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : item.status === 'in_progress' ? (
                                <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                              ) : (
                                <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                              )}
                              <Badge variant={getStatusBadgeVariant(item.status)}>
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>Auto-generated API reference</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Available Endpoints</h4>
                    <ul className="space-y-1 text-sm">
                      <li><code>GET /api/health</code> - System health check</li>
                      <li><code>GET /api/clients</code> - List clients</li>
                      <li><code>POST /api/clients</code> - Create client</li>
                      <li><code>GET /api/contracts</code> - List contracts</li>
                      <li><code>POST /api/invoices</code> - Create invoice</li>
                    </ul>
                  </div>
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Full API Docs
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Code Reference</CardTitle>
                <CardDescription>System error codes and meanings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <code>ERR_AUTH_001</code>
                    <span>Invalid authentication token</span>
                  </div>
                  <div className="flex justify-between">
                    <code>ERR_DB_001</code>
                    <span>Database connection failed</span>
                  </div>
                  <div className="flex justify-between">
                    <code>ERR_VAL_001</code>
                    <span>Validation error</span>
                  </div>
                  <div className="flex justify-between">
                    <code>ERR_NET_001</code>
                    <span>Network timeout</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Guide</CardTitle>
              <CardDescription>Common issues and solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Document troubleshooting steps, known issues, and solutions..."
                className="min-h-[200px]"
              />
              <Button className="mt-4">
                <FileText className="mr-2 h-4 w-4" />
                Save Troubleshooting Guide
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">87%</div>
                <Progress value={87} className="mb-2" />
                <p className="text-sm text-muted-foreground">Code coverage from tests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">94%</div>
                <Progress value={94} className="mb-2" />
                <p className="text-sm text-muted-foreground">Test scenario success rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">91</div>
                <Progress value={91} className="mb-2" />
                <p className="text-sm text-muted-foreground">Overall performance rating</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Readiness Report</CardTitle>
              <CardDescription>Comprehensive deployment assessment</CardDescription>
            </CardHeader>
            <CardContent>
              {readinessScore ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Overall Readiness: {readinessScore.overall}%</h4>
                    <Progress value={readinessScore.overall} className="mb-4" />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Category Breakdown</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(readinessScore.categories).map(([category, score]) => (
                        <div key={category} className="flex justify-between">
                          <span className="capitalize">{category}</span>
                          <span className="font-medium">{score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {readinessScore.critical_blocks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Critical Issues</h4>
                      <ul className="space-y-1">
                        {readinessScore.critical_blocks.map(item => (
                          <li key={item.id} className="text-sm flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-red-600" />
                            {item.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {readinessScore.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Run deployment checks to generate readiness report
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};