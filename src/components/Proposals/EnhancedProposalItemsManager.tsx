import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Trash2, 
  Plus, 
  GripVertical, 
  Package, 
  Settings, 
  Search,
  Filter,
  ShoppingCart,
  Calculator,
  Percent,
  DollarSign,
  Clock,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProposalItem {
  id?: string;
  catalog_item_id?: string; // Link to proposal_catalog for QBO integration
  item_order: number;
  item_type: 'product' | 'service' | 'subscription' | 'one-time';
  category: string;
  name: string;
  description: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  total_price: number;
  billing_cycle?: string;
  setup_fee?: number;
  renewal_price?: number;
  vendor?: string;
  margin_percent?: number;
  qbo_item_ref?: string;
  qbo_sync_status?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  unit_price: number;
  item_type: string;
  margin_percent: number;
  vendor?: string;
}

interface EnhancedProposalItemsManagerProps {
  items: ProposalItem[];
  onItemsChange: (items: ProposalItem[]) => void;
  currency?: string;
}

export const EnhancedProposalItemsManager: React.FC<EnhancedProposalItemsManagerProps> = ({
  items,
  onItemsChange,
  currency = 'USD'
}) => {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const { toast } = useToast();

  useEffect(() => {
    fetchCatalogItems();
  }, []);

  const fetchCatalogItems = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_catalog')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching catalog items:', error);
        // Fallback to sample data if no catalog items exist
        const sampleCatalog: CatalogItem[] = [
          {
            id: 'sample-1',
            name: 'Microsoft 365 Business Premium',
            description: 'Complete productivity suite with advanced security features',
            category: 'Software',
            sku: 'MS365-BP-001',
            unit_price: 22.00,
            item_type: 'subscription',
            margin_percent: 25,
            vendor: 'Microsoft'
          },
          {
            id: 'sample-2',
            name: 'IT Support Services - Level 1',
            description: 'Basic help desk support and troubleshooting',
            category: 'Services',
            sku: 'ITS-L1-001',
            unit_price: 150.00,
            item_type: 'service',
            margin_percent: 40
          },
          {
            id: 'sample-3',
            name: 'Network Security Assessment',
            description: 'Comprehensive security audit and vulnerability assessment',
            category: 'Professional Services',
            sku: 'NSA-001',
            unit_price: 2500.00,
            item_type: 'one-time',
            margin_percent: 60
          },
          {
            id: 'sample-4',
            name: 'Managed Firewall Service',
            description: 'Enterprise firewall management and monitoring',
            category: 'Security',
            sku: 'MFS-001',
            unit_price: 299.00,
            item_type: 'subscription',
            margin_percent: 35,
            vendor: 'SonicWall'
          }
        ];
        setCatalogItems(sampleCatalog);
        return;
      }

      const catalogItems: CatalogItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: item.category,
        sku: item.sku || '',
        unit_price: parseFloat(String(item.unit_price || '0')),
        item_type: item.item_type,
        margin_percent: parseFloat(String(item.margin_percent || '0')),
        vendor: item.vendor || ''
      }));
      
      setCatalogItems(catalogItems);
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      toast({
        title: 'Warning',
        description: 'Using sample catalog data. Add items to your catalog for real products.',
        variant: 'default',
      });
    }
  };

  const addItemFromCatalog = (catalogItem: CatalogItem) => {
    const newItem: ProposalItem = {
      id: undefined, // Will be set when saved to database
      catalog_item_id: catalogItem.id, // Link to catalog item for QBO sync
      item_order: items.length + 1,
      item_type: catalogItem.item_type as ProposalItem['item_type'],
      category: catalogItem.category,
      name: catalogItem.name,
      description: catalogItem.description,
      sku: catalogItem.sku,
      quantity: 1,
      unit_price: catalogItem.unit_price,
      discount_percent: 0,
      discount_amount: 0,
      tax_percent: 0,
      total_price: catalogItem.unit_price,
      vendor: catalogItem.vendor,
      margin_percent: catalogItem.margin_percent,
    };

    if (catalogItem.item_type === 'subscription') {
      newItem.billing_cycle = 'monthly';
      newItem.renewal_price = catalogItem.unit_price;
    }

    onItemsChange([...items, newItem]);
    setShowCatalog(false);
    
    toast({
      title: 'Item Added',
      description: `${catalogItem.name} has been added to the proposal`,
    });
  };

  const addBlankItem = () => {
    const newItem: ProposalItem = {
      item_order: items.length + 1,
      item_type: 'product',
      category: '',
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      discount_amount: 0,
      tax_percent: 0,
      total_price: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems.map((item, i) => ({ ...item, item_order: i + 1 })));
  };

  const updateItem = (index: number, field: keyof ProposalItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total price
    const item = newItems[index];
    const subtotal = item.quantity * item.unit_price;
    
    let discount = 0;
    if (discountType === 'percentage') {
      discount = subtotal * (item.discount_percent / 100);
    } else {
      discount = item.discount_amount || 0;
    }
    
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (item.tax_percent / 100);
    const setupFee = item.setup_fee || 0;
    
    item.total_price = afterDiscount + tax + setupFee;
    
    onItemsChange(newItems);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'default';
      case 'service': return 'secondary';
      case 'subscription': return 'outline';
      case 'one-time': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredCatalogItems = catalogItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(catalogItems.map(item => item.category))];

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalDiscount = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    if (discountType === 'percentage') {
      return sum + (itemSubtotal * item.discount_percent / 100);
    } else {
      return sum + (item.discount_amount || 0);
    }
  }, 0);
  const totalTax = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemDiscount = discountType === 'percentage' 
      ? itemSubtotal * item.discount_percent / 100
      : item.discount_amount || 0;
    return sum + ((itemSubtotal - itemDiscount) * item.tax_percent / 100);
  }, 0);
  const totalSetupFees = items.reduce((sum, item) => sum + (item.setup_fee || 0), 0);
  const grandTotal = subtotal - totalDiscount + totalTax + totalSetupFees;
  const totalMargin = items.reduce((sum, item) => {
    const itemTotal = item.total_price;
    const marginAmount = itemTotal * ((item.margin_percent || 0) / 100);
    return sum + marginAmount;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products & Services
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Add items from catalog or create custom line items
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse Catalog
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product & Service Catalog
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex gap-4">
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
                  </div>

                  {/* Catalog Items */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product/Service</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Margin</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCatalogItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {item.name}
                                  <Badge variant={getItemTypeColor(item.item_type)}>
                                    {item.item_type}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  SKU: {item.sku}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {item.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(item.unit_price)}
                              {item.item_type === 'subscription' && (
                                <div className="text-xs text-muted-foreground">/month</div>
                              )}
                            </TableCell>
                            <TableCell>{item.margin_percent}%</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => addItemFromCatalog(item)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button onClick={addBlankItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Item
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Discount Type Toggle */}
          <div className="flex items-center gap-4">
            <Label>Discount Type:</Label>
            <Select value={discountType} onValueChange={(value: 'percentage' | 'amount') => setDiscountType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Percentage
                  </div>
                </SelectItem>
                <SelectItem value="amount">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Fixed Amount
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-6 border rounded-lg space-y-4 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Item #{index + 1}</span>
                      <Badge variant={getItemTypeColor(item.item_type)}>
                        {item.item_type}
                      </Badge>
                      {item.sku && (
                        <Badge variant="outline" className="text-xs">
                          {item.sku}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Basic Item Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`name-${index}`}>Item Name *</Label>
                    <Input
                      id={`name-${index}`}
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Enter item name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`type-${index}`}>Type</Label>
                    <Select 
                      value={item.item_type} 
                      onValueChange={(value) => updateItem(index, 'item_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <Input
                      id={`category-${index}`}
                      value={item.category}
                      onChange={(e) => updateItem(index, 'category', e.target.value)}
                      placeholder="e.g., Software, Hardware"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Detailed item description"
                    rows={3}
                  />
                </div>
                
                {/* Pricing and Calculations */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`price-${index}`}>Unit Price</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`discount-${index}`}>
                      {discountType === 'percentage' ? 'Discount %' : 'Discount $'}
                    </Label>
                    <Input
                      id={`discount-${index}`}
                      type="number"
                      min="0"
                      step={discountType === 'percentage' ? "0.1" : "0.01"}
                      max={discountType === 'percentage' ? "100" : undefined}
                      value={discountType === 'percentage' ? item.discount_percent : item.discount_amount}
                      onChange={(e) => {
                        const field = discountType === 'percentage' ? 'discount_percent' : 'discount_amount';
                        updateItem(index, field, parseFloat(e.target.value) || 0);
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`tax-${index}`}>Tax %</Label>
                    <Input
                      id={`tax-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.tax_percent}
                      onChange={(e) => updateItem(index, 'tax_percent', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {item.item_type === 'subscription' && (
                    <div>
                      <Label htmlFor={`setup-${index}`}>Setup Fee</Label>
                      <Input
                        id={`setup-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.setup_fee || 0}
                        onChange={(e) => updateItem(index, 'setup_fee', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label>Total</Label>
                    <div className="flex items-center h-10 px-3 py-2 bg-muted rounded-md">
                      <span className="font-bold text-green-600">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional fields for subscriptions */}
                {item.item_type === 'subscription' && (
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`billing-${index}`}>Billing Cycle</Label>
                        <Select 
                          value={item.billing_cycle || 'monthly'} 
                          onValueChange={(value) => updateItem(index, 'billing_cycle', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`renewal-${index}`}>Renewal Price</Label>
                        <Input
                          id={`renewal-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.renewal_price || item.unit_price}
                          onChange={(e) => updateItem(index, 'renewal_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`margin-${index}`}>Margin %</Label>
                        <Input
                          id={`margin-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.margin_percent || 0}
                          onChange={(e) => updateItem(index, 'margin_percent', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No items added yet</p>
                <p className="text-sm mb-4">Add items from the catalog or create custom line items</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setShowCatalog(true)}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Browse Catalog
                  </Button>
                  <Button onClick={addBlankItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Item
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Financial Summary */}
          {items.length > 0 && (
            <div className="mt-8">
              <Separator className="mb-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pricing Breakdown */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Pricing Breakdown
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Total Discount:</span>
                      <span>-{formatCurrency(totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tax:</span>
                      <span>+{formatCurrency(totalTax)}</span>
                    </div>
                    {totalSetupFees > 0 && (
                      <div className="flex justify-between">
                        <span>Setup Fees:</span>
                        <span>+{formatCurrency(totalSetupFees)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Grand Total:</span>
                      <span className="text-green-600">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Business Metrics */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Business Metrics
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-medium">{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Margin:</span>
                      <span className="font-medium text-green-600">{formatCurrency(totalMargin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. Margin %:</span>
                      <span className="font-medium">
                        {items.length > 0 
                          ? ((totalMargin / grandTotal) * 100).toFixed(1) + '%'
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recurring Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          items
                            .filter(item => item.item_type === 'subscription')
                            .reduce((sum, item) => sum + item.total_price, 0)
                        )}
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};