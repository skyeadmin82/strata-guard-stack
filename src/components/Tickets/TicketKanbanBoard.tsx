import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Building2, 
  MoreHorizontal,
  Calendar,
  Tag,
  MessageSquare
} from 'lucide-react';

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
type TicketStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress' | 'pending_client' | 'resolved' | 'closed';

interface KanbanTicket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  ticket_number: string;
  sla_due_date?: string;
  client_satisfaction_rating?: number;
  tags?: string[];
  created_at: string;
  clients?: { name: string };
  contacts?: { first_name: string; last_name: string };
  assigned_user?: { first_name: string; last_name: string };
}

interface TicketKanbanBoardProps {
  tickets: KanbanTicket[];
  onUpdateTicket: (ticketId: string, updates: Partial<KanbanTicket>) => Promise<any>;
  onViewTicket: (ticket: KanbanTicket) => void;
  getSLAStatus: (ticket: KanbanTicket) => 'none' | 'on_track' | 'due_soon' | 'overdue';
  loading?: boolean;
}

const statusColumns: { key: TicketStatus; label: string; color: string }[] = [
  { key: 'submitted', label: 'New', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { key: 'in_review', label: 'In Review', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-orange-100 dark:bg-orange-900/20' },
  { key: 'pending_client', label: 'Pending Client', color: 'bg-purple-100 dark:bg-purple-900/20' },
  { key: 'resolved', label: 'Resolved', color: 'bg-green-100 dark:bg-green-900/20' },
];

export const TicketKanbanBoard: React.FC<TicketKanbanBoardProps> = ({
  tickets,
  onUpdateTicket,
  onViewTicket,
  getSLAStatus,
  loading = false
}) => {
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null);

  const getPriorityIcon = (priority: TicketPriority) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSLABadgeVariant = (slaStatus: string) => {
    switch (slaStatus) {
      case 'overdue': return 'destructive';
      case 'due_soon': return 'secondary';
      case 'on_track': return 'outline';
      default: return 'outline';
    }
  };

  const getSLABadgeText = (slaStatus: string) => {
    switch (slaStatus) {
      case 'overdue': return 'Overdue';
      case 'due_soon': return 'Due Soon';
      case 'on_track': return 'On Track';
      default: return '';
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 0) return `${Math.abs(diffHours)}h overdue`;
    if (diffHours < 24) return `${diffHours}h left`;
    if (diffHours < 72) return `${Math.ceil(diffHours / 24)}d left`;
    return date.toLocaleDateString();
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicket(ticketId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TicketStatus) => {
    e.preventDefault();
    
    if (draggedTicket) {
      const ticket = tickets.find(t => t.id === draggedTicket);
      if (ticket && ticket.status !== newStatus) {
        await onUpdateTicket(draggedTicket, { status: newStatus });
      }
    }
    
    setDraggedTicket(null);
  };

  const getTicketsForStatus = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  if (loading) {
    return (
      <div className="flex gap-6 h-96">
        {statusColumns.map((column) => (
          <Card key={column.key} className="flex-1">
            <CardHeader className="pb-3">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[800px] overflow-x-auto">
      {statusColumns.map((column) => {
        const columnTickets = getTicketsForStatus(column.key);
        
        return (
          <Card 
            key={column.key} 
            className="flex-1 min-w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <CardHeader className={`pb-3 ${column.color}`}>
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{column.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {columnTickets.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-3">
              <ScrollArea className="h-[700px]">
                <div className="space-y-3">
                  {columnTickets.map((ticket) => {
                    const slaStatus = getSLAStatus(ticket);
                    
                    return (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onClick={() => onViewTicket(ticket)}
                      >
                        <CardContent className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getPriorityIcon(ticket.priority)}
                              <span className="text-xs font-mono text-muted-foreground">
                                {ticket.ticket_number}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {slaStatus !== 'none' && (
                                <Badge 
                                  variant={getSLABadgeVariant(slaStatus)}
                                  className="text-xs"
                                >
                                  {getSLABadgeText(slaStatus)}
                                </Badge>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => onViewTicket(ticket)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                                  {statusColumns.map((status) => (
                                    <DropdownMenuItem
                                      key={status.key}
                                      onClick={() => onUpdateTicket(ticket.id, { status: status.key })}
                                      disabled={ticket.status === status.key}
                                    >
                                      {status.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="font-medium text-sm mb-2 line-clamp-2">
                            {ticket.title}
                          </h4>

                          {/* Client */}
                          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{ticket.clients?.name || 'Unknown Client'}</span>
                          </div>

                          {/* Tags */}
                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {ticket.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {ticket.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  +{ticket.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {ticket.assigned_user ? (
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {ticket.assigned_user.first_name[0]}{ticket.assigned_user.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {ticket.sla_due_date && slaStatus !== 'none' && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDueDate(ticket.sla_due_date)}</span>
                              </div>
                            )}
                          </div>

                          {/* Satisfaction Rating */}
                          {ticket.client_satisfaction_rating && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Rating: {ticket.client_satisfaction_rating}/5
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {columnTickets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No tickets in {column.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};