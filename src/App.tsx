import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorRecoveryProvider } from "@/components/ErrorRecovery/ErrorRecoveryProvider";
import { SessionTimeoutWarning } from "@/components/ErrorRecovery/SessionTimeoutWarning";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { ClientsPage } from "./pages/ClientsPage";
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
      <EnvironmentProvider>
        <ErrorRecoveryProvider>
          <AuthProvider>
            <TooltipProvider>
              <BrowserRouter>
                <Toaster />
                <Sonner />
                <SessionTimeoutWarning />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ErrorRecoveryProvider>
      </EnvironmentProvider>
    </QueryClientProvider>
  );
};

export default App;
