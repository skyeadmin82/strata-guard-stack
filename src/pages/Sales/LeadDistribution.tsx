import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings,
  Plus, 
  Edit,
  Trash2,
  RotateCcw,
  Trophy,
  MapPin,
  Target,
  Users,
  Scale,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LeadDistribution() {
  const [rules, setRules] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'round_robin',
    is_active: true,
    priority: 1,
    conditions: {
      lead_source: [],
      industry: [],
      company_size: [],
      territory: [],
      lead_score_min: null,
      lead_score_max: null
    },
    assignment_settings: {
      eligible_agents: [],
      weight_factors: {
        performance: 0.4,
        capacity: 0.3,
        specialization: 0.3
      },
      max_leads_per_agent: 50,
      reassign_after_days: 7
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [rulesResponse, agentsResponse] = await Promise.all([
      supabase.from('lead_distribution_rules').select('*').order('priority'),
      supabase.from('sales_agents').select('*').eq('status', 'active')
    ]);

    if (rulesResponse.data) setRules(rulesResponse.data);
    if (agentsResponse.data) setAgents(agentsResponse.data);
    
    setLoading(false);
  };

  const createRule = async () => {
    // Get current user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    const { error } = await supabase
      .from('lead_distribution_rules')
      .insert({
        ...formData,
        tenant_id: userData?.tenant_id
      });

    if (!error) {
      toast({ title: 'Distribution rule created successfully' });
      setShowCreateRule(false);
      fetchData();
      resetForm();
    } else {
      toast({ 
        title: 'Error creating rule', 
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateRule = async () => {
    const { error } = await supabase
      .from('lead_distribution_rules')
      .update(formData)
      .eq('id', editingRule.id);

    if (!error) {
      toast({ title: 'Rule updated successfully' });
      setEditingRule(null);
      fetchData();
      resetForm();
    } else {
      toast({ 
        title: 'Error updating rule', 
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('lead_distribution_rules')
      .update({ is_active: isActive })
      .eq('id', ruleId);

    if (!error) {
      toast({ title: `Rule ${isActive ? 'activated' : 'deactivated'}` });
      fetchData();
    }
  };

  const deleteRule = async (ruleId: string) => {
    const { error } = await supabase
      .from('lead_distribution_rules')
      .delete()
      .eq('id', ruleId);

    if (!error) {
      toast({ title: 'Rule deleted successfully' });
      fetchData();
    }
  };

  const testDistribution = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('lead-distribution', {
        body: { action: 'test', leadData: { test: true } }
      });

      if (error) throw error;
      
      toast({ 
        title: 'Distribution test completed',
        description: `Would assign to: ${data.assignedAgent?.first_name} ${data.assignedAgent?.last_name}`
      });
    } catch (error) {
      toast({
        title: 'Test failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_type: 'round_robin',
      is_active: true,
      priority: 1,
      conditions: {
        lead_source: [],
        industry: [],
        company_size: [],
        territory: [],
        lead_score_min: null,
        lead_score_max: null
      },
      assignment_settings: {
        eligible_agents: [],
        weight_factors: {
          performance: 0.4,
          capacity: 0.3,
          specialization: 0.3
        },
        max_leads_per_agent: 50,
        reassign_after_days: 7
      }
    });
  };

  const getRuleTypeIcon = (type: string) => {
    switch(type) {
      case 'round_robin': return <RotateCcw className="h-4 w-4" />;
      case 'top_performer': return <Trophy className="h-4 w-4" />;
      case 'territory': return <MapPin className="h-4 w-4" />;
      case 'specialization': return <Target className="h-4 w-4" />;
      case 'capacity': return <Users className="h-4 w-4" />;
      case 'weighted': return <Scale className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch(type) {
      case 'round_robin': return 'Round Robin';
      case 'top_performer': return 'Top Performer';
      case 'territory': return 'Territory Based';
      case 'specialization': return 'Specialization';
      case 'capacity': return 'Capacity Based';
      case 'weighted': return 'Weighted';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lead Distribution Rules</h1>
          <p className="text-gray-600">Configure automated lead assignment strategies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={testDistribution}>
            <Play className="mr-2 h-4 w-4" />
            Test Distribution
          </Button>
          <Button onClick={() => setShowCreateRule(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Rule Types Overview */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
        {[
          { type: 'round_robin', label: 'Round Robin', desc: 'Equal distribution' },
          { type: 'top_performer', label: 'Top Performer', desc: 'Best agents first' },
          { type: 'territory', label: 'Territory', desc: 'Geographic routing' },
          { type: 'specialization', label: 'Specialization', desc: 'Skills matching' },
          { type: 'capacity', label: 'Capacity', desc: 'Workload based' },
          { type: 'weighted', label: 'Weighted', desc: 'Multiple factors' }
        ].map((ruleType) => (
          <Card key={ruleType.type} className="text-center">
            <CardContent className="pt-4">
              <div className="flex justify-center mb-2">
                {getRuleTypeIcon(ruleType.type)}
              </div>
              <h3 className="font-medium text-sm">{ruleType.label}</h3>
              <p className="text-xs text-gray-600 mt-1">{ruleType.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Rules</CardTitle>
          <CardDescription>
            Rules are processed in order of priority. First matching rule assigns the lead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading rules...</p>
          ) : rules.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No distribution rules</h3>
              <p className="text-gray-600 mb-4">Create your first rule to start automated lead assignment</p>
              <Button onClick={() => setShowCreateRule(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Eligible Agents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono text-sm">{rule.priority}</TableCell>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRuleTypeIcon(rule.rule_type)}
                        <span>{getRuleTypeLabel(rule.rule_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.conditions?.lead_source?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Source: {rule.conditions.lead_source.join(', ')}
                          </Badge>
                        )}
                        {rule.conditions?.territory?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Territory: {rule.conditions.territory.join(', ')}
                          </Badge>
                        )}
                        {rule.conditions?.industry?.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Industry: {rule.conditions.industry.join(', ')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.assignment_settings?.eligible_agents?.length || 0} agents
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                        />
                        {rule.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingRule(rule);
                            setFormData(rule);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Rule Dialog */}
      <Dialog 
        open={showCreateRule || editingRule !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateRule(false);
            setEditingRule(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Distribution Rule' : 'Create Distribution Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure how leads should be automatically assigned to sales agents
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                    placeholder="e.g., High-value Enterprise Leads"
                  />
                </div>
                <div>
                  <Label htmlFor="rule_type">Distribution Type</Label>
                  <Select 
                    value={formData.rule_type} 
                    onValueChange={(value) => setFormData({...formData, rule_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="top_performer">Top Performer</SelectItem>
                      <SelectItem value="territory">Territory Based</SelectItem>
                      <SelectItem value="specialization">Specialization</SelectItem>
                      <SelectItem value="capacity">Capacity Based</SelectItem>
                      <SelectItem value="weighted">Weighted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Source</Label>
                  <Textarea
                    placeholder="Website, Referral, Cold Call (one per line)"
                    value={formData.conditions.lead_source?.join('\n') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        lead_source: e.target.value.split('\n').filter(Boolean)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Textarea
                    placeholder="Technology, Healthcare, Finance (one per line)"
                    value={formData.conditions.industry?.join('\n') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        industry: e.target.value.split('\n').filter(Boolean)
                      }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Territory</Label>
                  <Textarea
                    placeholder="Northeast, California, EMEA (one per line)"
                    value={formData.conditions.territory?.join('\n') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        territory: e.target.value.split('\n').filter(Boolean)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Min Lead Score</Label>
                  <Input
                    type="number"
                    value={formData.conditions.lead_score_min || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        lead_score_min: e.target.value ? parseInt(e.target.value) : null
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Max Lead Score</Label>
                  <Input
                    type="number"
                    value={formData.conditions.lead_score_max || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        lead_score_max: e.target.value ? parseInt(e.target.value) : null
                      }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assignment" className="space-y-4">
              <div>
                <Label>Eligible Agents</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center space-x-2 p-1">
                      <input
                        type="checkbox"
                        checked={formData.assignment_settings.eligible_agents?.includes(agent.id)}
                        onChange={(e) => {
                          const eligible = formData.assignment_settings.eligible_agents || [];
                          const newEligible = e.target.checked
                            ? [...eligible, agent.id]
                            : eligible.filter(id => id !== agent.id);
                          
                          setFormData({
                            ...formData,
                            assignment_settings: {
                              ...formData.assignment_settings,
                              eligible_agents: newEligible
                            }
                          });
                        }}
                      />
                      <span className="text-sm">
                        {agent.first_name} {agent.last_name} ({agent.tier})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {formData.rule_type === 'weighted' && (
                <div className="space-y-4">
                  <Label>Weight Factors</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Performance ({(formData.assignment_settings.weight_factors?.performance || 0.4) * 100}%)</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.assignment_settings.weight_factors?.performance || 0.4}
                        onChange={(e) => setFormData({
                          ...formData,
                          assignment_settings: {
                            ...formData.assignment_settings,
                            weight_factors: {
                              ...formData.assignment_settings.weight_factors,
                              performance: parseFloat(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Capacity ({(formData.assignment_settings.weight_factors?.capacity || 0.3) * 100}%)</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.assignment_settings.weight_factors?.capacity || 0.3}
                        onChange={(e) => setFormData({
                          ...formData,
                          assignment_settings: {
                            ...formData.assignment_settings,
                            weight_factors: {
                              ...formData.assignment_settings.weight_factors,
                              capacity: parseFloat(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Specialization ({(formData.assignment_settings.weight_factors?.specialization || 0.3) * 100}%)</Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.assignment_settings.weight_factors?.specialization || 0.3}
                        onChange={(e) => setFormData({
                          ...formData,
                          assignment_settings: {
                            ...formData.assignment_settings,
                            weight_factors: {
                              ...formData.assignment_settings.weight_factors,
                              specialization: parseFloat(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Leads Per Agent</Label>
                  <Input
                    type="number"
                    value={formData.assignment_settings.max_leads_per_agent}
                    onChange={(e) => setFormData({
                      ...formData,
                      assignment_settings: {
                        ...formData.assignment_settings,
                        max_leads_per_agent: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>Reassign After (Days)</Label>
                  <Input
                    type="number"
                    value={formData.assignment_settings.reassign_after_days}
                    onChange={(e) => setFormData({
                      ...formData,
                      assignment_settings: {
                        ...formData.assignment_settings,
                        reassign_after_days: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateRule(false);
                setEditingRule(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingRule ? updateRule : createRule}>
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}