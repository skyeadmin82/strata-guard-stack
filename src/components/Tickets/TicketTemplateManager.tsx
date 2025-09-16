import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  FileText,
  Users,
  Clock
} from 'lucide-react';

interface TicketTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priority: string;
  estimated_hours: number;
  title_template: string;
  description_template: string;
  default_assignee_id: string | null;
  custom_fields: any;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  users?: { first_name: string; last_name: string } | null;
}

export const TicketTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'general',
    priority: 'medium',
    estimated_hours: 0,
    title_template: '',
    description_template: '',
    default_assignee_id: ''
  });

  const [editTemplate, setEditTemplate] = useState({
    name: '',
    description: '',
    category: 'general',
    priority: 'medium',
    estimated_hours: 0,
    title_template: '',
    description_template: '',
    default_assignee_id: ''
  });

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ticket_templates')
        .select(`
          *,
          users:default_assignee_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as unknown as TicketTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'technician')
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
  }, []);

  // Add template
  const handleAddTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id, id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) throw new Error('Failed to get user data');

      const { data, error } = await supabase
        .from('ticket_templates')
        .insert({
          ...newTemplate,
          tenant_id: userData.tenant_id,
          created_by: userData.id,
          estimated_hours: Number(newTemplate.estimated_hours),
          default_assignee_id: newTemplate.default_assignee_id || null
        })
        .select(`
          *,
          users:default_assignee_id(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setTemplates([data as unknown as TicketTemplate, ...templates]);
      setIsAddDialogOpen(false);
      setNewTemplate({
        name: '',
        description: '',
        category: 'general',
        priority: 'medium',
        estimated_hours: 0,
        title_template: '',
        description_template: '',
        default_assignee_id: ''
      });

      toast({
        title: "Success",
        description: "Template created successfully",
      });
    } catch (error) {
      console.error('Error adding template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  // Update template
  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const { data, error } = await supabase
        .from('ticket_templates')
        .update({
          ...editTemplate,
          estimated_hours: Number(editTemplate.estimated_hours),
          default_assignee_id: editTemplate.default_assignee_id || null
        })
        .eq('id', editingTemplate.id)
        .select(`
          *,
          users:default_assignee_id(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setTemplates(templates.map(t => t.id === editingTemplate.id ? data as unknown as TicketTemplate : t));
      setEditingTemplate(null);

      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('ticket_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateId));
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  // Toggle template active status
  const handleToggleActive = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ticket_templates')
        .update({ is_active: !isActive })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.map(t => 
        t.id === templateId ? { ...t, is_active: !isActive } : t
      ));

      toast({
        title: "Success",
        description: `Template ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  // Start editing
  const startEdit = (template: TicketTemplate) => {
    setEditTemplate({
      name: template.name,
      description: template.description || '',
      category: template.category,
      priority: template.priority,
      estimated_hours: template.estimated_hours,
      title_template: template.title_template,
      description_template: template.description_template,
      default_assignee_id: template.default_assignee_id || ''
    });
    setEditingTemplate(template);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ticket Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable ticket templates</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Ticket Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for common ticket types
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name *</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="e.g., Password Reset"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={newTemplate.priority} onValueChange={(value) => setNewTemplate({...newTemplate, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newTemplate.estimated_hours}
                    onChange={(e) => setNewTemplate({...newTemplate, estimated_hours: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <Label>Default Assignee</Label>
                <Select value={newTemplate.default_assignee_id} onValueChange={(value) => setNewTemplate({...newTemplate, default_assignee_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default assignee</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                  placeholder="Template description..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Title Template *</Label>
                <Input
                  value={newTemplate.title_template}
                  onChange={(e) => setNewTemplate({...newTemplate, title_template: e.target.value})}
                  placeholder="e.g., Password Reset Request for {{client_name}}"
                />
              </div>

              <div>
                <Label>Description Template *</Label>
                <Textarea
                  value={newTemplate.description_template}
                  onChange={(e) => setNewTemplate({...newTemplate, description_template: e.target.value})}
                  placeholder="Template description with variables like {{client_name}}, {{contact_name}}, etc."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTemplate} disabled={!newTemplate.name || !newTemplate.title_template || !newTemplate.description_template}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  <Badge variant={template.priority === 'critical' ? 'destructive' : 'secondary'}>
                    {template.priority}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(template)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{template.estimated_hours}h estimated</span>
                </div>
                
                {template.users && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{template.users.first_name} {template.users.last_name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Used {template.usage_count} times</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant={template.is_active ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(template.id, template.is_active)}
                  className="w-full"
                >
                  {template.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {templates.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create your first ticket template to get started</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        )}
      </div>

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update the template details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Template Name *</Label>
                  <Input
                    value={editTemplate.name}
                    onChange={(e) => setEditTemplate({...editTemplate, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={editTemplate.category} onValueChange={(value) => setEditTemplate({...editTemplate, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={editTemplate.priority} onValueChange={(value) => setEditTemplate({...editTemplate, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editTemplate.estimated_hours}
                    onChange={(e) => setEditTemplate({...editTemplate, estimated_hours: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <Label>Default Assignee</Label>
                <Select value={editTemplate.default_assignee_id} onValueChange={(value) => setEditTemplate({...editTemplate, default_assignee_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default assignee</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editTemplate.description}
                  onChange={(e) => setEditTemplate({...editTemplate, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div>
                <Label>Title Template *</Label>
                <Input
                  value={editTemplate.title_template}
                  onChange={(e) => setEditTemplate({...editTemplate, title_template: e.target.value})}
                />
              </div>

              <div>
                <Label>Description Template *</Label>
                <Textarea
                  value={editTemplate.description_template}
                  onChange={(e) => setEditTemplate({...editTemplate, description_template: e.target.value})}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTemplate}>
                Update Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};