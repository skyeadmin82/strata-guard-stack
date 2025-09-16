import React, { useState } from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Environment } from '@/types';
import { Monitor, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EnvironmentSwitcher: React.FC = () => {
  const { environment, switchEnvironment } = useEnvironment();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSwitchEnvironment = async (env: Environment) => {
    if (env === environment) {
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      await switchEnvironment(env);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch environment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEnvironmentColor = (env: Environment) => {
    return env === 'demo' ? 'bg-demo' : 'bg-production';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Monitor className="w-4 h-4" />
          <Badge
            variant="secondary"
            className={cn(
              "text-white border-0",
              getEnvironmentColor(environment)
            )}
          >
            {environment.toUpperCase()}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Switch Environment
          </DialogTitle>
          <DialogDescription>
            Choose which environment you want to work in. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div 
            className={cn(
              "p-4 rounded-lg border-2 cursor-pointer transition-all",
              environment === 'demo' 
                ? "border-demo bg-demo/5" 
                : "border-border hover:border-demo/50"
            )}
            onClick={() => handleSwitchEnvironment('demo')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Demo Environment</h3>
                <p className="text-sm text-muted-foreground">
                  Safe testing environment with sample data
                </p>
              </div>
              <Badge
                variant={environment === 'demo' ? 'default' : 'outline'}
                className={cn(
                  environment === 'demo' && "bg-demo text-white"
                )}
              >
                Demo
              </Badge>
            </div>
          </div>

          <div 
            className={cn(
              "p-4 rounded-lg border-2 cursor-pointer transition-all",
              environment === 'production' 
                ? "border-production bg-production/5" 
                : "border-border hover:border-production/50"
            )}
            onClick={() => handleSwitchEnvironment('production')}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Production Environment</h3>
                <p className="text-sm text-muted-foreground">
                  Live environment with real customer data
                </p>
              </div>
              <Badge
                variant={environment === 'production' ? 'default' : 'outline'}
                className={cn(
                  environment === 'production' && "bg-production text-white"
                )}
              >
                Production
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};