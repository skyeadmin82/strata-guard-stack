import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Building2,
  TrendingUp,
  ChevronRight,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const PIPELINE_STAGES = [
  { 
    key: 'qualification', 
    label: 'Qualification', 
    color: 'bg-blue-100 text-blue-800',
    icon: Target,
    description: 'Initial lead assessment'
  },
  { 
    key: 'needs_analysis', 
    label: 'Needs Analysis', 
    color: 'bg-purple-100 text-purple-800',
    icon: Search,
    description: 'Understanding requirements'
  },
  { 
    key: 'proposal', 
    label: 'Proposal', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Edit,
    description: 'Solution presentation'
  },
  { 
    key: 'negotiation', 
    label: 'Negotiation', 
    color: 'bg-orange-100 text-orange-800',
    icon: RefreshCw,
    description: 'Terms discussion'
  },
  { 
    key: 'closed_won', 
    label: 'Closed Won', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Deal closed successfully'
  },
  { 
    key: 'closed_lost', 
    label: 'Closed Lost', 
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Deal not successful'
  }
];

export default function SalesPipeline() {
  const [deals, setDeals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showEditDeal, setShowEditDeal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [editFormData, setEditFormData] = useState({
    deal_name: '',
    stage: 'qualification',
    deal_value: 0,
    probability: 50,
    expected_close_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [dealsResponse, agentsResponse] = await Promise.all([
      supabase
        .from('sales_deals')
        .select(`
          *,
          sales_agents(first_name, last_name, tier),
          sales_leads(company_name, contact_name),
          clients(name)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('sales_agents')
        .select('*')
        .eq('status', 'active')
    ]);

    if (dealsResponse.data) setDeals(dealsResponse.data);
    if (agentsResponse.data) setAgents(agentsResponse.data);
    
    setLoading(false);
  };

  const updateDealStage = async (dealId: string, newStage: string) => {
    const updates: any = { 
      stage: newStage,
      updated_at: new Date().toISOString()
    };

    // Auto-set close date for closed deals
    if (newStage === 'closed_won' || newStage === 'closed_lost') {
      updates.actual_close_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('sales_deals')
      .update(updates)
      .eq('id', dealId);

    if (!error) {
      toast({ 
        title: 'Deal updated', 
        description: `Moved to ${PIPELINE_STAGES.find(s => s.key === newStage)?.label}` 
      });
      fetchData();
    } else {
      toast({ 
        title: 'Error updating deal', 
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateDeal = async () => {
    const { error } = await supabase
      .from('sales_deals')
      .update({
        ...editFormData,
        deal_value: parseFloat(editFormData.deal_value.toString()),
        probability: parseInt(editFormData.probability.toString())
      })
      .eq('id', selectedDeal.id);

    if (!error) {
      toast({ title: 'Deal updated successfully' });
      setShowEditDeal(false);
      setSelectedDeal(null);
      fetchData();
    } else {
      toast({ 
        title: 'Error updating deal', 
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteDeal = async (dealId: string) => {
    const { error } = await supabase
      .from('sales_deals')
      .delete()
      .eq('id', dealId);

    if (!error) {
      toast({ title: 'Deal deleted successfully' });
      fetchData();
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.deal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.sales_leads?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgent = filterAgent === 'all' || deal.agent_id === filterAgent;
    const matchesStage = filterStage === 'all' || deal.stage === filterStage;
    
    return matchesSearch && matchesAgent && matchesStage;
  });

  const getPipelineMetrics = () => {
    const metrics = PIPELINE_STAGES.reduce((acc, stage) => {
      const stageDeals = filteredDeals.filter(deal => deal.stage === stage.key);
      const stageValue = stageDeals.reduce((sum, deal) => sum + (Number(deal.deal_value) || 0), 0);
      const weightedValue = stageDeals.reduce((sum, deal) => 
        sum + ((Number(deal.deal_value) || 0) * (Number(deal.probability) || 0) / 100), 0
      );
      
      acc[stage.key] = {
        count: stageDeals.length,
        value: stageValue,
        weightedValue: weightedValue,
        deals: stageDeals
      };
      return acc;
    }, {} as any);

    return metrics;
  };

  const getDealProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const pipelineMetrics = getPipelineMetrics();
  const totalPipelineValue = Object.values(pipelineMetrics).reduce((sum: number, stage: any) => sum + (Number(stage.value) || 0), 0);
  const totalWeightedValue = Object.values(pipelineMetrics).reduce((sum: number, stage: any) => sum + (Number(stage.weightedValue) || 0), 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-gray-600">Track deals through your sales process</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/sales/deals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
          <Button onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(totalPipelineValue) || 0)}</div>
            <p className="text-xs text-gray-600">{filteredDeals.length} deals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weighted Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(totalWeightedValue) || 0)}</div>
            <p className="text-xs text-gray-600">Probability adjusted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.length > 0 ? 
                ((pipelineMetrics.closed_won?.count || 0) / 
                 ((pipelineMetrics.closed_won?.count || 0) + (pipelineMetrics.closed_lost?.count || 0)) * 100 || 0).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-gray-600">Won vs Lost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredDeals.length > 0 ? formatCurrency((Number(totalPipelineValue) || 0) / filteredDeals.length) : '$0'}
            </div>
            <p className="text-xs text-gray-600">Per opportunity</p>
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
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {PIPELINE_STAGES.map(stage => (
                  <SelectItem key={stage.key} value={stage.key}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map((stage, index) => {
          const stageData = pipelineMetrics[stage.key] || { count: 0, value: 0, deals: [] };
          const StageIcon = stage.icon;
          
          return (
            <div key={stage.key} className="space-y-4">
              {/* Stage Header */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StageIcon className="h-4 w-4" />
                      <span className="font-medium text-sm">{stage.label}</span>
                    </div>
                    {index < PIPELINE_STAGES.length - 2 && (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Count</span>
                      <span className="text-sm font-medium">{stageData.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Value</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(stageData.value)}
                      </span>
                    </div>
                    {stage.key !== 'closed_won' && stage.key !== 'closed_lost' && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Weighted</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(stageData.weightedValue)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stage Deals */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stageData.deals.map((deal: any) => (
                  <Card 
                    key={deal.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedDeal(deal);
                      setEditFormData({
                        deal_name: deal.deal_name || '',
                        stage: deal.stage || 'qualification',
                        deal_value: Number(deal.deal_value) || 0,
                        probability: Number(deal.probability) || 50,
                        expected_close_date: deal.expected_close_date || '',
                        notes: ''
                      });
                      setShowEditDeal(true);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">
                            {deal.deal_name || 'Untitled Deal'}
                          </h4>
                          <Badge className={`text-xs ${getDealProbabilityColor(deal.probability || 0)}`}>
                            {deal.probability || 0}%
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">
                              {deal.sales_leads?.company_name || deal.clients?.name || 'Unknown Company'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">
                              {formatCurrency(Number(deal.deal_value) || 0)}
                            </span>
                          </div>
                          
                          {deal.expected_close_date && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(deal.expected_close_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {deal.sales_agents && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              {deal.sales_agents.first_name} {deal.sales_agents.last_name}
                            </span>
                            <Badge variant="outline" className="text-xs ml-1">
                              {deal.sales_agents.tier}
                            </Badge>
                          </div>
                        )}

                        {/* Stage Movement Buttons */}
                        <div className="flex gap-1 pt-2 border-t">
                          {stage.key !== 'qualification' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                const prevStageIndex = PIPELINE_STAGES.findIndex(s => s.key === stage.key) - 1;
                                if (prevStageIndex >= 0) {
                                  updateDealStage(deal.id, PIPELINE_STAGES[prevStageIndex].key);
                                }
                              }}
                            >
                              ← Back
                            </Button>
                          )}
                          
                          {stage.key !== 'closed_won' && stage.key !== 'closed_lost' && (
                            <Button
                              size="sm"
                              className="text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextStageIndex = PIPELINE_STAGES.findIndex(s => s.key === stage.key) + 1;
                                if (nextStageIndex < PIPELINE_STAGES.length - 1) {
                                  updateDealStage(deal.id, PIPELINE_STAGES[nextStageIndex].key);
                                }
                              }}
                            >
                              Next →
                            </Button>
                          )}

                          {stage.key === 'negotiation' && (
                            <>
                              <Button
                                size="sm"
                                className="text-xs flex-1 bg-green-600 hover:bg-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateDealStage(deal.id, 'closed_won');
                                }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Win
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateDealStage(deal.id, 'closed_lost');
                                }}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Lose
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stageData.count === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-gray-500">
                      <StageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No deals in {stage.label}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Deal Dialog */}
      <Dialog open={showEditDeal} onOpenChange={setShowEditDeal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>
              Update deal information and move through pipeline stages
            </DialogDescription>
          </DialogHeader>
          
          {selectedDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deal_name">Deal Name</Label>
                  <Input
                    id="deal_name"
                    value={editFormData.deal_name}
                    onChange={(e) => setEditFormData({...editFormData, deal_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select 
                    value={editFormData.stage} 
                    onValueChange={(value) => setEditFormData({...editFormData, stage: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map(stage => (
                        <SelectItem key={stage.key} value={stage.key}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="deal_value">Deal Value</Label>
                  <Input
                    id="deal_value"
                    type="number"
                    value={editFormData.deal_value}
                    onChange={(e) => setEditFormData({...editFormData, deal_value: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={editFormData.probability}
                    onChange={(e) => setEditFormData({...editFormData, probability: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="expected_close_date">Expected Close</Label>
                  <Input
                    id="expected_close_date"
                    type="date"
                    value={editFormData.expected_close_date}
                    onChange={(e) => setEditFormData({...editFormData, expected_close_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add deal notes..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this deal?')) {
                      deleteDeal(selectedDeal.id);
                      setShowEditDeal(false);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Deal
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEditDeal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateDeal}>
                    Update Deal
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}