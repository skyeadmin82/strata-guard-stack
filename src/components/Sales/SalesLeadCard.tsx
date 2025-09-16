import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Building, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar, 
  Thermometer,
  User,
  ArrowRight,
  Globe
} from "lucide-react";

interface SalesLeadCardProps {
  lead: any;
  agents: any[];
  onAssign?: (leadId: string, agentId: string) => void;
  onEdit?: (lead: any) => void;
  onConvert?: (lead: any) => void;
}

export const SalesLeadCard = ({ lead, agents, onAssign, onEdit, onConvert }: SalesLeadCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'recycled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemperatureColor = (temperature: string) => {
    switch (temperature) {
      case 'hot': return 'text-red-600';
      case 'warm': return 'text-orange-600';
      case 'cold': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTemperatureIcon = (temperature: string) => {
    return <Thermometer className={`h-4 w-4 ${getTemperatureColor(temperature)}`} />;
  };

  const assignedAgent = agents.find(agent => agent.id === lead.assigned_agent_id);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                <Building className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{lead.company_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {lead.contact_name || 'No contact'} • Score: {lead.score}/100
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge className={getStatusColor(lead.status)}>
              {lead.status}
            </Badge>
            <div className="flex items-center space-x-1">
              {getTemperatureIcon(lead.temperature)}
              <span className="text-xs text-muted-foreground capitalize">
                {lead.temperature}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {lead.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center space-x-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>{lead.website}</span>
            </div>
          )}
        </div>

        {/* Business Information */}
        <div className="grid grid-cols-2 gap-4">
          {lead.industry && (
            <div>
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm font-medium">{lead.industry}</p>
            </div>
          )}
          {lead.company_size && (
            <div>
              <p className="text-xs text-muted-foreground">Company Size</p>
              <p className="text-sm font-medium">{lead.company_size}</p>
            </div>
          )}
          {lead.budget_range && (
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium">{lead.budget_range}</p>
            </div>
          )}
          {lead.decision_timeline && (
            <div>
              <p className="text-xs text-muted-foreground">Timeline</p>
              <p className="text-sm font-medium">{lead.decision_timeline}</p>
            </div>
          )}
        </div>

        {/* Estimated Value */}
        {lead.estimated_value && (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Estimated Value</span>
            </div>
            <span className="font-semibold text-green-700">
              ${lead.estimated_value.toLocaleString()}
            </span>
          </div>
        )}

        {/* Assignment */}
        {assignedAgent ? (
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
            <User className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Assigned to</p>
              <p className="text-xs text-muted-foreground">
                {assignedAgent.first_name} {assignedAgent.last_name}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">Unassigned Lead</p>
            <p className="text-xs text-yellow-600">
              This lead needs to be assigned to an agent
            </p>
          </div>
        )}

        {/* Interested Services */}
        {lead.interested_services && lead.interested_services.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Interested Services</p>
            <div className="flex flex-wrap gap-1">
              {lead.interested_services.slice(0, 3).map((service: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
              {lead.interested_services.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{lead.interested_services.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Activity Dates */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
          </div>
          {lead.last_contact_at && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3" />
              <span>Last Contact: {new Date(lead.last_contact_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(lead)}
          >
            Edit
          </Button>
          {lead.status === 'qualified' && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onConvert?.(lead)}
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Convert
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};