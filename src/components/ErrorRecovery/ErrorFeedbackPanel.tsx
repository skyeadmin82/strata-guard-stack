import React, { useState } from 'react';
import { AlertTriangle, MessageSquare, Camera, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useErrorReporting, ErrorReport } from '@/hooks/useErrorReporting';

interface ErrorFeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: Error | string;
  initialContext?: Record<string, any>;
}

export const ErrorFeedbackPanel: React.FC<ErrorFeedbackPanelProps> = ({
  isOpen,
  onClose,
  initialError,
  initialContext = {}
}) => {
  const [errorType, setErrorType] = useState<ErrorReport['errorType']>('other');
  const [severity, setSeverity] = useState<ErrorReport['severity']>('error');
  const [description, setDescription] = useState(
    typeof initialError === 'string' ? initialError : initialError?.message || ''
  );
  const [userAction, setUserAction] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);

  const { submitErrorReport, isReporting } = useErrorReporting();

  const handleSubmit = async () => {
    if (!description.trim()) return;

    await submitErrorReport(
      description,
      errorType,
      severity,
      userAction,
      includeScreenshot,
      initialContext
    );

    // Reset form
    setDescription('');
    setUserAction('');
    setErrorType('other');
    setSeverity('error');
    setIncludeScreenshot(true);
    onClose();
  };

  const getSeverityColor = (sev: ErrorReport['severity']) => {
    switch (sev) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (sev: ErrorReport['severity']) => {
    switch (sev) {
      case 'info': return <CheckCircle className="w-3 h-3" />;
      case 'warning': return <Clock className="w-3 h-3" />;
      case 'error': return <XCircle className="w-3 h-3" />;
      case 'critical': return <AlertTriangle className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Report Issue
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Issue Type</label>
              <Select value={errorType} onValueChange={(value) => setErrorType(value as ErrorReport['errorType'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ui">UI/Display Issue</SelectItem>
                  <SelectItem value="network">Network Problem</SelectItem>
                  <SelectItem value="validation">Data Validation</SelectItem>
                  <SelectItem value="permission">Permission Error</SelectItem>
                  <SelectItem value="system">System Error</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as ErrorReport['severity'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-yellow-500" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-500" />
                      Error
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      Critical
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getSeverityColor(severity)}>
              {getSeverityIcon(severity)}
              <span className="ml-1 capitalize">{severity}</span>
            </Badge>
            <Badge variant="outline">
              {errorType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe the issue <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what happened and what you expected to happen..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              What were you trying to do?
            </label>
            <Textarea
              value={userAction}
              onChange={(e) => setUserAction(e.target.value)}
              placeholder="Describe the steps you took before the issue occurred..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Include screenshot</span>
            </div>
            <Button
              variant={includeScreenshot ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeScreenshot(!includeScreenshot)}
            >
              {includeScreenshot ? "Included" : "Not included"}
            </Button>
          </div>

          {includeScreenshot && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              A screenshot of the current page will be automatically captured to help us understand the issue better.
            </div>
          )}

          <Separator />

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit}
              disabled={!description.trim() || isReporting}
              className="flex-1"
            >
              {isReporting ? 'Submitting...' : 'Submit Report'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Your report helps us improve the application. Technical details and user information are automatically included to help with diagnosis.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};