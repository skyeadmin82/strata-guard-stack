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
  Sync,
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
  vendor?: string;
  is_active: boolean;
  inventory_qty?: number;
  min_stock_level?: number;
  tax_code?: string;
  qbo_item_id?: string;
  qbo_sync_status?: 'pending' | 'synced' | 'error';
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

const ProductsServicesPage = () => {
  const [items, setItems] = useState<ProductService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductService | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete' | 'error'>('idle');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    item_type: 'product' as const,
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
        item_type: item.item_type,
        sku: item.sku || '',
        unit_price: parseFloat(String(item.unit_price || '0')),
        cost_price: item.cost_price ? parseFloat(String(item.cost_price)) : undefined,
        margin_percent: parseFloat(String(item.margin_percent || '0')),
        vendor: item.vendor || '',
        is_active: item.is_active !== false,
        inventory_qty: item.inventory_qty || 0,
        min_stock_level: item.min_stock_level || 0,
        tax_code: item.tax_code || '',
        qbo_item_id: item.qbo_item_id || '',
        qbo_sync_status: item.qbo_sync_status || 'pending',
        last_synced_at: item.last_synced_at || '',
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
      const unitPrice = parseFloat(formData.unit_price) || 0;
      const costPrice = parseFloat(formData.cost_price) || 0;
      const marginPercent = costPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

      const { error } = await supabase
        .from('proposal_catalog')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          item_type: formData.item_type,
          sku: formData.sku,
          unit_price: unitPrice,
          cost_price: costPrice || null,
          margin_percent: marginPercent,
          vendor: formData.vendor || null,
          inventory_qty: parseInt(formData.inventory_qty) || 0,
          min_stock_level: parseInt(formData.min_stock_level) || 0,
          tax_code: formData.tax_code || null,
          is_active: formData.is_active,
          qbo_sync_status: 'pending'
        });

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
          cost_price: costPrice || null,
          margin_percent: marginPercent,
          vendor: formData.vendor || null,
          inventory_qty: parseInt(formData.inventory_qty) || 0,
          min_stock_level: parseInt(formData.min_stock_level) || 0,
          tax_code: formData.tax_code || null,
          is_active: formData.is_active,
          qbo_sync_status: 'pending',
          updated_at: new Date().toISOString()
        })
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

  const handleQBOSync = async () => {
    try {
      setSyncStatus('syncing');
      
      const { data, error } = await supabase.functions.invoke('quickbooks-integration', {
        body: {
          action: 'sync_items',
          type: 'full_sync'
        }
      });

      if (error) throw error;

      setSyncStatus('complete');
      toast({
        title: 'Success',
        description: 'QuickBooks sync completed successfully',
      });

      // Refresh the items to show updated sync status
      fetchItems();
    } catch (error) {
      console.error('Error syncing with QuickBooks:', error);
      setSyncStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to sync with QuickBooks Online',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (item: ProductService) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      item_type: item.item_type,
      sku: item.sku,
      unit_price: item.unit_price.toString(),
      cost_price: item.cost_price?.toString() || '',
      vendor: item.vendor || '',
      inventory_qty: item.inventory_qty?.toString() || '0',
      min_stock_level: item.min_stock_level?.toString() || '0',
      tax_code: item.tax_code || '',
      is_active: item.is_active
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'service': return <Wrench className="w-4 h-4" />;
      case 'subscription': return <Clock className="w-4 h-4" />;
      case 'bundle': return <ShoppingCart className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'default';
      case 'service': return 'secondary';
      case 'subscription': return 'outline';
      case 'bundle': return 'destructive';
      default: return 'secondary';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesType = typeFilter === 'all' || item.item_type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = [...new Set(items.map(item => item.category))];
  const totalItems = items.length;
  const activeItems = items.filter(item => item.is_active).length;
  const totalValue = items.reduce((sum, item) => sum + (item.unit_price * (item.inventory_qty || 0)), 0);
  const avgMargin = items.length > 0 ? items.reduce((sum, item) => sum + item.margin_percent, 0) / items.length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products & Services</h1>
            <p className="text-muted-foreground">
              Manage your product catalog and service offerings with QuickBooks integration
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleQBOSync}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sync className="w-4 h-4 mr-2" />
              )}
              Sync QuickBooks
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
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
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {activeItems} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Current stock value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Across all items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QB Sync</CardTitle>
              <Sync className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {items.filter(item => item.qbo_sync_status === 'synced').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Items synced
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
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
          </CardHeader>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Items Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-center">QB Sync</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading items...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No items found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.sku}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeColor(item.item_type)} className="gap-1">
                            {getTypeIcon(item.item_type)}
                            {item.item_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.cost_price ? formatCurrency(item.cost_price) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Percent className="w-3 h-3" />
                            {item.margin_percent.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getSyncStatusIcon(item.qbo_sync_status || 'pending')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.is_active ? 'default' : 'secondary'}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(item)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Create New Item'}
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
                  placeholder="Enter item name"
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
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category"
                />
              </div>
              <div>
                <Label htmlFor="item_type">Type *</Label>
                <Select value={formData.item_type} onValueChange={(value: any) => setFormData({ ...formData, item_type: value })}>
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

            <div className="grid grid-cols-2 gap-4">
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

            {formData.item_type === 'product' && (
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
                  <Label htmlFor="min_stock_level">Min Stock Level</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={editingItem ? handleUpdateItem : handleCreateItem} className="flex-1">
                {editingItem ? 'Update Item' : 'Create Item'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingItem(null);
                  setShowCreateDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </div>
    </DashboardLayout>
  );
};

export default ProductsServicesPage;