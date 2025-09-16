import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Clock,
  AlertTriangle,
  Target,
  TrendingUp
} from 'lucide-react';

interface SLARule {
  id: string;
  name: string;
  priority: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_rules: any;
  is_active: boolean;
  created_at: string;
}

export const SLAManager: React.FC = () => {
  const { toast } = useToast();
  const [slaRules, setSlaRules] = useState<SLARule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SLARule | null>(null);

  const [newRule, setNewRule] = useState({
    name: '',
    priority: 'medium',
    response_time_hours: 4,
    resolution_time_hours: 24,
    escalation_rules: []
  });

  const [editRule, setEditRule] = useState({
    name: '',
    priority: 'medium',
    response_time_hours: 4,
    resolution_time_hours: 24,
    escalation_rules: []
  });

  // Fetch SLA rules
  const fetchSLARules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sla_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSlaRules(data || []);
    } catch (error) {
      console.error('Error fetching SLA rules:', error);
      toast({
        title: "Error",
        description: "Failed to load SLA rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSLARules();
  }, []);

  // Add SLA rule
  const handleAddRule = async () => {
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
        .from('sla_rules')
        .insert({
          ...newRule,
          tenant_id: userData.tenant_id,
          created_by: userData.id,
          escalation_rules: []
        })
        .select()
        .single();

      if (error) throw error;

      setSlaRules([data, ...slaRules]);
      setIsAddDialogOpen(false);
      setNewRule({
        name: '',
        priority: 'medium',
        response_time_hours: 4,
        resolution_time_hours: 24,
        escalation_rules: []
      });

      toast({
        title: "Success",
        description: "SLA rule created successfully",
      });
    } catch (error) {
      console.error('Error adding SLA rule:', error);
      toast({
        title: "Error",
        description: "Failed to create SLA rule",
        variant: "destructive",
      });
    }
  };

  // Update SLA rule
  const handleUpdateRule = async () => {
    if (!editingRule) return;

    try {
      const { data, error } = await supabase
        .from('sla_rules')
        .update(editRule)
        .eq('id', editingRule.id)
        .select()
        .single();

      if (error) throw error;

      setSlaRules(slaRules.map(r => r.id === editingRule.id ? data : r));
      setEditingRule(null);

      toast({
        title: "Success",
        description: "SLA rule updated successfully",
      });
    } catch (error) {
      console.error('Error updating SLA rule:', error);
      toast({
        title: "Error",
        description: "Failed to update SLA rule",
        variant: "destructive",
      });
    }
  };

  // Delete SLA rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this SLA rule?')) return;

    try {
      const { error } = await supabase
        .from('sla_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setSlaRules(slaRules.filter(r => r.id !== ruleId));
      toast({
        title: "Success",
        description: "SLA rule deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting SLA rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete SLA rule",
        variant: "destructive",
      });
    }
  };

  // Toggle rule active status
  const handleToggleActive = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sla_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      setSlaRules(slaRules.map(r => 
        r.id === ruleId ? { ...r, is_active: !isActive } : r
      ));

      toast({
        title: "Success",
        description: `SLA rule ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling SLA rule:', error);
      toast({
        title: "Error",
        description: "Failed to update SLA rule",
        variant: "destructive",
      });
    }
  };

  // Start editing
  const startEdit = (rule: SLARule) => {
    setEditRule({
      name: rule.name,
      priority: rule.priority,
      response_time_hours: rule.response_time_hours,
      resolution_time_hours: rule.resolution_time_hours,
      escalation_rules: rule.escalation_rules || []
    });
    setEditingRule(rule);
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
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
          <h2 className="text-2xl font-bold">SLA Management</h2>
          <p className="text-muted-foreground">Define response and resolution time targets by priority</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New SLA Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create SLA Rule</DialogTitle>
              <DialogDescription>
                Define response and resolution time targets
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Rule Name *</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  placeholder="e.g., Critical Issues"
                />
              </div>

              <div>
                <Label>Priority Level *</Label>
                <Select value={newRule.priority} onValueChange={(value) => setNewRule({...newRule, priority: value})}>
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
                <Label>Response Time (Hours) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={newRule.response_time_hours}
                  onChange={(e) => setNewRule({...newRule, response_time_hours: parseInt(e.target.value) || 1})}
                />
              </div>

              <div>
                <Label>Resolution Time (Hours) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={newRule.resolution_time_hours}
                  onChange={(e) => setNewRule({...newRule, resolution_time_hours: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRule} disabled={!newRule.name}>
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* SLA Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slaRules.map((rule) => (
          <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={getPriorityBadgeVariant(rule.priority)}>
                    {rule.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(rule)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Response:</span>
                  </div>
                  <Badge variant="outline">
                    {rule.response_time_hours}h
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Resolution:</span>
                  </div>
                  <Badge variant="outline">
                    {rule.resolution_time_hours}h
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant={rule.is_active ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleToggleActive(rule.id, rule.is_active)}
                  className="w-full"
                >
                  {rule.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {slaRules.length === 0 && (
          <div className="col-span-full text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No SLA rules configured</h3>
            <p className="text-muted-foreground mb-4">Create SLA rules to ensure timely ticket resolution</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Rule
            </Button>
          </div>
        )}
      </div>

      {/* Edit Rule Dialog */}
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit SLA Rule</DialogTitle>
              <DialogDescription>
                Update response and resolution time targets
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Rule Name *</Label>
                <Input
                  value={editRule.name}
                  onChange={(e) => setEditRule({...editRule, name: e.target.value})}
                />
              </div>

              <div>
                <Label>Priority Level *</Label>
                <Select value={editRule.priority} onValueChange={(value) => setEditRule({...editRule, priority: value})}>
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
                <Label>Response Time (Hours) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={editRule.response_time_hours}
                  onChange={(e) => setEditRule({...editRule, response_time_hours: parseInt(e.target.value) || 1})}
                />
              </div>

              <div>
                <Label>Resolution Time (Hours) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={editRule.resolution_time_hours}
                  onChange={(e) => setEditRule({...editRule, resolution_time_hours: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRule}>
                Update Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};