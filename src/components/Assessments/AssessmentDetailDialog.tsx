import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Assessment } from '@/types/database';
import { 
  ClipboardCheck, 
  Calendar, 
  User, 
  TrendingUp, 
  FileText, 
  Download 
} from 'lucide-react';
import { format } from 'date-fns';

interface AssessmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment | null;
  clientName?: string;
  templateName?: string;
  onExportReport?: (assessmentId: string) => void;
}

export const AssessmentDetailDialog: React.FC<AssessmentDetailDialogProps> = ({
  open,
  onOpenChange,
  assessment,
  clientName,
  templateName,
  onExportReport
}) => {
  if (!assessment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'draft': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Assessment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{assessment.title}</h3>
                  <p className="text-sm text-muted-foreground">{clientName}</p>
                </div>
                <Badge variant={getStatusColor(assessment.status)}>
                  {assessment.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>Template</span>
                  </div>
                  <p className="font-medium">{templateName || 'Unknown Template'}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Started</span>
                  </div>
                  <p className="font-medium">
                    {assessment.started_at ? format(new Date(assessment.started_at), 'MMM dd, yyyy') : 'Not started'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Assessed By</span>
                  </div>
                  <p className="font-medium">{assessment.assessed_by || 'System'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Overview */}
          {assessment.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Score Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(assessment.percentage_score || 0)}`}>
                      {assessment.percentage_score?.toFixed(1) || 0}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={assessment.percentage_score || 0} 
                    className="h-3"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Score: {assessment.total_score} / {assessment.max_possible_score}</span>
                    <span>
                      {assessment.completed_at ? 
                        `Completed ${format(new Date(assessment.completed_at), 'MMM dd, yyyy')}` : 
                        'In Progress'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {assessment.description || 'No description available'}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-muted-foreground">
                      {format(new Date(assessment.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <p className="text-muted-foreground">
                      {format(new Date(assessment.updated_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>

                  {assessment.started_at && (
                    <div>
                      <span className="font-medium">Started:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(assessment.started_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}

                  {assessment.completed_at && (
                    <div>
                      <span className="font-medium">Completed:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(assessment.completed_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {assessment.status === 'completed' && onExportReport && (
              <Button onClick={() => onExportReport(assessment.id)}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};