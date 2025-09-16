import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { EnhancedContract } from '@/hooks/useEnhancedContractManagement';
import { format } from 'date-fns';

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: EnhancedContract | null;
  mode: 'view' | 'edit' | 'create';
}

export const ContractDialog = ({ open, onOpenChange, contract, mode }: ContractDialogProps) => {
  const [formData, setFormData] = useState({
    title: contract?.title || '',
    description: contract?.description || '',
    contract_type: contract?.contract_type || 'msp',
    total_value: contract?.total_value?.toString() || '',
    currency: contract?.currency || 'USD',
    start_date: contract?.start_date || '',
    end_date: contract?.end_date || '',
    auto_renewal: contract?.auto_renewal || false
  });

  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getRenewalRiskColor = (risk?: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? 'Create New Contract' : 
             isViewMode ? 'Contract Details' : 'Edit Contract'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  disabled={isViewMode}
                />
              </div>
              <div>
                <Label htmlFor="contract_type">Contract Type</Label>
                <Select 
                  value={formData.contract_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msp">MSP Agreement</SelectItem>
                    <SelectItem value="project">Project Contract</SelectItem>
                    <SelectItem value="support">Support Contract</SelectItem>
                    <SelectItem value="consulting">Consulting Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={isViewMode}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_value">Total Value</Label>
                <Input
                  id="total_value"
                  type="number"
                  value={formData.total_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_value: e.target.value }))}
                  disabled={isViewMode}
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  disabled={isViewMode}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Info Panel */}
          {contract && !isCreateMode && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Value:</span>
                    <span className="font-medium">
                      {formatCurrency(contract.total_value || 0, contract.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Revenue:</span>
                    <span className="font-medium">
                      {formatCurrency(contract.monthly_revenue || 0, contract.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Profitability Score:</span>
                    <div className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                      <span className="font-medium">{contract.profitability_score?.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Renewal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contract.renewal_date && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Renewal Date:</span>
                        <span className="font-medium">
                          {format(new Date(contract.renewal_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Days Until Renewal:</span>
                        <span className="font-medium">{contract.days_until_renewal} days</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Renewal Risk:</span>
                    <Badge variant={getRenewalRiskColor(contract.renewal_risk)}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {contract.renewal_risk?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Auto Renewal:</span>
                    <Badge variant={contract.auto_renewal ? 'default' : 'secondary'}>
                      {contract.auto_renewal ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Client:</span>
                    <span className="font-medium">{contract.clients?.name || 'Unknown Client'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isViewMode && (
            <Button>
              {isCreateMode ? 'Create Contract' : 'Save Changes'}
            </Button>
          )}
          {isViewMode && (
            <Button onClick={() => {}}>
              Edit Contract
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};