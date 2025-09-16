import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';

export const ProductionDataCleanup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const handleCleanup = async () => {
    if (!tenant?.id) {
      toast({
        title: "Error",
        description: "No tenant found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-production-data', {
        body: { tenant_id: tenant.id }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Cleanup Completed",
          description: data.message,
        });
      } else {
        toast({
          title: "Cleanup Completed with Warnings",
          description: `${data.message} Errors: ${data.errors.join(', ')}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: "An error occurred during cleanup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Production Data Cleanup
        </CardTitle>
        <CardDescription>
          Remove all clients, leads, proposals and associated data from your production environment.
          <strong className="block mt-1 text-destructive">This action cannot be undone!</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? 'Cleaning up...' : 'Clean Production Data'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete ALL of the following data from your production environment:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All clients and their associated contacts</li>
                  <li>All support tickets and time tracking</li>
                  <li>All contracts and payments</li>
                  <li>All proposals and signatures</li>
                  <li>All assessments and responses</li>
                  <li>All invoices and financial data</li>
                  <li>All email campaigns and analytics</li>
                  <li>All audit logs and activities</li>
                </ul>
                <strong className="block mt-3 text-destructive">This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCleanup}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};