import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkipToContent } from "@/components/ui/skip-to-content";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorRecoveryProvider } from "@/components/ErrorRecovery/ErrorRecoveryProvider";
import { SessionTimeoutWarning } from "@/components/ErrorRecovery/SessionTimeoutWarning";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { ClientsPage } from "./pages/ClientsPage";
import { UsersPage } from "./pages/UsersPage";
import { TicketsPage } from "./pages/TicketsPage";
import { TicketManagementPage } from "./pages/TicketManagementPage";
import { ContractsPage } from "./pages/ContractsPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { AssessmentExecutionPage } from "./pages/AssessmentExecutionPage";
import { ProposalsPage } from "./pages/ProposalsPage";
import ProductsServicesPage from "./pages/ProductsServicesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";
import TestingPage from "./pages/TestingPage";
import { EmailMarketingPage } from "./pages/EmailMarketingPage";
import { FieldServicePage } from "./pages/FieldServicePage";
import { FinancialManagementPage } from "./pages/FinancialManagementPage";
import Integrations from "./pages/Integrations";
import LaunchPage from "./pages/LaunchPage";
import DatabaseDiagnosticPage from "./pages/DatabaseDiagnosticPage";
import NotFound from "./pages/NotFound";
import SalesPage from "./pages/SalesPage";
import SalesDashboard from '@/pages/Sales/SalesDashboard';
import AgentManagement from '@/pages/Sales/AgentManagement';
import LeadDistribution from '@/pages/Sales/LeadDistribution';
import SalesPipeline from '@/pages/Sales/SalesPipeline';
import { useMemo } from "react";

const App = () => {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <EnvironmentProvider>
          <AuthProvider>
            <ErrorRecoveryProvider>
              <TooltipProvider>
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <SkipToContent />
                  <Toaster />
                  <Sonner />
                  <SessionTimeoutWarning />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/clients" element={<ClientsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/tickets/management" element={<TicketManagementPage />} />
                    <Route path="/contracts" element={<ContractsPage />} />
                    <Route path="/assessments" element={<AssessmentsPage />} />
                    <Route path="/assessments/:assessmentId/execute" element={<AssessmentExecutionPage />} />
                    <Route path="/proposals" element={<ProposalsPage />} />
                    <Route path="/products-services" element={<ProductsServicesPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/monitoring" element={<MonitoringPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/testing" element={<TestingPage />} />
                    <Route path="/launch" element={<LaunchPage />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/email" element={<EmailMarketingPage />} />
                    <Route path="/field-service" element={<FieldServicePage />} />
                    <Route path="/financial" element={<FinancialManagementPage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/sales/agents" element={<AgentManagement />} />
                    <Route path="/sales/distribution" element={<LeadDistribution />} />
                    <Route path="/sales/pipeline" element={<SalesPipeline />} />
                    <Route path="/admin/database" element={<DatabaseDiagnosticPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </ErrorRecoveryProvider>
          </AuthProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
