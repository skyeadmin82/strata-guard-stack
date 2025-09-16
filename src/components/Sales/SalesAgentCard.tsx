import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  Target, 
  TrendingUp,
  MapPin,
  Settings
} from "lucide-react";

interface SalesAgentCardProps {
  agent: any;
  onEdit?: (agent: any) => void;
  onViewDetails?: (agent: any) => void;
}

export const SalesAgentCard = ({ agent, onEdit, onViewDetails }: SalesAgentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {agent.first_name?.[0]}{agent.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {agent.first_name} {agent.last_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {agent.agent_code} • {agent.agent_type}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <Badge className={getStatusColor(agent.status)}>
              {agent.status}
            </Badge>
            <Badge className={getTierColor(agent.tier)}>
              {agent.tier}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{agent.email}</span>
          </div>
          {agent.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{agent.phone}</span>
            </div>
          )}
          {agent.territory && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{agent.territory}</span>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <DollarSign className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="font-semibold">
              ${(agent.total_sales || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <Target className="h-4 w-4 mx-auto text-blue-600 mb-1" />
            <p className="text-xs text-muted-foreground">Deals Closed</p>
            <p className="font-semibold">{agent.deals_closed || 0}</p>
          </div>
          <div className="text-center">
            <DollarSign className="h-4 w-4 mx-auto text-purple-600 mb-1" />
            <p className="text-xs text-muted-foreground">Commission</p>
            <p className="font-semibold">
              ${(agent.total_commission_earned || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-orange-600 mb-1" />
            <p className="text-xs text-muted-foreground">Conversion</p>
            <p className="font-semibold">{(agent.conversion_rate || 0).toFixed(1)}%</p>
          </div>
        </div>

        {/* Specializations */}
        {agent.specializations && agent.specializations.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Specializations</p>
            <div className="flex flex-wrap gap-1">
              {agent.specializations.slice(0, 3).map((spec: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {agent.specializations.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{agent.specializations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails?.(agent)}
          >
            <User className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit?.(agent)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};