import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useSystemIntegration } from '@/hooks/useSystemIntegration';
import { useUXPolish } from '@/hooks/useUXPolish';
import { useAdminTools } from '@/hooks/useAdminTools';
import { useLaunchReadiness } from '@/hooks/useLaunchReadiness';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Rocket,
  Shield,
  Zap,
  Users,
  Settings,
  FileText,
  Mail,
  Database,
  Monitor,
  Wrench,
  Star,
  Target,
  Activity,
  Play
} from 'lucide-react';

export const LaunchReadinessDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    integrationTests,
    performanceMetrics,
    securityScans,
    isRunningTests,
    runComponentTests,
    runEndToEndTests,
    runPerformanceAnalysis,
    runSecurityScan,
    generateIntegrationReport
  } = useSystemIntegration();

  const {
    accessibilityIssues,
    standardizeLoadingAnimations,
    standardizeErrorMessages,
    optimizeSuccessFeedback,
    completeHelpTooltips,
    runAccessibilityAudit,
    generateUXReport
  } = useUXPolish();

  const {
    systemConfigs,
    featureFlags,
    isMaintenanceMode,
    initializeSystemConfigs,
    initializeFeatureFlags,
    generateAdminReport
  } = useAdminTools();

  const {
    onboardingSteps,
    goLiveChecklist,
    initializeOnboardingFlow,
    initializeWelcomeEmails,
    initializeSetupWizard,
    initializeGoLiveChecklist,
    cleanupDemoData,
    generateLaunchReadinessReport
  } = useLaunchReadiness();

  // Initialize all systems
  useEffect(() => {
    initializeSystemConfigs();
    initializeFeatureFlags();
    initializeOnboardingFlow();
    initializeWelcomeEmails();
    initializeSetupWizard();
    initializeGoLiveChecklist();
  }, [
    initializeSystemConfigs,
    initializeFeatureFlags,
    initializeOnboardingFlow,
    initializeWelcomeEmails,
    initializeSetupWizard,
    initializeGoLiveChecklist
  ]);

  const integrationReport = generateIntegrationReport();
  const uxReport = generateUXReport();
  const adminReport = generateAdminReport();
  const launchReport = generateLaunchReadinessReport();

  const overallReadinessScore = Math.round(
    (integrationReport.readinessScore * 0.3) +
    (uxReport.overallUXScore * 0.25) +
    (launchReport.overallScore * 0.45)
  );

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" role="main" aria-labelledby="main-heading">
      <div className="flex justify-between items-center">
        <div>
          <h1 id="main-heading" className="text-3xl font-bold">Launch Readiness Dashboard</h1>
          <p className="text-foreground" aria-describedby="main-heading">Complete system integration, polish, and launch preparation</p>
        </div>
        <div className="flex items-center gap-4" role="banner" aria-label="Launch readiness status">
          <div className="text-right">
            <div className="text-2xl font-bold" aria-label={`Overall readiness score: ${overallReadinessScore} percent`}>{overallReadinessScore}%</div>
            <div className="text-sm text-foreground">Ready to Launch</div>
          </div>
          <Badge 
            variant={overallReadinessScore >= 90 ? 'default' : overallReadinessScore >= 75 ? 'secondary' : 'destructive'}
            className="text-lg px-3 py-1"
            aria-label={`Launch status: ${overallReadinessScore >= 90 ? 'Launch Ready' : overallReadinessScore >= 75 ? 'Almost Ready' : 'Not Ready'}`}
          >
            {overallReadinessScore >= 90 ? 'Launch Ready' : overallReadinessScore >= 75 ? 'Almost Ready' : 'Not Ready'}
          </Badge>
        </div>
      </div>

      {/* Overall Progress */}
      <Card role="region" aria-labelledby="overview-heading">
        <CardHeader>
          <CardTitle id="overview-heading" className="flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            Launch Readiness Overview
          </CardTitle>
          <CardDescription>
            Overall system readiness score: {overallReadinessScore}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={overallReadinessScore} 
            className="mb-4" 
            aria-label={`Launch readiness progress: ${overallReadinessScore} percent complete`}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="group" aria-label="Readiness metrics">
            <div className="text-center p-4 border rounded-lg" role="group" aria-labelledby="integration-metric">
              <div className="text-2xl font-bold text-blue-600" aria-label={`System integration: ${integrationReport.readinessScore} percent`}>{integrationReport.readinessScore}%</div>
              <div id="integration-metric" className="text-sm text-foreground">System Integration</div>
            </div>
            <div className="text-center p-4 border rounded-lg" role="group" aria-labelledby="ux-metric">
              <div className="text-2xl font-bold text-purple-600" aria-label={`UX polish: ${uxReport.overallUXScore} percent`}>{uxReport.overallUXScore}%</div>
              <div id="ux-metric" className="text-sm text-foreground">UX Polish</div>
            </div>
            <div className="text-center p-4 border rounded-lg" role="group" aria-labelledby="launch-metric">
              <div className="text-2xl font-bold text-green-600" aria-label={`Launch preparation: ${launchReport.overallScore} percent`}>{launchReport.overallScore}%</div>
              <div id="launch-metric" className="text-sm text-foreground">Launch Preparation</div>
            </div>
            <div className="text-center p-4 border rounded-lg" role="group" aria-labelledby="configs-metric">
              <div className="text-2xl font-bold text-orange-600" aria-label={`System configurations: ${systemConfigs.length} total`}>{systemConfigs.length}</div>
              <div id="configs-metric" className="text-sm text-foreground">System Configs</div>
            </div>
          </div>

          {launchReport.blockers.length > 0 && (
            <Alert className="mt-4" role="alert" aria-live="polite">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                <strong>Launch Blockers:</strong> {launchReport.blockers.join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6" role="tablist" aria-label="Launch readiness sections">
          <TabsTrigger value="overview" role="tab" aria-controls="overview-panel" aria-selected={activeTab === 'overview'}>Overview</TabsTrigger>
          <TabsTrigger value="integration" role="tab" aria-controls="integration-panel" aria-selected={activeTab === 'integration'}>Integration</TabsTrigger>
          <TabsTrigger value="ux-polish" role="tab" aria-controls="ux-polish-panel" aria-selected={activeTab === 'ux-polish'}>UX Polish</TabsTrigger>
          <TabsTrigger value="admin-tools" role="tab" aria-controls="admin-tools-panel" aria-selected={activeTab === 'admin-tools'}>Admin Tools</TabsTrigger>
          <TabsTrigger value="launch-prep" role="tab" aria-controls="launch-prep-panel" aria-selected={activeTab === 'launch-prep'}>Launch Prep</TabsTrigger>
          <TabsTrigger value="final-report" role="tab" aria-controls="final-report-panel" aria-selected={activeTab === 'final-report'}>Final Report</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="group" aria-label="System metrics overview">
            <Card role="group" aria-labelledby="integration-tests-title">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle id="integration-tests-title" className="text-sm font-medium">Integration Tests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Total integration tests: ${integrationTests.length}`}>{integrationTests.length}</div>
                <p className="text-xs text-foreground" aria-label={`${integrationTests.filter(t => t.status === 'passed').length} tests passed`}>
                  {integrationTests.filter(t => t.status === 'passed').length} passed
                </p>
              </CardContent>
            </Card>

            <Card role="group" aria-labelledby="security-scans-title">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle id="security-scans-title" className="text-sm font-medium">Security Scans</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Total security scans: ${securityScans.length}`}>{securityScans.length}</div>
                <p className="text-xs text-foreground" aria-label={`${securityScans.filter(s => s.status === 'completed').length} scans completed`}>
                  {securityScans.filter(s => s.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>

            <Card role="group" aria-labelledby="performance-metrics-title">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle id="performance-metrics-title" className="text-sm font-medium">Performance Metrics</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Total performance metrics: ${performanceMetrics.length}`}>{performanceMetrics.length}</div>
                <p className="text-xs text-foreground" aria-label={`${performanceMetrics.filter(m => m.status === 'good').length} metrics optimal`}>
                  {performanceMetrics.filter(m => m.status === 'good').length} optimal
                </p>
              </CardContent>
            </Card>

            <Card role="group" aria-labelledby="accessibility-issues-title">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle id="accessibility-issues-title" className="text-sm font-medium">Accessibility Issues</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" aria-label={`Total accessibility issues: ${accessibilityIssues.length}`}>{accessibilityIssues.length}</div>
                <p className="text-xs text-foreground" aria-label={`${accessibilityIssues.filter(i => i.severity === 'critical').length} critical issues`}>
                  {accessibilityIssues.filter(i => i.severity === 'critical').length} critical
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card role="region" aria-labelledby="quick-actions-title">
              <CardHeader>
                <CardTitle id="quick-actions-title">Quick Actions</CardTitle>
                <CardDescription>Run essential checks and optimizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={runComponentTests}
                  disabled={isRunningTests}
                  className="w-full"
                  aria-label="Run integration tests to validate system components"
                  aria-describedby="integration-help"
                >
                  <Activity className="mr-2 h-4 w-4" aria-hidden="true" />
                  Run Integration Tests
                </Button>
                <div id="integration-help" className="sr-only">Runs comprehensive tests to validate all system components are working correctly</div>
                
                <Button 
                  onClick={runSecurityScan}
                  variant="outline"
                  className="w-full"
                  aria-label="Run security scan to check for vulnerabilities"
                  aria-describedby="security-help"
                >
                  <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                  Security Scan
                </Button>
                <div id="security-help" className="sr-only">Performs security vulnerability assessment across the system</div>
                
                <Button 
                  onClick={runPerformanceAnalysis}
                  variant="outline"
                  className="w-full"
                  aria-label="Run performance analysis to check system speed"
                  aria-describedby="performance-help"
                >
                  <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                  Performance Analysis
                </Button>
                <div id="performance-help" className="sr-only">Analyzes system performance metrics and identifies optimization opportunities</div>
                
                <Button 
                  onClick={runAccessibilityAudit}
                  variant="outline"
                  className="w-full"
                  aria-label="Run accessibility audit to check compliance"
                  aria-describedby="accessibility-help"
                >
                  <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                  Accessibility Audit
                </Button>
                <div id="accessibility-help" className="sr-only">Audits the system for accessibility compliance and WCAG standards</div>
              </CardContent>
            </Card>

            <Card role="region" aria-labelledby="system-status-title">
              <CardHeader>
                <CardTitle id="system-status-title">System Status</CardTitle>
                <CardDescription>Current system health and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between" role="group" aria-label="Maintenance mode status">
                  <span>Maintenance Mode</span>
                  <Badge 
                    variant={isMaintenanceMode ? 'destructive' : 'default'}
                    aria-label={`Maintenance mode is ${isMaintenanceMode ? 'active' : 'inactive'}`}
                  >
                    {isMaintenanceMode ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between" role="group" aria-label="Feature flags status">
                  <span>Feature Flags</span>
                  <Badge 
                    variant="secondary"
                    aria-label={`${featureFlags.filter(f => f.enabled).length} of ${featureFlags.length} feature flags are active`}
                  >
                    {featureFlags.filter(f => f.enabled).length}/{featureFlags.length} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between" role="group" aria-label="System configurations status">
                  <span>System Configs</span>
                  <Badge 
                    variant="outline"
                    aria-label={`${systemConfigs.length} system configurations are configured`}
                  >
                    {systemConfigs.length} Configured
                  </Badge>
                </div>
                <div className="flex items-center justify-between" role="group" aria-label="Onboarding flow status">
                  <span>Onboarding Flow</span>
                  <Badge 
                    variant="secondary"
                    aria-label={`${onboardingSteps.filter(s => s.status === 'completed').length} of ${onboardingSteps.length} onboarding steps complete`}
                  >
                    {onboardingSteps.filter(s => s.status === 'completed').length}/{onboardingSteps.length} Complete
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">System Integration</h2>
              <p className="text-muted-foreground">Test system components and validate integrations</p>
            </div>
            <Button 
              onClick={runEndToEndTests}
              disabled={isRunningTests}
            >
              <Play className="mr-2 h-4 w-4" />
              Run E2E Tests
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Component Tests</CardTitle>
                <CardDescription>Individual component functionality tests</CardDescription>
              </CardHeader>
              <CardContent>
                {integrationTests.filter(t => t.category === 'component').map(test => (
                  <div key={test.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                      {test.status === 'passed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {test.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                      {test.status === 'running' && <Clock className="h-4 w-4 text-blue-600 animate-spin" />}
                      {test.status === 'pending' && <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />}
                      <span className="text-sm">{test.name}</span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Scans</CardTitle>
                <CardDescription>Security vulnerability assessments</CardDescription>
              </CardHeader>
              <CardContent>
                {securityScans.map(scan => (
                  <div key={scan.id} className="space-y-2 py-2 border-b last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{scan.scanType.replace('_', ' ')}</span>
                      <Badge variant={getStatusBadgeVariant(scan.status)}>
                        {scan.status}
                      </Badge>
                    </div>
                    {scan.findings.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {scan.findings.length} findings ({scan.riskLevel} risk)
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
                <CardDescription>System performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2 py-2 border-b last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.metric}</span>
                      <div className={`px-2 py-1 rounded text-xs ${
                        metric.status === 'good' ? 'bg-green-100 text-green-800' :
                        metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {metric.status}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metric.value.toFixed(0)} {metric.unit} (threshold: {metric.threshold} {metric.unit})
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* UX Polish Tab */}
        <TabsContent value="ux-polish" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">UX Polish & Accessibility</h2>
              <p className="text-muted-foreground">Standardize user experience and ensure accessibility compliance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={standardizeLoadingAnimations}
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
            >
              <Clock className="h-6 w-6" />
              <span>Standardize Loading</span>
            </Button>
            <Button 
              onClick={standardizeErrorMessages}
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
            >
              <XCircle className="h-6 w-6" />
              <span>Error Messages</span>
            </Button>
            <Button 
              onClick={optimizeSuccessFeedback}
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
            >
              <CheckCircle2 className="h-6 w-6" />
              <span>Success Feedback</span>
            </Button>
            <Button 
              onClick={completeHelpTooltips}
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
            >
              <FileText className="h-6 w-6" />
              <span>Help Tooltips</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility Issues</CardTitle>
              <CardDescription>
                Found {accessibilityIssues.length} accessibility issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessibilityIssues.length > 0 ? (
                <div className="space-y-4">
                  {accessibilityIssues.map(issue => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs ${getPriorityColor(issue.severity)}`}>
                            {issue.severity}
                          </div>
                          <span className="font-medium">{issue.element}</span>
                        </div>
                        <Badge variant="outline">{issue.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                      <p className="text-sm text-blue-600">{issue.recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Run accessibility audit to identify issues
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tools Tab */}
        <TabsContent value="admin-tools" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Admin Tools & Configuration</h2>
            <p className="text-muted-foreground">System administration and configuration management</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>Manage system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemConfigs.slice(0, 6).map(config => (
                    <div key={config.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium text-sm">{config.key}</div>
                        <div className="text-xs text-muted-foreground">{config.description}</div>
                      </div>
                      <Badge variant={config.isPublic ? 'default' : 'secondary'}>
                        {config.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>Control feature rollouts and system behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featureFlags.map(flag => (
                    <div key={flag.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium text-sm">{flag.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {flag.rolloutPercentage}% rollout
                        </div>
                      </div>
                      <Badge variant={flag.enabled ? 'default' : 'outline'}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Admin Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{adminReport.systemHealth.configsManaged}</div>
                  <div className="text-sm text-muted-foreground">Configs Managed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{adminReport.systemHealth.activeFeatures}</div>
                  <div className="text-sm text-muted-foreground">Active Features</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{adminReport.operations.completedOperations}</div>
                  <div className="text-sm text-muted-foreground">Completed Operations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{adminReport.userManagement.activeImpersonations}</div>
                  <div className="text-sm text-muted-foreground">Active Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Launch Prep Tab */}
        <TabsContent value="launch-prep" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Launch Preparation</h2>
              <p className="text-muted-foreground">Final steps before going live</p>
            </div>
            <Button onClick={cleanupDemoData}>
              <Database className="mr-2 h-4 w-4" />
              Cleanup Demo Data
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Flow</CardTitle>
                <CardDescription>
                  {launchReport.onboarding.completedSteps}/{launchReport.onboarding.totalSteps} steps completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(launchReport.onboarding.completedSteps / launchReport.onboarding.totalSteps) * 100} className="mb-4" />
                
                <div className="space-y-3">
                  {onboardingSteps.map(step => (
                    <div key={step.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        {step.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {step.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                        {step.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-600 animate-spin" />}
                        {step.status === 'pending' && <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />}
                        <div>
                          <div className="font-medium text-sm">{step.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {step.estimatedTime} min • {step.required ? 'Required' : 'Optional'}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(step.status)}>
                        {step.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Go-Live Checklist</CardTitle>
                <CardDescription>
                  {launchReport.checklist.completedItems}/{launchReport.checklist.totalItems} items completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(launchReport.checklist.completedItems / launchReport.checklist.totalItems) * 100} className="mb-4" />
                
                <div className="space-y-3">
                  {goLiveChecklist.slice(0, 8).map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        {item.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {item.status === 'pending' && <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />}
                        <div>
                          <div className="font-medium text-sm">{item.item}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className={`px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span>{item.category}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Final Report Tab */}
        <TabsContent value="final-report" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Final Launch Readiness Report</h2>
            <p className="text-muted-foreground">Comprehensive assessment of system readiness for production launch</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-blue-600">{integrationReport.readinessScore}%</CardTitle>
                <CardDescription>System Integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div>Tests: {integrationReport.testSummary.passed}/{integrationReport.testSummary.total}</div>
                  <div>Security: {integrationReport.security.criticalFindings} critical issues</div>
                  <div>Performance: {integrationReport.performance.overallScore}% score</div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-purple-600">{uxReport.overallUXScore}%</CardTitle>
                <CardDescription>UX Polish</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div>Loading: {uxReport.loadingExperience.standardized ? 'Standardized' : 'Not standardized'}</div>
                  <div>Errors: {uxReport.errorHandling.totalErrorTypes} types</div>
                  <div>A11y: {uxReport.accessibility.complianceScore}% compliant</div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-green-600">{launchReport.overallScore}%</CardTitle>
                <CardDescription>Launch Preparation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div>Onboarding: {launchReport.onboarding.score}%</div>
                  <div>Setup: {launchReport.setupWizard.score}%</div>
                  <div>Checklist: {launchReport.checklist.score}%</div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-orange-600">{overallReadinessScore}%</CardTitle>
                <CardDescription>Overall Readiness</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={overallReadinessScore >= 90 ? 'default' : 'destructive'}
                  className="text-sm"
                >
                  {launchReport.readyToLaunch ? 'Ready to Launch' : 'Not Ready'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Ready Components
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {integrationReport.testSummary.successRate >= 90 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Integration tests passing</span>
                  </div>
                )}
                {uxReport.accessibility.complianceScore >= 80 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Accessibility compliance</span>
                  </div>
                )}
                {launchReport.onboarding.completedRequiredSteps === launchReport.onboarding.requiredSteps && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Required onboarding complete</span>
                  </div>
                )}
                {launchReport.checklist.completedCriticalItems === launchReport.checklist.criticalItems && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Critical checklist items complete</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Issues to Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {launchReport.blockers.length > 0 ? (
                  launchReport.blockers.map((blocker, index) => (
                    <div key={index} className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>{blocker}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>No blocking issues found!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Launch Button */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="text-xl font-bold text-green-800">
                  {launchReport.readyToLaunch ? 'System Ready for Launch! 🚀' : 'Launch Preparation In Progress'}
                </h3>
                <p className="text-green-600">
                  {launchReport.readyToLaunch 
                    ? 'All critical requirements have been met. You can proceed with the launch.'
                    : `Complete ${launchReport.blockers.length} remaining items before launching.`
                  }
                </p>
              </div>
              <Button 
                size="lg"
                disabled={!launchReport.readyToLaunch}
                className="bg-green-600 hover:bg-green-700"
              >
                <Rocket className="mr-2 h-5 w-5" />
                {launchReport.readyToLaunch ? 'Launch System' : 'Not Ready'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};