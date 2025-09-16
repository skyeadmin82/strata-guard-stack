import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Award,
  Settings,
  Mail,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AgentManagement() {
  const [agents, setAgents] = useState([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    agent_type: 'internal',
    tier: 'bronze',
    commission_rate: 10,
    territory: '',
    specializations: []
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('sales_agents')
      .select('*')
      .order('total_sales', { ascending: false });

    if (data) {
      setAgents(data);
    }
    setLoading(false);
  };

  const createAgent = async () => {
    const agentCode = `AG${Date.now().toString().slice(-6)}`;
    
    // Get current user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    const { error } = await supabase
      .from('sales_agents')
      .insert({
        ...formData,
        agent_code: agentCode,
        status: 'active',
        tenant_id: userData?.tenant_id
      });

    if (!error) {
      toast({ title: 'Agent created successfully' });
      setShowAddAgent(false);
      fetchAgents();
      resetForm();
    } else {
      toast({ 
        title: 'Error creating agent', 
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateAgentStatus = async (agentId: string, status: string) => {
    const { error } = await supabase
      .from('sales_agents')
      .update({ status })
      .eq('id', agentId);

    if (!error) {
      toast({ title: `Agent ${status}` });
      fetchAgents();
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      agent_type: 'internal',
      tier: 'bronze',
      commission_rate: 10,
      territory: '',
      specializations: []
    });
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = filterTier === 'all' || agent.tier === filterTier;
    
    return matchesSearch && matchesTier;
  });

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'default';
      case 'suspended': return 'secondary';
      case 'terminated': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Agent Management</h1>
          <p className="text-gray-600">Manage your sales team and commission structures</p>
        </div>
        <Button onClick={() => setShowAddAgent(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-gray-600">{agents.filter(a => a.status === 'active').length} active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(agents.reduce((sum, a) => sum + Number(a.total_sales), 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Commission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(agents.reduce((sum, a) => sum + Number(a.commission_rate), 0) / agents.length || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">Across all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {agents[0] ? `${agents[0].first_name} ${agents[0].last_name}` : 'N/A'}
            </div>
            <p className="text-xs text-gray-600">
              {agents[0] ? (agents[0].total_sales / 1000).toFixed(0) + 'K sales' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Agents</CardTitle>
          <CardDescription>Manage your sales team members</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Deals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">Loading agents...</TableCell>
                </TableRow>
              ) : filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">No agents found</TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{agent.first_name} {agent.last_name}</p>
                        <p className="text-sm text-gray-600">{agent.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{agent.agent_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.agent_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(agent.tier)}>
                        {agent.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.commission_rate}%</TableCell>
                    <TableCell className="font-medium">
                      ${(agent.total_sales / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell>{agent.deals_closed}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => updateAgentStatus(
                            agent.id, 
                            agent.status === 'active' ? 'suspended' : 'active'
                          )}
                        >
                          {agent.status === 'active' ? 
                            <Trash2 className="h-4 w-4" /> : 
                            <TrendingUp className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Agent Dialog */}
      <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Sales Agent</DialogTitle>
            <DialogDescription>
              Create a new sales agent account with commission structure
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="agent_type">Agent Type</Label>
                <Select 
                  value={formData.agent_type} 
                  onValueChange={(value) => setFormData({...formData, agent_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select 
                  value={formData.tier} 
                  onValueChange={(value) => setFormData({...formData, tier: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="territory">Territory</Label>
              <Input
                id="territory"
                value={formData.territory}
                onChange={(e) => setFormData({...formData, territory: e.target.value})}
                placeholder="e.g., Northeast, California, EMEA"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddAgent(false)}>
              Cancel
            </Button>
            <Button onClick={createAgent}>
              Create Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}