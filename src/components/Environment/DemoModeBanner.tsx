import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Database, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEnvironment } from '@/contexts/EnvironmentContext';

export const DemoModeBanner: React.FC = () => {
  const { isDemo } = useEnvironment();
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('demo-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('demo-banner-dismissed', 'true');
  };

  const handleShowAgain = () => {
    setIsVisible(true);
    setIsDismissed(false);
    localStorage.removeItem('demo-banner-dismissed');
  };

  if (!isDemo) return null;

  if (isDismissed) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowAgain}
          className="bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          DEMO
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <Card className="mx-4 mt-4 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">
                  Demo Mode Active
                </h3>
                <div className="flex items-center gap-4 text-sm text-orange-700">
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Sample data in use
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Enhanced error testing enabled
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Trigger demo features panel
                  // This would open a side panel with demo controls
                }}
                className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
              >
                Demo Features
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};