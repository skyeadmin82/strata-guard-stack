import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Edit, Trash2, Copy, Settings } from 'lucide-react';

interface ProposalTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  template_content: any;
  default_terms?: string;
  default_validity_days: number;
  pricing_structure: any;
  required_fields: string[];
  validation_rules: any;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export const ProposalTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    default_terms: '',
    default_validity_days: 30,
    template_content: '',
    pricing_structure: '',
    required_fields: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        required_fields: Array.isArray(template.required_fields) 
          ? template.required_fields 
          : (typeof template.required_fields === 'string' 
              ? JSON.parse(template.required_fields) 
              : [])
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      default_terms: '',
      default_validity_days: 30,
      template_content: '',
      pricing_structure: '',
      required_fields: '',
    });
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', currentUser.user?.id)
        .single();

      const templateData = {
        tenant_id: userProfile?.tenant_id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        default_terms: formData.default_terms,
        default_validity_days: formData.default_validity_days,
        template_content: formData.template_content ? JSON.parse(formData.template_content) : {},
        pricing_structure: formData.pricing_structure ? JSON.parse(formData.pricing_structure) : {},
        required_fields: formData.required_fields.split(',').map(f => f.trim()).filter(f => f),
        validation_rules: {},
        is_active: true,
        version: editingTemplate ? editingTemplate.version + 1 : 1,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('proposal_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Template updated successfully' });
      } else {
        const { error } = await supabase
          .from('proposal_templates')
          .insert(templateData);

        if (error) throw error;
        toast({ title: 'Success', description: 'Template created successfully' });
      }

      setShowCreateDialog(false);
      resetForm();
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const handleEditTemplate = (template: ProposalTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      default_terms: template.default_terms || '',
      default_validity_days: template.default_validity_days,
      template_content: JSON.stringify(template.template_content, null, 2),
      pricing_structure: JSON.stringify(template.pricing_structure, null, 2),
      required_fields: template.required_fields.join(', '),
    });
    setShowCreateDialog(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('proposal_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Template deleted successfully' });
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTemplate = async (template: ProposalTemplate) => {
    try {
      const { error } = await supabase
        .from('proposal_templates')
        .insert({
          tenant_id: template.tenant_id,
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          template_content: template.template_content,
          default_terms: template.default_terms,
          default_validity_days: template.default_validity_days,
          pricing_structure: template.pricing_structure,
          required_fields: template.required_fields,
          validation_rules: template.validation_rules,
          is_active: template.is_active,
          version: 1,
        });

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Template duplicated successfully' });
      await fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('proposal_templates')
        .update({ is_active: !isActive })
        .eq('id', templateId);

      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `Template ${isActive ? 'deactivated' : 'activated'} successfully` 
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Proposal Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage reusable proposal templates to speed up proposal creation
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this template"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Input
                    id="template-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., IT Services, Consulting"
                  />
                </div>

                <div>
                  <Label htmlFor="validity-days">Default Validity (Days)</Label>
                  <Input
                    id="validity-days"
                    type="number"
                    value={formData.default_validity_days}
                    onChange={(e) => setFormData({ ...formData, default_validity_days: parseInt(e.target.value) || 30 })}
                  />
                </div>

                <div>
                  <Label htmlFor="required-fields">Required Fields (comma-separated)</Label>
                  <Input
                    id="required-fields"
                    value={formData.required_fields}
                    onChange={(e) => setFormData({ ...formData, required_fields: e.target.value })}
                    placeholder="client_name, project_scope, timeline"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-content">Template Content (JSON)</Label>
                  <Textarea
                    id="template-content"
                    value={formData.template_content}
                    onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                    placeholder="JSON structure for template content"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="pricing-structure">Pricing Structure (JSON)</Label>
                  <Textarea
                    id="pricing-structure"
                    value={formData.pricing_structure}
                    onChange={(e) => setFormData({ ...formData, pricing_structure: e.target.value })}
                    placeholder="JSON structure for pricing rules"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="default-terms">Default Terms & Conditions</Label>
                  <Textarea
                    id="default-terms"
                    value={formData.default_terms}
                    onChange={(e) => setFormData({ ...formData, default_terms: e.target.value })}
                    placeholder="Default terms and conditions"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || 'uncategorized'}>
                    {category || 'Uncategorized'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardContent>
          {filteredTemplates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.category && (
                        <Badge variant="outline">{template.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>v{template.version}</TableCell>
                    <TableCell>
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'No templates match your current filters'
                  : 'Create your first proposal template to get started'
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};