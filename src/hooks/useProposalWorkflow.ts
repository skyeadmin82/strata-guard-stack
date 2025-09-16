import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Proposal, 
  ProposalApproval, 
  ProposalSignature, 
  ProposalNotification 
} from '@/types/database';

interface ApprovalChainConfig {
  levels: Array<{
    level: number;
    approver_ids: string[];
    required_approvals: number;
    timeout_hours: number;
  }>;
  parallel_approval: boolean;
  auto_advance: boolean;
}

interface SignatureRequest {
  signer_email: string;
  signer_name: string;
  signature_type: 'electronic' | 'digital' | 'wet_signature' | 'api_signature';
  expires_in_days: number;
  custom_message?: string;
}

interface WorkflowStatus {
  current_stage: 'draft' | 'approval' | 'signature' | 'completed' | 'rejected';
  approval_progress: {
    current_level: number;
    total_levels: number;
    pending_approvals: number;
    completed_approvals: number;
  };
  signature_progress: {
    pending_signatures: number;
    completed_signatures: number;
    total_signatures: number;
  };
  errors: string[];
  warnings: string[];
}

export const useProposalWorkflow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);

  const initateApprovalChain = useCallback(async (
    proposalId: string,
    approvalConfig: ApprovalChainConfig
  ): Promise<{ success: boolean; errors?: string[] }> => {
    setIsProcessing(true);

    try {
      const errors: string[] = [];

      // Validate proposal is in correct state
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      if (proposal.status !== 'draft') {
        errors.push('Proposal must be in draft status to start approval process');
      }

      // Validate approval configuration
      if (!approvalConfig.levels || approvalConfig.levels.length === 0) {
        errors.push('At least one approval level must be configured');
      }

      for (const level of approvalConfig.levels) {
        if (!level.approver_ids || level.approver_ids.length === 0) {
          errors.push(`Level ${level.level} has no approvers assigned`);
        }

        if (level.required_approvals > level.approver_ids.length) {
          errors.push(`Level ${level.level} requires more approvals than available approvers`);
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Create approval records for first level (or all levels if parallel)
      const levelsToCreate = approvalConfig.parallel_approval 
        ? approvalConfig.levels 
        : [approvalConfig.levels[0]];

      const approvalPromises = levelsToCreate.flatMap(level =>
        level.approver_ids.map(approverId => 
          supabase
            .from('proposal_approvals')
            .insert({
              tenant_id: proposal.tenant_id,
              proposal_id: proposalId,
              approver_id: approverId,
              approval_level: level.level,
              status: 'pending' as const,
              timeout_at: new Date(Date.now() + level.timeout_hours * 60 * 60 * 1000).toISOString()
            })
        )
      );

      const approvalResults = await Promise.all(approvalPromises);
      
      // Check for approval creation errors
      const approvalErrors = approvalResults.filter(result => result.error);
      if (approvalErrors.length > 0) {
        throw new Error(`Failed to create ${approvalErrors.length} approval records`);
      }

      // Update proposal status
      await supabase
        .from('proposals')
        .update({
          status: 'pending_approval',
          updated_at: new Date().toISOString()
        })
        .eq('id', proposalId);

      // Send approval notifications
      await sendApprovalNotifications(proposalId, levelsToCreate[0]);

      toast({
        title: "Approval Process Started",
        description: `Approval requests sent to ${levelsToCreate.reduce((sum, l) => sum + l.approver_ids.length, 0)} approvers.`,
      });

      return { success: true };

    } catch (error) {
      console.error('Approval chain initiation failed:', error);

      // Log error
      await supabase
        .from('error_logs')
        .insert({
          tenant_id: 'demo-tenant-id',
          error_type: 'approval_initiation_failed',
          error_message: error.message,
          context: { proposal_id: proposalId, approval_config: JSON.stringify(approvalConfig) } as any
        });

      toast({
        title: "Approval Process Failed",
        description: "Failed to start approval process. Please try again.",
        variant: "destructive",
      });

      return { success: false, errors: [error.message] };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const sendApprovalNotifications = useCallback(async (
    proposalId: string,
    level: ApprovalChainConfig['levels'][0]
  ) => {
    try {
      // Get proposal details for notification
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*, clients(*)')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      // Get approver details
      const { data: approvers, error: approversError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', level.approver_ids);

      if (approversError) throw approversError;

      // Create notification records
      const notifications = approvers.map(approver => ({
        tenant_id: proposal.tenant_id,
        proposal_id: proposalId,
        notification_type: 'approval_request',
        recipient_email: approver.email,
        subject: `Approval Required: ${proposal.title}`,
        content: `
          A proposal requires your approval:
          
          Proposal: ${proposal.title}
          Client: ${(proposal as any).clients?.name || 'Unknown'}
          Amount: $${proposal.final_amount?.toFixed(2) || 0}
          
          Please review and approve or reject this proposal.
        `
      }));

      const { error: notificationError } = await supabase
        .from('proposal_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Failed to create approval notifications:', notificationError);
      }

      // Update approval records to indicate notifications sent
      await supabase
        .from('proposal_approvals')
        .update({ notification_sent: true })
        .eq('proposal_id', proposalId)
        .eq('approval_level', level.level);

    } catch (error) {
      console.error('Failed to send approval notifications:', error);
    }
  }, []);

  const processApproval = useCallback(async (
    approvalId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<{ success: boolean; nextStage?: string }> => {
    setIsProcessing(true);

    try {
      // Update approval record
      const { data: approval, error: approvalError } = await supabase
        .from('proposal_approvals')
        .update({
          status: decision,
          comments,
          approved_at: decision === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', approvalId)
        .select('*, proposals(*)')
        .single();

      if (approvalError) throw approvalError;

      const proposal = (approval as any).proposals;

      // Check if this was a rejection
      if (decision === 'rejected') {
        // Update proposal status to rejected
        await supabase
          .from('proposals')
          .update({
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', approval.proposal_id);

        // Notify stakeholders of rejection
        await sendRejectionNotification(approval.proposal_id, comments);

        toast({
          title: "Proposal Rejected",
          description: "Proposal has been rejected and stakeholders have been notified.",
        });

        return { success: true, nextStage: 'rejected' };
      }

      // Check approval progress for this proposal
      const { data: allApprovals, error: progressError } = await supabase
        .from('proposal_approvals')
        .select('*')
        .eq('proposal_id', approval.proposal_id);

      if (progressError) throw progressError;

      // Determine next steps based on approval configuration
      const currentLevel = approval.approval_level;
      const levelApprovals = allApprovals.filter(a => a.approval_level === currentLevel);
      const approvedInLevel = levelApprovals.filter(a => a.status === 'approved').length;
      const rejectedInLevel = levelApprovals.filter(a => a.status === 'rejected').length;

      // Check if level is complete (simplified logic - would need actual config)
      const levelComplete = approvedInLevel >= 1; // Assuming 1 approval needed per level

      if (levelComplete) {
        // Check if there are more levels
        const maxLevel = Math.max(...allApprovals.map(a => a.approval_level));
        
        if (currentLevel < maxLevel) {
          // Advance to next level
          await advanceToNextApprovalLevel(approval.proposal_id, currentLevel + 1);
          return { success: true, nextStage: 'next_approval_level' };
        } else {
          // All approvals complete - move to signature stage
          await supabase
            .from('proposals')
            .update({
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', approval.proposal_id);

          toast({
            title: "Proposal Approved",
            description: "All approvals complete. Proposal is ready for signatures.",
          });

          return { success: true, nextStage: 'signature' };
        }
      }

      toast({
        title: "Approval Recorded",
        description: `Your ${decision} has been recorded. Waiting for other approvals.`,
      });

      return { success: true, nextStage: 'pending' };

    } catch (error) {
      console.error('Approval processing failed:', error);

      toast({
        title: "Approval Processing Failed",
        description: "Failed to process approval. Please try again.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const advanceToNextApprovalLevel = useCallback(async (
    proposalId: string,
    nextLevel: number
  ) => {
    // In a real implementation, this would check the approval configuration
    // and create approval records for the next level
    console.log(`Advancing proposal ${proposalId} to approval level ${nextLevel}`);
  }, []);

  const sendRejectionNotification = useCallback(async (
    proposalId: string,
    rejectionReason?: string
  ) => {
    try {
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select('*, clients(*)')
        .eq('id', proposalId)
        .single();

      if (error) throw error;

      // Create rejection notification
      await supabase
        .from('proposal_notifications')
        .insert({
          tenant_id: proposal.tenant_id,
          proposal_id: proposalId,
          notification_type: 'proposal_rejected',
          recipient_email: (proposal as any).clients?.email || 'unknown@example.com',
          subject: `Proposal Rejected: ${proposal.title}`,
          content: `
            Your proposal has been rejected.
            
            Proposal: ${proposal.title}
            ${rejectionReason ? `Reason: ${rejectionReason}` : ''}
            
            Please contact us for more information.
          `
        });

    } catch (error) {
      console.error('Failed to send rejection notification:', error);
    }
  }, []);

  const requestSignature = useCallback(async (
    proposalId: string,
    signatureRequest: SignatureRequest
  ): Promise<{ success: boolean; signatureId?: string }> => {
    setIsSending(true);

    try {
      // Validate proposal is in correct state
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      if (proposal.status !== 'approved') {
        throw new Error('Proposal must be approved before requesting signatures');
      }

      // Create signature record
      const signatureData = {
        tenant_id: proposal.tenant_id,
        proposal_id: proposalId,
        signer_email: signatureRequest.signer_email,
        signer_name: signatureRequest.signer_name,
        signature_type: signatureRequest.signature_type,
        expires_at: new Date(Date.now() + signatureRequest.expires_in_days * 24 * 60 * 60 * 1000).toISOString(),
        verification_code: generateVerificationCode()
      };

      const { data: signature, error: signatureError } = await supabase
        .from('proposal_signatures')
        .insert(signatureData)
        .select()
        .single();

      if (signatureError) throw signatureError;

      // Send signature request notification
      await sendSignatureNotification(proposalId, signature as ProposalSignature, signatureRequest.custom_message);

      toast({
        title: "Signature Request Sent",
        description: `Signature request sent to ${signatureRequest.signer_email}`,
      });

      return { success: true, signatureId: signature.id };

    } catch (error) {
      console.error('Signature request failed:', error);

      // Log signature error
      await supabase
        .from('proposal_signatures')
        .update({
          delivery_attempts: 1,
          delivery_errors: [{ error: error.message, timestamp: new Date().toISOString() }]
        })
        .eq('proposal_id', proposalId)
        .eq('signer_email', signatureRequest.signer_email);

      toast({
        title: "Signature Request Failed",
        description: "Failed to send signature request. Please try again.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsSending(false);
    }
  }, []);

  const generateVerificationCode = useCallback((): string => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }, []);

  const sendSignatureNotification = useCallback(async (
    proposalId: string,
    signature: ProposalSignature,
    customMessage?: string
  ) => {
    try {
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      // Create signature notification
      await supabase
        .from('proposal_notifications')
        .insert({
          tenant_id: proposal.tenant_id,
          proposal_id: proposalId,
          notification_type: 'signature_request',
          recipient_email: signature.signer_email,
          subject: `Signature Required: ${proposal.title}`,
          content: `
            ${customMessage || 'A proposal requires your signature.'}
            
            Proposal: ${proposal.title}
            Amount: $${proposal.final_amount?.toFixed(2) || 0}
            Verification Code: ${signature.verification_code}
            
            Please click the link to review and sign the proposal.
            This request expires on ${new Date(signature.expires_at!).toLocaleDateString()}.
          `
        });

    } catch (error) {
      console.error('Failed to send signature notification:', error);
    }
  }, []);

  const processSignature = useCallback(async (
    signatureId: string,
    signatureData: Record<string, any>
  ): Promise<{ success: boolean }> => {
    try {
      // Update signature record
      const { data: signature, error: updateError } = await supabase
        .from('proposal_signatures')
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          is_verified: true,
          ip_address: signatureData.ip_address,
          user_agent: signatureData.user_agent,
          location_data: signatureData.location_data
        })
        .eq('id', signatureId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Check if all required signatures are complete
      const { data: allSignatures, error: signaturesError } = await supabase
        .from('proposal_signatures')
        .select('*')
        .eq('proposal_id', signature.proposal_id);

      if (signaturesError) throw signaturesError;

      const pendingSignatures = allSignatures.filter(s => !s.signed_at);
      
      if (pendingSignatures.length === 0) {
        // All signatures complete - finalize proposal
        await supabase
          .from('proposals')
          .update({
            status: 'accepted',
            accepted_date: new Date().toISOString()
          })
          .eq('id', signature.proposal_id);

        toast({
          title: "Proposal Finalized",
          description: "All signatures complete. Proposal is now finalized.",
        });
      } else {
        toast({
          title: "Signature Recorded",
          description: `Signature recorded. ${pendingSignatures.length} signatures remaining.`,
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Signature processing failed:', error);

      toast({
        title: "Signature Processing Failed",
        description: "Failed to process signature. Please try again.",
        variant: "destructive",
      });

      return { success: false };
    }
  }, []);

  const getWorkflowStatus = useCallback(async (proposalId: string): Promise<WorkflowStatus> => {
    try {
      // Get proposal status
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      // Get approval progress
      const { data: approvals, error: approvalsError } = await supabase
        .from('proposal_approvals')
        .select('*')
        .eq('proposal_id', proposalId);

      if (approvalsError) throw approvalsError;

      // Get signature progress
      const { data: signatures, error: signaturesError } = await supabase
        .from('proposal_signatures')
        .select('*')
        .eq('proposal_id', proposalId);

      if (signaturesError) throw signaturesError;

      // Calculate approval progress
      const maxLevel = approvals.length > 0 ? Math.max(...approvals.map(a => a.approval_level)) : 0;
      const completedApprovals = approvals.filter(a => a.status === 'approved').length;
      const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

      // Calculate signature progress
      const completedSignatures = signatures.filter(s => s.signed_at).length;
      const pendingSignatures = signatures.filter(s => !s.signed_at).length;

      // Determine current stage
      let current_stage: WorkflowStatus['current_stage'] = 'draft';
      
      if (proposal.status === 'rejected') {
        current_stage = 'rejected';
      } else if (proposal.status === 'accepted') {
        current_stage = 'completed';
      } else if (signatures.length > 0) {
        current_stage = 'signature';
      } else if (approvals.length > 0) {
        current_stage = 'approval';
      }

      const status: WorkflowStatus = {
        current_stage,
        approval_progress: {
          current_level: maxLevel,
          total_levels: maxLevel,
          pending_approvals: pendingApprovals,
          completed_approvals: completedApprovals
        },
        signature_progress: {
          pending_signatures: pendingSignatures,
          completed_signatures: completedSignatures,
          total_signatures: signatures.length
        },
        errors: [],
        warnings: []
      };

      setWorkflowStatus(status);
      return status;

    } catch (error) {
      console.error('Failed to get workflow status:', error);
      
      const errorStatus: WorkflowStatus = {
        current_stage: 'draft',
        approval_progress: {
          current_level: 0,
          total_levels: 0,
          pending_approvals: 0,
          completed_approvals: 0
        },
        signature_progress: {
          pending_signatures: 0,
          completed_signatures: 0,
          total_signatures: 0
        },
        errors: [error.message],
        warnings: []
      };

      setWorkflowStatus(errorStatus);
      return errorStatus;
    }
  }, []);

  return {
    // State
    isProcessing,
    isSending,
    workflowStatus,

    // Methods
    initateApprovalChain,
    processApproval,
    requestSignature,
    processSignature,
    getWorkflowStatus,

    // Setters
    setWorkflowStatus
  };
};