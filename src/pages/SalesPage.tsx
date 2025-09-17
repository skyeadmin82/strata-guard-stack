import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SalesDashboard } from "@/components/Sales/SalesDashboard";

export default function SalesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SalesDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
}