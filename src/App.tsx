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
import { MonitoringPage } from "./pages/MonitoringPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";
import TestingPage from "./pages/TestingPage";
import { EmailMarketingPage } from "./pages/EmailMarketingPage";
import { FieldServicePage } from "./pages/FieldServicePage";
import { FinancialManagementPage } from "./pages/FinancialManagementPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import LaunchPage from "./pages/LaunchPage";
import NotFound from "./pages/NotFound";
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
                    <Route path="/monitoring" element={<MonitoringPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/testing" element={<TestingPage />} />
                    <Route path="/launch" element={<LaunchPage />} />
                    <Route path="/integrations" element={<IntegrationsPage />} />
                    <Route path="/email" element={<EmailMarketingPage />} />
                    <Route path="/field-service" element={<FieldServicePage />} />
                    <Route path="/financial" element={<FinancialManagementPage />} />
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
