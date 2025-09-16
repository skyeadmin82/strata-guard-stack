import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Building2,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress' | 'pending_client' | 'resolved' | 'closed';
  category?: string;
  ticket_number: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  contact_id?: string;
  clients?: { name: string };
  contacts?: { first_name: string; last_name: string };
}

export const TicketsTable: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as Ticket['priority'],
    category: 'other',
    client_id: ''
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          clients:client_id(name),
          contacts:contact_id(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleAddTicket = async () => {
    try {
      const ticketNumber = `TK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, '0')}`;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ...newTicket,
          ticket_number: ticketNumber,
          tenant_id: profile?.tenant_id,
          status: 'submitted' as any,
          created_by: profile?.id
        })
        .select(`
          *,
          clients:client_id(name),
          contacts:contact_id(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      setTickets([data, ...tickets]);
      setIsAddDialogOpen(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'other',
        client_id: ''
      });
      
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
    } catch (error) {
      console.error('Error adding ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, resolved_at: updateData.resolved_at || ticket.resolved_at }
          : ticket
      ));

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchClients();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadgeVariant = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'critical':
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: Ticket['status']) => {
    switch (status) {
      case 'resolved':
      case 'closed': return 'default';
      case 'in_progress': return 'secondary';
      case 'submitted':
      case 'in_review': return 'outline';
      case 'pending_client': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
    <div className="space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending_client">Pending Client</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Create a new support ticket for client assistance.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">Client</Label>
                <Select value={newTicket.client_id} onValueChange={(value) => setNewTicket({ ...newTicket, client_id: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input
                  id="title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="col-span-3"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Detailed description of the issue..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(value: Ticket['priority']) => setNewTicket({ ...newTicket, priority: value })}>
                  <SelectTrigger className="col-span-3">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTicket} disabled={!newTicket.title || !newTicket.client_id}>
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow 
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    // Primary action: View ticket details
                    console.log('View ticket details:', ticket.id);
                  }}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{ticket.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{ticket.clients?.name || 'Unknown'}</div>
                        {ticket.contacts && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.contacts.first_name} {ticket.contacts.last_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="flex items-center gap-1 w-fit">
                      {getPriorityIcon(ticket.priority)}
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Ticket
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        {['submitted', 'in_progress', 'pending_client', 'resolved', 'closed'].map((status) => (
                          <DropdownMenuItem 
                            key={status}
                            onClick={() => handleUpdateStatus(ticket.id, status as Ticket['status'])}
                            disabled={ticket.status === status}
                          >
                            {status.replace('_', ' ')}
                          </DropdownMenuItem>
                        ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No tickets match your filters'
                : 'No tickets found'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};