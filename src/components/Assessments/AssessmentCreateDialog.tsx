import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, FileText, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssessmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string }>;
  templates: Array<{ id: string; name: string; category?: string }>;
  onAssessmentCreated?: () => void;
}

export const AssessmentCreateDialog: React.FC<AssessmentCreateDialogProps> = ({
  open,
  onOpenChange,
  clients,
  templates,
  onAssessmentCreated
}) => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateAssessment = async () => {
    if (!selectedClient || !selectedTemplate) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a client and an assessment template.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Get current user and tenant info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's tenant_id
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Failed to get user profile');
      }

      // Create the assessment
      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
          tenant_id: userProfile.tenant_id,
          client_id: selectedClient,
          template_id: selectedTemplate,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          current_question: 1,
          total_score: 0,
          max_possible_score: 100,
          percentage_score: 0,
          created_by: user.id,
          assessor_id: user.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Assessment Created',
        description: 'New assessment has been created successfully. You can now begin the assessment process.',
      });

      // Reset form
      setSelectedClient('');
      setSelectedTemplate('');
      onOpenChange(false);
      
      // Call callback if provided
      if (onAssessmentCreated) {
        onAssessmentCreated();
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Assessment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Select Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {client.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Select Assessment Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an assessment template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <div>{template.name}</div>
                        {template.category && (
                          <div className="text-xs text-muted-foreground">
                            {template.category}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Card */}
          {selectedClient && selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedClientData?.name}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Template</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-4 h-4" />
                      <span>{selectedTemplateData?.name}</span>
                    </div>
                  </div>
                </div>
                {selectedTemplateData?.category && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{selectedTemplateData.category}</Badge>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Assessment will be started immediately</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAssessment}
              disabled={!selectedClient || !selectedTemplate || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Assessment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};