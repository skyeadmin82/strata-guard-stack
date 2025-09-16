import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface ProposalItem {
  id?: string;
  item_order: number;
  item_type: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  total_price: number;
}

interface ProposalItemsManagerProps {
  items: ProposalItem[];
  onItemsChange: (items: ProposalItem[]) => void;
  currency?: string;
}

export const ProposalItemsManager: React.FC<ProposalItemsManagerProps> = ({
  items,
  onItemsChange,
  currency = 'USD'
}) => {
  const addItem = () => {
    const newItem: ProposalItem = {
      item_order: items.length + 1,
      item_type: 'product',
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
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
    const discount = subtotal * (item.discount_percent / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (item.tax_percent / 100);
    item.total_price = afterDiscount + tax;
    
    onItemsChange(newItems);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.discount_percent / 100), 0);
  const totalTax = items.reduce((sum, item) => sum + ((item.quantity * item.unit_price - (item.quantity * item.unit_price * item.discount_percent / 100)) * item.tax_percent / 100), 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Proposal Items</CardTitle>
          <Button onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Item #{index + 1}</span>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Item Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`type-${index}`}>Type</Label>
                  <Input
                    id={`type-${index}`}
                    value={item.item_type}
                    onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                    placeholder="product, service, etc."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Textarea
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Item description"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <Label htmlFor={`discount-${index}`}>Discount %</Label>
                  <Input
                    id={`discount-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={item.discount_percent}
                    onChange={(e) => updateItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
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
                
                <div>
                  <Label>Total</Label>
                  <div className="flex items-center h-10 px-3 py-2 bg-muted rounded-md">
                    <span className="font-medium">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items added yet. Click "Add Item" to get started.</p>
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Discount:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tax:</span>
                <span>+{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};