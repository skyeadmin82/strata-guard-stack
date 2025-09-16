import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react';
import { EnhancedContract } from '@/hooks/useEnhancedContractManagement';
import { format } from 'date-fns';

interface RenewalRemindersProps {
  contracts: EnhancedContract[];
  onViewContract: (contract: EnhancedContract) => void;
}

export const RenewalReminders = ({ contracts, onViewContract }: RenewalRemindersProps) => {
  // Filter contracts that need renewal attention
  const expiringContracts = contracts.filter(contract => 
    contract.days_until_renewal !== null && 
    contract.days_until_renewal <= 90 &&
    contract.status === 'active'
  ).sort((a, b) => (a.days_until_renewal || 0) - (b.days_until_renewal || 0));

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getRiskColor = (days: number) => {
    if (days < 30) return 'destructive';
    if (days < 60) return 'secondary';
    return 'default';
  };

  const getRiskLabel = (days: number) => {
    if (days < 30) return 'Critical';
    if (days < 60) return 'Warning';
    return 'Notice';
  };

  if (expiringContracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Renewal Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No contracts requiring renewal attention</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Renewal Reminders
          </div>
          <Badge variant="secondary">{expiringContracts.length} contracts</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expiringContracts.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium truncate">{contract.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {contract.clients?.name} • Contract #{contract.contract_number}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiskColor(contract.days_until_renewal || 0)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getRiskLabel(contract.days_until_renewal || 0)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.days_until_renewal} days remaining
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {contract.renewal_date && format(new Date(contract.renewal_date), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatCurrency(contract.total_value || 0, contract.currency)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={contract.auto_renewal ? 'default' : 'outline'}>
                      {contract.auto_renewal ? 'Auto-Renewal' : 'Manual'}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewContract(contract)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total renewal revenue at risk:</span>
            <span className="font-medium">
              {formatCurrency(
                expiringContracts.reduce((sum, contract) => sum + (contract.total_value || 0), 0),
                'USD'
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};