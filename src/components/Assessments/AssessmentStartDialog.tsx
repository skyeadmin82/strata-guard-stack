import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Clock, 
  FileText, 
  Target,
  Play,
  AlertCircle
} from 'lucide-react';

interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  estimated_duration?: number;
  question_count?: number;
  max_score?: number;
}

interface Client {
  id: string;
  name: string;
  industry?: string;
}

interface AssessmentStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssessmentStartDialog: React.FC<AssessmentStartDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  
  const { toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [templatesResult, clientsResult] = await Promise.all([
        supabase
          .from('assessment_templates')
          .select('id, name, description, category, estimated_duration, max_score')
          .eq('status', 'active')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('clients')
          .select('id, name, industry')
          .eq('status', 'active')
          .order('name')
      ]);

      if (templatesResult.error) throw templatesResult.error;
      if (clientsResult.error) throw clientsResult.error;

      // Get question counts for templates
      const templatesWithCounts = await Promise.all(
        (templatesResult.data || []).map(async (template) => {
          const { count } = await supabase
            .from('assessment_questions')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id);

          return {
            ...template,
            question_count: count || 0
          };
        })
      );

      setTemplates(templatesWithCounts);
      setClients(clientsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates and clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async () => {
    if (!selectedTemplate || !selectedClient) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a template and client',
        variant: 'destructive',
      });
      return;
    }

    try {
      setStarting(true);

      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
          tenant_id: profile?.tenant_id,
          template_id: selectedTemplate,
          client_id: selectedClient,
          assessor_id: profile?.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          current_question: 1,
          total_score: 0,
          max_possible_score: 0,
          percentage_score: 0,
          created_by: profile?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Assessment Started',
        description: 'The assessment has been created and is ready to begin',
      });

      onOpenChange(false);
      navigate(`/assessments/${assessment.id}/execute`);

    } catch (error) {
      console.error('Error starting assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to start assessment',
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Start New Assessment
          </DialogTitle>
          <DialogDescription>
            Select a template and client to begin a new assessment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Assessment Template *</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an assessment template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.category && (
                          <div className="text-xs text-muted-foreground">{template.category}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.industry && (
                          <div className="text-xs text-muted-foreground">{client.industry}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assessment Preview */}
          {selectedTemplateData && selectedClientData && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Assessment Preview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Template</p>
                    <p className="font-medium">{selectedTemplateData.name}</p>
                    {selectedTemplateData.category && (
                      <Badge variant="outline" className="mt-1">
                        {selectedTemplateData.category}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedClientData.name}</p>
                    {selectedClientData.industry && (
                      <p className="text-xs text-muted-foreground">{selectedClientData.industry}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Questions
                    </p>
                    <p className="font-medium">{selectedTemplateData.question_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration
                    </p>
                    <p className="font-medium">
                      {selectedTemplateData.estimated_duration 
                        ? `~${selectedTemplateData.estimated_duration} min` 
                        : 'Not specified'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Max Score
                    </p>
                    <p className="font-medium">{selectedTemplateData.max_score || 'Not set'}</p>
                  </div>
                </div>

                {selectedTemplateData.description && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedTemplateData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          {selectedTemplate && selectedClient && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Ready to Start</p>
                <p className="text-amber-700 mt-1">
                  This will create a new assessment session. You can save your progress and return to complete it later.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={startAssessment}
            disabled={!selectedTemplate || !selectedClient || starting || loading}
          >
            {starting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Assessment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};