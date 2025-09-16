import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useErrorRecoveryContext } from './ErrorRecoveryProvider';

export const SessionTimeoutWarning: React.FC = () => {
  const { 
    sessionTimeRemaining, 
    extendSession, 
    isSessionWarningShown 
  } = useErrorRecoveryContext();

  if (!isSessionWarningShown || sessionTimeRemaining === null) return null;

  const minutes = Math.floor(sessionTimeRemaining / 60);
  const seconds = sessionTimeRemaining % 60;
  const progressPercentage = Math.max(0, (sessionTimeRemaining / (5 * 60)) * 100); // 5 minutes total warning time

  return (
    <div className="fixed top-4 right-4 z-50 w-80 animate-in slide-in-from-right duration-300">
      <Card className="border-yellow-200 bg-yellow-50/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Clock className="w-5 h-5" />
            Session Expiring
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your session will expire due to inactivity
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-800">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-yellow-600">
              Time remaining
            </div>
          </div>

          <Progress 
            value={progressPercentage} 
            className="h-2"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={extendSession}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Stay Signed In
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                // User chooses to sign out
                window.location.href = '/auth';
              }}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <LogOut className="w-3 h-3 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
            <strong>Data Protection:</strong> Your work is automatically saved and will be restored when you sign back in.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};