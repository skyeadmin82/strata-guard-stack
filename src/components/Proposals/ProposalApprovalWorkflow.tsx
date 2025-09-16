import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  AlertCircle,
  MessageSquare,
  Send,
  Eye,
  FileCheck,
  Users,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApprovalStep {
  id: string;
  step_order: number;
  approver_id: string;
  approver_name: string;
  approver_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comments?: string;
  approved_at?: string;
  required: boolean;
}

interface ApprovalWorkflow {
  id: string;
  proposal_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  completed_at?: string;
  steps: ApprovalStep[];
}

interface ProposalApprovalWorkflowProps {
  proposalId: string;
  proposalTitle: string;
  onStatusChange?: () => void;
}

export const ProposalApprovalWorkflow: React.FC<ProposalApprovalWorkflowProps> = ({
  proposalId,
  proposalTitle,
  onStatusChange
}) => {
  const [workflow, setWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ApprovalStep | null>(null);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();

  useEffect(() => {
    fetchApprovalWorkflow();
  }, [proposalId]);

  const fetchApprovalWorkflow = async () => {
    try {
      setLoading(true);
      
      // First check if a workflow exists for this proposal
      const { data: workflowData, error: workflowError } = await supabase
        .from('proposal_approval_workflows')
        .select(`
          id,
          proposal_id,
          status,
          created_at,
          completed_at
        `)
        .eq('proposal_id', proposalId)
        .single();

      if (workflowError && workflowError.code !== 'PGRST116') {
        throw workflowError;
      }

      let workflow: ApprovalWorkflow;

      if (!workflowData) {
        // Create a sample workflow for demonstration
        workflow = {
          id: 'demo-workflow',
          proposal_id: proposalId,
          status: 'pending',
          created_at: new Date().toISOString(),
          steps: [
            {
              id: 'step-1',
              step_order: 1,
              approver_id: 'demo-user-1',
              approver_name: 'Sarah Johnson',
              approver_email: 'sarah@company.com',
              status: 'approved',
              comments: 'Technical review completed. All requirements met.',
              approved_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              required: true
            },
            {
              id: 'step-2',
              step_order: 2,
              approver_id: 'demo-user-2',
              approver_name: 'Michael Chen',
              approver_email: 'michael@company.com',
              status: 'pending',
              required: true
            },
            {
              id: 'step-3',
              step_order: 3,
              approver_id: 'demo-user-3',
              approver_name: 'David Rodriguez',
              approver_email: 'david@company.com',
              status: 'pending',
              required: false
            }
          ]
        };
      } else {
        // Fetch the approval steps
        const { data: stepsData, error: stepsError } = await supabase
          .from('proposal_approval_steps')
          .select('*')
          .eq('workflow_id', workflowData.id)
          .order('step_order', { ascending: true });

        if (stepsError) throw stepsError;

        workflow = {
          ...workflowData,
          status: workflowData.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
          steps: (stepsData || []).map(step => ({
            id: step.id,
            step_order: step.step_order,
            approver_id: step.approver_id,
            approver_name: step.approver_name,
            approver_email: step.approver_email,
            status: step.status as 'pending' | 'approved' | 'rejected' | 'skipped',
            comments: step.comments,
            approved_at: step.approved_at,
            required: step.required
          }))
        };
      }

      setWorkflow(workflow);
    } catch (error) {
      console.error('Error fetching approval workflow:', error);
      toast({
        title: 'Info',
        description: 'Using demo approval workflow. Set up approval workflows in your settings.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (stepId: string, action: 'approve' | 'reject', comment: string) => {
    try {
      // Update the step status
      if (workflow) {
        const updatedSteps = workflow.steps.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              status: action === 'approve' ? 'approved' as const : 'rejected' as const,
              comments: comment,
              approved_at: new Date().toISOString()
            };
          }
          return step;
        });

        // Check if workflow is complete
        const allRequiredApproved = updatedSteps
          .filter(step => step.required)
          .every(step => step.status === 'approved');
        
        const anyRejected = updatedSteps.some(step => step.status === 'rejected');

        let workflowStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' = 'pending';
        if (anyRejected) {
          workflowStatus = 'rejected';
        } else if (allRequiredApproved) {
          workflowStatus = 'approved';
        }

        setWorkflow({
          ...workflow,
          steps: updatedSteps,
          status: workflowStatus,
          completed_at: workflowStatus !== 'pending' ? new Date().toISOString() : undefined
        });

        toast({
          title: 'Success',
          description: `Proposal ${action}d successfully`,
        });

        onStatusChange?.();
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to update approval',
        variant: 'destructive',
      });
    }
  };

  const openCommentDialog = (step: ApprovalStep, action: 'approve' | 'reject') => {
    setSelectedStep(step);
    setActionType(action);
    setComment(step.comments || '');
    setShowCommentDialog(true);
  };

  const submitApproval = () => {
    if (selectedStep) {
      handleApprovalAction(selectedStep.id, actionType, comment);
      setShowCommentDialog(false);
      setComment('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Approval Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No approval workflow found for this proposal</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepIndex = workflow.steps.findIndex(step => step.status === 'pending');
  const completedSteps = workflow.steps.filter(step => step.status === 'approved').length;
  const totalRequiredSteps = workflow.steps.filter(step => step.required).length;

  return (
    <div className="space-y-6">
      {/* Workflow Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Approval Workflow
            </CardTitle>
            <Badge variant={getStatusColor(workflow.status)} className="text-sm">
              {workflow.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {proposalTitle} - {completedSteps}/{totalRequiredSteps} required approvals completed
          </p>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((completedSteps / totalRequiredSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps / totalRequiredSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Approval Steps */}
          <div className="space-y-4">
            {workflow.steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index < workflow.steps.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
                )}
                
                <div className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                  <div className="flex flex-col items-center">
                    {getStatusIcon(step.status)}
                    <span className="text-xs text-muted-foreground mt-1">
                      Step {step.step_order}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{step.approver_name}</h4>
                        <Badge variant="outline">
                          {step.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                        {step.status === 'pending' && currentStepIndex === index && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCommentDialog(step, 'approve')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCommentDialog(step, 'reject')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      {step.approver_email}
                    </div>
                    
                    {step.approved_at && (
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {step.status === 'approved' ? 'Approved' : 'Rejected'} on {format(new Date(step.approved_at), 'PPP p')}
                      </div>
                    )}
                    
                    {step.comments && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium">Comments:</span>
                        </div>
                        <p className="text-sm">{step.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {workflow.steps.filter(s => s.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {workflow.steps.filter(s => s.status === 'rejected').length}
                </div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {actionType === 'approve' ? 'Approve' : 'Reject'} Proposal
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Comments</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Add your ${actionType === 'approve' ? 'approval' : 'rejection'} comments...`}
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitApproval}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {actionType === 'approve' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};