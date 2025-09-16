import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  User,
  Building2,
  Calendar,
  FileText,
  Edit3,
  Save,
  X,
  Phone,
  Mail
} from 'lucide-react';
import { TimeTrackingManager } from './TimeTrackingManager';

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

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (ticket: Ticket) => void;
}

export const TicketDetailDialog: React.FC<TicketDetailDialogProps> = ({
  ticket,
  open,
  onOpenChange,
  onUpdate
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [actualHours, setActualHours] = useState(0);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Ticket['priority'],
    status: 'submitted' as Ticket['status'],
    category: '',
    client_id: '',
    contact_id: ''
  });

  // Fetch clients for editing
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

  // Fetch contacts for selected client
  const fetchContacts = async (clientId: string) => {
    if (!clientId) {
      setContacts([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  // Initialize form when ticket changes
  useEffect(() => {
    if (ticket) {
      setEditForm({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category || '',
        client_id: ticket.client_id,
        contact_id: ticket.contact_id || "none"
      });
      fetchClients();
      if (ticket.client_id) {
        fetchContacts(ticket.client_id);
      }
    }
  }, [ticket]);

  // Handle client change
  const handleClientChange = (clientId: string) => {
    setEditForm(prev => ({ ...prev, client_id: clientId, contact_id: "none" }));
    fetchContacts(clientId);
  };

  // Handle save
  const handleSave = async () => {
    if (!ticket) return;
    
    try {
      setLoading(true);
      
      const updateData: any = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        status: editForm.status,
        category: editForm.category || null,
        client_id: editForm.client_id,
        contact_id: editForm.contact_id === "none" ? null : editForm.contact_id,
        updated_at: new Date().toISOString()
      };

      // Add resolved_at if status is resolved/closed
      if ((editForm.status === 'resolved' || editForm.status === 'closed') && 
          ticket.status !== 'resolved' && ticket.status !== 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticket.id)
        .select(`
          *,
          clients!support_tickets_client_id_fkey(name)
        `)
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });

      setIsEditing(false);
      if (onUpdate && data) {
        onUpdate(data);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {ticket.ticket_number}
              </DialogTitle>
              <DialogDescription>
                Ticket Details - Created {new Date(ticket.created_at).toLocaleDateString()}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-2">
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label>Status:</Label>
              {isEditing ? (
                <Select value={editForm.status} onValueChange={(value: Ticket['status']) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_client">Pending Client</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getStatusBadgeVariant(ticket.status)}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Priority:</Label>
              {isEditing ? (
                <Select value={editForm.priority} onValueChange={(value: Ticket['priority']) => setEditForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="flex items-center gap-1">
                  {getPriorityIcon(ticket.priority)}
                  {ticket.priority}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              {isEditing ? (
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              ) : (
                <h3 className="text-lg font-semibold mt-1">{ticket.title}</h3>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Client and Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <div>
                    <Label>Client *</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      Current: {ticket.clients?.name || 'Unknown Client'}
                    </div>
                    <Select value={editForm.client_id} onValueChange={handleClientChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{client.name}</span>
                              {client.id === ticket.client_id && (
                                <span className="text-xs text-muted-foreground ml-2">(Current)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground mt-1">
                      ⚠️ Changing the client will reset the contact selection
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Company</Label>
                        <p className="font-medium">{ticket.clients?.name || 'Unknown Client'}</p>
                      </div>
                      {ticket.clients?.name && (
                        <div className="text-xs text-muted-foreground">
                          Client ID: {ticket.client_id}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <div>
                    <Label>Contact</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      {ticket.contacts 
                        ? `Current: ${ticket.contacts.first_name} ${ticket.contacts.last_name}`
                        : 'No contact currently assigned'
                      }
                    </div>
                    <Select value={editForm.contact_id || "none"} onValueChange={(value) => setEditForm(prev => ({ ...prev, contact_id: value === "none" ? "" : value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No contact selected</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{contact.first_name} {contact.last_name}</span>
                              {contact.id === ticket.contact_id && (
                                <span className="text-xs text-muted-foreground ml-2">(Current)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {contacts.length === 0 && editForm.client_id && (
                      <div className="text-xs text-muted-foreground mt-1">
                        No contacts available for selected client
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {ticket.contacts ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Primary Contact</Label>
                          <p className="font-medium">
                            {ticket.contacts.first_name} {ticket.contacts.last_name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs text-muted-foreground">Contact</Label>
                        <p className="text-sm text-muted-foreground">No contact assigned</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="font-medium">
                    {new Date(ticket.created_at).toLocaleDateString()} at{' '}
                    {new Date(ticket.created_at).toLocaleTimeString()}
                  </p>
                </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="font-medium">
                      {new Date(ticket.updated_at).toLocaleDateString()} at{' '}
                      {new Date(ticket.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Time Tracked</Label>
                    <p className="font-medium">{actualHours.toFixed(2)} hours</p>
                  </div>
                {ticket.resolved_at && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Resolved</Label>
                    <p className="font-medium">
                      {new Date(ticket.resolved_at).toLocaleDateString()} at{' '}
                      {new Date(ticket.resolved_at).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking Section */}
          <TimeTrackingManager 
            ticketId={ticket.id} 
            onTimeUpdate={(totalHours) => setActualHours(totalHours)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};