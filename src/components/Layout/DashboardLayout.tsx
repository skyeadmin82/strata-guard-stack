import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MSPSidebar } from './MSPSidebar';
import { EnvironmentBanner } from '@/components/EnvironmentBanner';
import { EnvironmentSwitcher } from '@/components/EnvironmentSwitcher';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <EnvironmentBanner />
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <MSPSidebar />
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm enterprise-card">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="font-semibold text-foreground text-lg">
                  MSP Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <EnvironmentSwitcher />
                {profile && (
                  <div className="text-sm text-muted-foreground">
                    Welcome, {profile.first_name || profile.email}
                  </div>
                )}
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 bg-secondary/20">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};