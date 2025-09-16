import React, { useState } from 'react';
import { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Globe,
  RefreshCw,
  AlertTriangle,
  Building2,
  Download,
  CheckSquare,
  Square,
  BarChart3,
  Activity,
  Users,
  FileText
} from 'lucide-react';
import { ClientHealthBadge } from './ClientHealthBadge';
import { ClientStatsCard } from './ClientStatsCard';
import { ClientActivityTimeline } from './ClientActivityTimeline';
import { ClientSummaryStats } from './ClientSummaryStats';
import { useEnhancedClientManagement } from '@/hooks/useEnhancedClientManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedClientsTableProps {
  onCreateClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => Promise<boolean>;
}

export const EnhancedClientsTable: React.FC<EnhancedClientsTableProps> = ({
  onCreateClient,
  onEditClient,
  onDeleteClient,
}) => {
  const {
    clients,
    clientStats,
    selectedClients,
    loading,
    bulkActionLoading,
    filters,
    setFilters,
    fetchClientsWithStats,
    calculateClientHealthScore,
    executeBulkAction,
    exportClients,
    toggleClientSelection,
    selectAllClients,
    clearSelection,
  } = useEnhancedClientManagement();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<string | null>(null);
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [bulkActionParams, setBulkActionParams] = useState<any>({});

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDelete = async (client: Client) => {
    setDeletingId(client.id);
    try {
      await onDeleteClient(client.id);
      await fetchClientsWithStats();
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkActionType) return;

    const success = await executeBulkAction({
      action: bulkActionType as any,
      params: bulkActionParams
    });

    if (success) {
      setBulkActionType('');
      setBulkActionParams({});
    }
  };

  const handleSelectAll = () => {
    if (selectedClients.size === clients.length) {
      clearSelection();
    } else {
      selectAllClients(clients.map(c => c.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUniqueIndustries = () => {
    const industries = [...new Set(clients.map(client => client.industry).filter(Boolean))];
    return industries.sort();
  };

  const getRiskLevels = () => ['low', 'medium', 'high'];

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">No clients found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get started by creating your first client.
      </p>
      <Button onClick={onCreateClient} className="mt-4">
        <Plus className="h-4 w-4 mr-2" />
        Add Client
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Enhanced Client Management
                {selectedClients.size > 0 && (
                  <Badge variant="secondary">
                    {selectedClients.size} selected
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchClientsWithStats} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportClients()}>
                <Download className="h-4 w-4 mr-1" />
                Export All
              </Button>
              <Button onClick={onCreateClient}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.industry} onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {getUniqueIndustries().map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                {getRiskLevels().map(level => (
                  <SelectItem key={level} value={level}>
                    <span className="capitalize">{level} Risk</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.healthScore} onValueChange={(value) => setFilters(prev => ({ ...prev, healthScore: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Health Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health Scores</SelectItem>
                <SelectItem value="excellent">Excellent (80-100)</SelectItem>
                <SelectItem value="good">Good (60-79)</SelectItem>
                <SelectItem value="poor">Poor (0-59)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedClients.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm font-medium">
                {selectedClients.size} client(s) selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Select value={bulkActionType} onValueChange={setBulkActionType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update_status">Update Status</SelectItem>
                    <SelectItem value="update_industry">Update Industry</SelectItem>
                    <SelectItem value="calculate_health">Calculate Health</SelectItem>
                    <SelectItem value="export">Export Selected</SelectItem>
                  </SelectContent>
                </Select>

                {bulkActionType === 'update_status' && (
                  <Select value={bulkActionParams.status} onValueChange={(value) => setBulkActionParams({ status: value })}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {bulkActionType === 'update_industry' && (
                  <Select value={bulkActionParams.industry} onValueChange={(value) => setBulkActionParams({ industry: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueIndustries().map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button 
                  onClick={handleBulkAction}
                  disabled={bulkActionLoading || !bulkActionType}
                  size="sm"
                >
                  {bulkActionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingSkeleton />
          ) : clients.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedClients.size === clients.length && clients.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => {
                      const stats = clientStats.get(client.id);
                      return (
                        <TableRow 
                          key={client.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedClients.has(client.id)}
                              onCheckedChange={() => toggleClientSelection(client.id)}
                            />
                          </TableCell>
                          
                           <TableCell>
                             <div>
                               <div className="font-medium">{client.name}</div>
                               {client.website && (
                                 <div className="flex items-center text-sm text-muted-foreground mt-1">
                                   <Globe className="h-3 w-3 mr-1" />
                                   <a 
                                     href={client.website.startsWith('http') ? client.website : `https://${client.website}`} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="hover:underline"
                                     onClick={(e) => e.stopPropagation()}
                                     aria-label={`Visit ${client.name} website`}
                                   >
                                     {client.website.replace(/^https?:\/\//, '')}
                                   </a>
                                 </div>
                               )}
                             </div>
                           </TableCell>

                          <TableCell>
                            {stats ? (
                              <ClientHealthBadge 
                                healthScore={stats.health_score} 
                                riskLevel={stats.risk_level}
                                size="sm"
                              />
                            ) : (
                              <Badge variant="outline">No Data</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              {client.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <a 
                                    href={`mailto:${client.email}`} 
                                    className="hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {client.email}
                                  </a>
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <a 
                                    href={`tel:${client.phone}`} 
                                    className="hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {client.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                {client.industry || <span className="text-muted-foreground">-</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {client.company_size || 'Unknown size'}
                              </div>
                              {stats && (
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {stats.active_contracts}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {stats.contact_count}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge 
                              variant={client.status === 'active' ? 'default' : client.status === 'inactive' ? 'secondary' : 'outline'}
                              className="capitalize"
                            >
                              {client.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              {stats?.last_activity_at ? (
                                <>
                                  <div>{formatDate(stats.last_activity_at)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {stats.recent_activities} activities
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted-foreground">No activity</span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    disabled={deletingId === client.id}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => onEditClient(client)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSelectedClientForDetails(client.id)}>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => calculateClientHealthScore(client.id)}>
                                    <Activity className="h-4 w-4 mr-2" />
                                    Calculate Health
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(client)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Stats */}
              <ClientSummaryStats 
                clientCount={clients.length}
                selectedCount={selectedClients.size}
                clientStats={clientStats}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Client Details Modal */}
      <Dialog open={!!selectedClientForDetails} onOpenChange={(open) => !open && setSelectedClientForDetails(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClientForDetails && clients.find(c => c.id === selectedClientForDetails)?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed client information, statistics, and activity timeline
            </DialogDescription>
          </DialogHeader>
          
          {selectedClientForDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="tabpanel" aria-label="Client details">
                {/* Stats Column */}
                <div role="region" aria-label="Client statistics">
                  {clientStats.has(selectedClientForDetails) ? (
                    <ClientStatsCard stats={clientStats.get(selectedClientForDetails)!} />
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No statistics available for this client.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                {/* Timeline Column */}
                <div role="region" aria-label="Client activity timeline">
                  <ClientActivityTimeline clientId={selectedClientForDetails} />
                </div>
              </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};