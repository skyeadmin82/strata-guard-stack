import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Settings, 
  RotateCcw,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Wrench,
  Building,
  Users,
  Clock,
  Percent,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface ProductService {
  id: string;
  name: string;
  description: string;
  category: string;
  item_type: 'product' | 'service' | 'subscription' | 'bundle';
  sku: string;
  unit_price: number;
  cost_price?: number;
  margin_percent: number;
  vendor: string;
  inventory_qty: number;
  min_stock_level: number;
  tax_code: string;
  is_active: boolean;
  qbo_item_id: string;
  qbo_sync_status: 'synced' | 'pending' | 'error' | 'not_synced';
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

const ProductsServicesPage: React.FC = () => {
  const [items, setItems] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductService | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    item_type: 'product' as ProductService['item_type'],
    sku: '',
    unit_price: '',
    cost_price: '',
    vendor: '',
    inventory_qty: '',
    min_stock_level: '',
    tax_code: '',
    is_active: true
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to view products and services.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase
        .from('proposal_catalog')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const mappedItems: ProductService[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category,
        item_type: item.item_type as ProductService['item_type'],
        sku: item.sku || '',
        unit_price: parseFloat(String(item.unit_price || '0')),
        cost_price: (item as any).cost_price ? parseFloat(String((item as any).cost_price)) : undefined,
        margin_percent: parseFloat(String(item.margin_percent || '0')),
        vendor: item.vendor || '',
        is_active: item.is_active !== false,
        inventory_qty: (item as any).inventory_qty || 0,
        min_stock_level: (item as any).min_stock_level || 0,
        tax_code: (item as any).tax_code || '',
        qbo_item_id: (item as any).qbo_item_id || '',
        qbo_sync_status: ((item as any).qbo_sync_status || 'pending') as ProductService['qbo_sync_status'],
        last_synced_at: (item as any).last_synced_at || '',
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setItems(mappedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products and services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      item_type: 'product',
      sku: '',
      unit_price: '',
      cost_price: '',
      vendor: '',
      inventory_qty: '',
      min_stock_level: '',
      tax_code: '',
      is_active: true
    });
  };

  const handleCreateItem = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to create products and services.',
          variant: 'destructive',
        });
        return;
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', currentUser.user.id)
        .single();

      if (!userProfile?.tenant_id) {
        toast({
          title: 'Error',
          description: 'Unable to determine your organization. Please contact support.',
          variant: 'destructive',
        });
        return;
      }

      const unitPrice = parseFloat(formData.unit_price) || 0;
      const costPrice = parseFloat(formData.cost_price) || 0;
      const marginPercent = costPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

      const { error } = await supabase
        .from('proposal_catalog')
        .insert({
          tenant_id: userProfile.tenant_id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          item_type: formData.item_type,
          sku: formData.sku,
          unit_price: unitPrice,
          cost_price: costPrice,
          margin_percent: marginPercent,
          vendor: formData.vendor || null,
          inventory_qty: parseInt(formData.inventory_qty) || 0,
          min_stock_level: parseInt(formData.min_stock_level) || 0,
          tax_code: formData.tax_code || null,
          is_active: formData.is_active,
          qbo_sync_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product/Service created successfully',
      });

      setShowCreateDialog(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to create product/service',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const unitPrice = parseFloat(formData.unit_price) || 0;
      const costPrice = parseFloat(formData.cost_price) || 0;
      const marginPercent = costPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

      const { error } = await supabase
        .from('proposal_catalog')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          item_type: formData.item_type,
          sku: formData.sku,
          unit_price: unitPrice,
          cost_price: costPrice,
          margin_percent: marginPercent,
          vendor: formData.vendor || null,
          inventory_qty: parseInt(formData.inventory_qty) || 0,
          min_stock_level: parseInt(formData.min_stock_level) || 0,
          tax_code: formData.tax_code || null,
          is_active: formData.is_active,
          qbo_sync_status: 'pending',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product/Service updated successfully',
      });

      setEditingItem(null);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product/service',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('proposal_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product/Service deleted successfully',
      });

      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product/service',
        variant: 'destructive',
      });
    }
  };

  const handleEditItem = (item: ProductService) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      item_type: item.item_type,
      sku: item.sku,
      unit_price: item.unit_price.toString(),
      cost_price: item.cost_price?.toString() || '',
      vendor: item.vendor,
      inventory_qty: item.inventory_qty.toString(),
      min_stock_level: item.min_stock_level.toString(),
      tax_code: item.tax_code,
      is_active: item.is_active
    });
    setShowCreateDialog(true);
  };

  const syncWithQBO = async (itemId: string) => {
    try {
      // This would typically call a Supabase edge function to sync with QBO
      const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
        body: { action: 'sync_item', item_id: itemId }
      });

      if (error) throw error;

      toast({
        title: 'Sync Initiated',
        description: 'Item sync with QuickBooks Online has been queued.',
      });

      fetchItems();
    } catch (error) {
      console.error('Error syncing with QBO:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to sync with QuickBooks Online. Please check your integration settings.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: ProductService['qbo_sync_status']) => {
    switch (status) {
      case 'synced':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Synced</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Not Synced</Badge>;
    }
  };

  const getTypeIcon = (type: ProductService['item_type']) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'service':
        return <Wrench className="w-4 h-4" />;
      case 'subscription':
        return <RefreshCw className="w-4 h-4" />;
      case 'bundle':
        return <Building className="w-4 h-4" />;
      default:
        return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesType = typeFilter === 'all' || item.item_type === typeFilter;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && item.is_active) ||
                      (activeTab === 'inactive' && !item.is_active) ||
                      (activeTab === 'qbo-synced' && item.qbo_sync_status === 'synced') ||
                      (activeTab === 'qbo-pending' && item.qbo_sync_status === 'pending');
    
    return matchesSearch && matchesCategory && matchesType && matchesTab;
  });

  const categories = [...new Set(items.map(item => item.category))];
  const totalValue = items.reduce((sum, item) => sum + (item.unit_price * item.inventory_qty), 0);
  const totalMargin = items.reduce((sum, item) => sum + (item.unit_price * item.margin_percent / 100), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products & Services</h1>
            <p className="text-muted-foreground">
              Manage your product catalog and services with QuickBooks Online integration
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Product/Service' : 'Add New Product/Service'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter product/service name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Enter SKU"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Software, Hardware, Services"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item_type">Type</Label>
                      <Select value={formData.item_type} onValueChange={(value: ProductService['item_type']) => setFormData({ ...formData, item_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="subscription">Subscription</SelectItem>
                          <SelectItem value="bundle">Bundle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="unit_price">Unit Price *</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost_price">Cost Price</Label>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="margin">Margin %</Label>
                      <Input
                        id="margin"
                        value={(() => {
                          const unitPrice = parseFloat(formData.unit_price) || 0;
                          const costPrice = parseFloat(formData.cost_price) || 0;
                          if (unitPrice > 0 && costPrice > 0) {
                            return ((unitPrice - costPrice) / unitPrice * 100).toFixed(1);
                          }
                          return '0.0';
                        })()}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input
                        id="vendor"
                        value={formData.vendor}
                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                        placeholder="Enter vendor name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax_code">Tax Code</Label>
                      <Input
                        id="tax_code"
                        value={formData.tax_code}
                        onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                        placeholder="Enter tax code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inventory_qty">Inventory Quantity</Label>
                      <Input
                        id="inventory_qty"
                        type="number"
                        value={formData.inventory_qty}
                        onChange={(e) => setFormData({ ...formData, inventory_qty: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setEditingItem(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={editingItem ? handleUpdateItem : handleCreateItem}>
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">
                {items.filter(i => i.is_active).length} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Inventory value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {items.length > 0 ? (items.reduce((sum, item) => sum + item.margin_percent, 0) / items.length).toFixed(1) : '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QBO Synced</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
    <CardContent>
              <div className="text-2xl font-bold">
                {items.filter(i => i.qbo_sync_status === 'synced').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of {items.length} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products and services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                  <SelectItem value="subscription">Subscriptions</SelectItem>
                  <SelectItem value="bundle">Bundles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items Table with Tabs */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Items ({items.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({items.filter(i => i.is_active).length})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({items.filter(i => !i.is_active).length})</TabsTrigger>
                <TabsTrigger value="qbo-synced">QBO Synced ({items.filter(i => i.qbo_sync_status === 'synced').length})</TabsTrigger>
                <TabsTrigger value="qbo-pending">QBO Pending ({items.filter(i => i.qbo_sync_status === 'pending').length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading products and services...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead>QBO Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {item.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.item_type)}
                            <span className="capitalize">{item.item_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-sm">
                            {item.sku || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${item.unit_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.margin_percent.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.qbo_sync_status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.is_active ? "default" : "secondary"}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {item.qbo_sync_status !== 'synced' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => syncWithQBO(item.id)}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredItems.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products or services found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first product or service'
                      }
                    </p>
                    {!searchTerm && categoryFilter === 'all' && typeFilter === 'all' && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Item
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProductsServicesPage;