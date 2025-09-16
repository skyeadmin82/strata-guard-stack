import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Clock, 
  User, 
  Plus, 
  CalendarIcon,
  Filter,
  Download,
  Lightbulb
} from 'lucide-react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Assessment } from '@/types/database';

interface ActionItem {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: Date;
  estimatedEffort?: number; // hours
  estimatedValue?: number; // dollars
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  findings: string[];
  recommendations: string[];
}

interface ActionItemsManagerProps {
  assessments: Assessment[];
  onActionItemUpdate?: (actionItems: ActionItem[]) => void;
}

export const ActionItemsManager: React.FC<ActionItemsManagerProps> = ({
  assessments,
  onActionItemUpdate
}) => {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    category: 'all'
  });

  const { toast } = useToast();

  useEffect(() => {
    loadActionItems();
  }, []);

  const loadActionItems = async () => {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .select(`
          *,
          assessments:assessment_id(id, clients!assessments_client_id_fkey(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: ActionItem[] = data?.map((item: any) => ({
        id: item.id,
        assessmentId: item.assessment_id,
        title: item.title,
        description: item.description,
        priority: item.priority as ActionItem['priority'],
        status: item.status as ActionItem['status'],
        assignedTo: item.assigned_to,
        dueDate: item.due_date ? new Date(item.due_date) : undefined,
        estimatedEffort: item.estimated_effort,
        estimatedValue: item.estimated_value,
        category: item.category,
        tags: item.tags || [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
        findings: item.findings || [],
        recommendations: item.recommendations || []
      })) || [];

      setActionItems(items);
    } catch (error) {
      console.error('Failed to load action items:', error);
      // Fallback to empty array for now
      setActionItems([]);
    }
  };

  const generateActionItemsFromAssessment = async (assessmentId: string) => {
    setIsGenerating(true);

    try {
      // Load assessment data
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('template_id', assessment.template_id);

      if (questionsError) throw questionsError;

      // Analyze responses and generate action items
      const generatedItems: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      responses?.forEach((response: any) => {
        const question = questions?.find((q: any) => q.id === response.question_id);
        
        if (question && response.score < (question.max_points * 0.7)) {
          // Low score indicates potential action item
          const priority = response.score < (question.max_points * 0.3) ? 'critical' :
                          response.score < (question.max_points * 0.5) ? 'high' : 'medium';

          generatedItems.push({
            assessmentId,
            title: `Improve ${question.section || 'Assessment Area'}`,
            description: `Address findings in: ${question.question_text}`,
            priority: priority as ActionItem['priority'],
            status: 'open',
            dueDate: addDays(new Date(), priority === 'critical' ? 7 : priority === 'high' ? 14 : 30),
            estimatedEffort: priority === 'critical' ? 8 : priority === 'high' ? 4 : 2,
            estimatedValue: priority === 'critical' ? 10000 : priority === 'high' ? 5000 : 2000,
            category: question.section || 'General',
            tags: [question.section?.toLowerCase() || 'general', 'improvement'],
            completedAt: undefined,
            findings: [`Low score in ${question.question_text}`],
            recommendations: [`Improve implementation of ${question.section || 'this area'}`]
          });
        }
      });

      // Add generated items to existing ones
      const newActionItems: ActionItem[] = [];
      
      for (const item of generatedItems) {
        try {
          const { data: insertedItem, error: insertError } = await supabase
            .from('action_items')
            .insert({
              tenant_id: assessment.tenant_id,
              assessment_id: assessmentId,
              title: item.title,
              description: item.description,
              priority: item.priority,
              status: item.status,
              due_date: item.dueDate?.toISOString(),
              estimated_effort: item.estimatedEffort,
              estimated_value: item.estimatedValue,
              category: item.category,
              tags: item.tags,
              findings: item.findings,
              recommendations: item.recommendations
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (insertedItem) {
            newActionItems.push({
              id: insertedItem.id,
              assessmentId: insertedItem.assessment_id,
              title: insertedItem.title,
              description: insertedItem.description,
              priority: insertedItem.priority as ActionItem['priority'],
              status: insertedItem.status as ActionItem['status'],
              assignedTo: insertedItem.assigned_to,
              dueDate: insertedItem.due_date ? new Date(insertedItem.due_date) : undefined,
              estimatedEffort: insertedItem.estimated_effort,
              estimatedValue: insertedItem.estimated_value,
              category: insertedItem.category,
              tags: insertedItem.tags || [],
              createdAt: new Date(insertedItem.created_at),
              updatedAt: new Date(insertedItem.updated_at),
              completedAt: insertedItem.completed_at ? new Date(insertedItem.completed_at) : undefined,
              findings: insertedItem.findings || [],
              recommendations: insertedItem.recommendations || []
            });
          }
        } catch (itemError) {
          console.error('Failed to insert action item:', itemError);
        }
      }

      setActionItems(prev => [...prev, ...newActionItems]);
      onActionItemUpdate?.([...actionItems, ...newActionItems]);

      toast({
        title: "Action Items Generated",
        description: `Generated ${newActionItems.length} action items from assessment findings.`,
      });

    } catch (error) {
      console.error('Failed to generate action items:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate action items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateActionItem = async (id: string, updates: Partial<ActionItem>) => {
    try {
      const { error } = await supabase
        .from('action_items')
        .update({
          title: updates.title,
          description: updates.description,
          priority: updates.priority,
          status: updates.status,
          assigned_to: updates.assignedTo,
          due_date: updates.dueDate?.toISOString(),
          estimated_effort: updates.estimatedEffort,
          estimated_value: updates.estimatedValue,
          category: updates.category,
          tags: updates.tags,
          completed_at: updates.completedAt?.toISOString(),
          findings: updates.findings,
          recommendations: updates.recommendations,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      const updatedItems = actionItems.map(item => 
        item.id === id 
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      );
      setActionItems(updatedItems);
      onActionItemUpdate?.(updatedItems);
    } catch (error) {
      console.error('Failed to update action item:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update action item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'cancelled': return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredItems = actionItems.filter(item => {
    return (filters.status === 'all' || item.status === filters.status) &&
           (filters.priority === 'all' || item.priority === filters.priority) &&
           (filters.assignee === 'all' || item.assignedTo === filters.assignee) &&
           (filters.category === 'all' || item.category === filters.category);
  });

  const stats = {
    total: actionItems.length,
    open: actionItems.filter(item => item.status === 'open').length,
    inProgress: actionItems.filter(item => item.status === 'in_progress').length,
    completed: actionItems.filter(item => item.status === 'completed').length,
    overdue: actionItems.filter(item => 
      item.dueDate && isAfter(new Date(), item.dueDate) && item.status !== 'completed'
    ).length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Action Items
            </div>
            <div className="flex gap-2">
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map(assessment => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedAssessment && generateActionItemsFromAssessment(selectedAssessment)}
                disabled={!selectedAssessment || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Items'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {[...new Set(actionItems.map(item => item.category))].map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Action Items List */}
          <div className="space-y-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox
                      checked={item.status === 'completed'}
                      onCheckedChange={(checked) => 
                        updateActionItem(item.id, { 
                          status: checked ? 'completed' : 'open',
                          completedAt: checked ? new Date() : undefined
                        })
                      }
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority.toUpperCase()}
                        </Badge>
                        {item.dueDate && isAfter(new Date(), item.dueDate) && item.status !== 'completed' && (
                          <Badge variant="destructive">OVERDUE</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          <span>{item.status.replace('_', ' ')}</span>
                        </div>
                        
                        {item.dueDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>Due {format(item.dueDate, 'MMM dd')}</span>
                          </div>
                        )}
                        
                        {item.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{item.assignedTo}</span>
                          </div>
                        )}
                        
                        {item.estimatedValue && (
                          <div className="flex items-center gap-1">
                            <span className="text-green-600">${item.estimatedValue.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No action items found</h3>
                <p className="mb-4">
                  Generate action items from assessment findings or create custom ones.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Action Item
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Action Item Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Action Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Action item title..." />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Detailed description..." rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g., Network Security" />
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Input placeholder="Email or name" />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create Action Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};