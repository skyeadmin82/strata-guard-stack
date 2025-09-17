import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SalesExportManagerProps {
  data: {
    agents: any[];
    leads: any[];
    deals: any[];
    commissions: any[];
  };
  activeTab: string;
}

export const SalesExportManager: React.FC<SalesExportManagerProps> = ({ data, activeTab }) => {
  const { toast } = useToast();

  const exportToCSV = (dataset: any[], filename: string) => {
    if (!dataset.length) {
      toast({
        title: "No data to export",
        description: `No ${activeTab} data available for export`,
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(dataset[0]);
    const csvContent = [
      headers.join(','),
      ...dataset.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle arrays and objects
          if (Array.isArray(value)) return `"${value.join('; ')}"`;
          if (typeof value === 'object' && value !== null) return `"${JSON.stringify(value)}"`;
          // Escape commas and quotes
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${filename} data exported as CSV`,
    });
  };

  const exportCurrentTab = () => {
    const exportMap = {
      agents: { data: data.agents, filename: 'sales-agents' },
      leads: { data: data.leads, filename: 'sales-leads' },
      deals: { data: data.deals, filename: 'sales-deals' },
      commissions: { data: data.commissions, filename: 'commission-transactions' }
    };

    const exportInfo = exportMap[activeTab as keyof typeof exportMap];
    if (exportInfo) {
      exportToCSV(exportInfo.data, exportInfo.filename);
    }
  };

  const exportAll = () => {
    // Export all data as separate sheets in a zip-like structure
    Object.entries({
      'sales-agents': data.agents,
      'sales-leads': data.leads,
      'sales-deals': data.deals,
      'commission-transactions': data.commissions
    }).forEach(([filename, dataset]) => {
      if (dataset.length > 0) {
        setTimeout(() => exportToCSV(dataset, filename), 100);
      }
    });

    toast({
      title: "Bulk export initiated",
      description: "All sales data is being exported as separate CSV files",
    });
  };

  const generateReport = () => {
    // Generate a comprehensive sales report
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_agents: data.agents.length,
        total_leads: data.leads.length,
        total_deals: data.deals.length,
        total_commissions: data.commissions.length,
        total_revenue: data.deals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0),
        conversion_rate: data.deals.length > 0 ? (data.deals.filter(d => d.stage === 'closed_won').length / data.deals.length) * 100 : 0
      },
      agents: data.agents,
      leads: data.leads,
      deals: data.deals,
      commissions: data.commissions
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report generated",
      description: "Comprehensive sales report exported as JSON",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={exportCurrentTab}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Current Tab
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAll}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export All Data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={generateReport}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          toast({
            title: "Feature coming soon",
            description: "Scheduled exports will be available in the next release",
          });
        }}>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Export
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};