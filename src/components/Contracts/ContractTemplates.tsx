import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  contract_type: string;
  template_content: string;
  is_active: boolean;
  created_at: string;
}

export const ContractTemplates = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contract_type: 'msp',
    template_content: '',
    default_pricing_type: 'fixed'
  });
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      contract_type: 'msp',
      template_content: '',
      default_pricing_type: 'fixed'
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      contract_type: template.contract_type,
      template_content: template.template_content,
      default_pricing_type: 'fixed' // Default since it's not in the existing data
    });
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('contract_templates')
          .update({
            name: formData.name,
            description: formData.description,
            contract_type: formData.contract_type,
            template_content: formData.template_content,
            default_pricing_type: formData.default_pricing_type
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('contract_templates')
          .insert({
            name: formData.name,
            description: formData.description,
            contract_type: formData.contract_type,
            template_content: formData.template_content,
            default_pricing_type: formData.default_pricing_type
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Contract Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading templates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Contract Templates
            </div>
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.contract_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {template.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first contract template to get started
              </p>
              <Button onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="MSP Service Agreement"
                />
              </div>
              <div>
                <Label htmlFor="contract_type">Contract Type</Label>
                <Select 
                  value={formData.contract_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msp">MSP Agreement</SelectItem>
                    <SelectItem value="service">Service Agreement</SelectItem>
                    <SelectItem value="project">Project Contract</SelectItem>
                    <SelectItem value="maintenance">Maintenance Contract</SelectItem>
                    <SelectItem value="support">Support Contract</SelectItem>
                    <SelectItem value="consulting">Consulting Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the template..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="template_content">Template Content</Label>
              <Textarea
                id="template_content"
                value={formData.template_content}
                onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                placeholder="Enter the contract template content..."
                rows={8}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};