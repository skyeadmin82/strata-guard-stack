import React, { useState, useEffect } from 'react';
import { Client } from '@/types/database';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const validationSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  email: {
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  },
  phone: {
    pattern: /^\+?[0-9\s\-\(\)]{7,20}$/,
  },
  website: {
    pattern: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  },
};

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    industry: client?.industry || '',
    company_size: client?.company_size || '',
    website: client?.website || '',
    phone: client?.phone || '',
    email: client?.email || '',
    status: client?.status || 'active',
    notes: client?.notes || '',
  });

  const [isDirty, setIsDirty] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const { errors, validateForm, handleBlur, isValid, clearErrors } = useFormValidation(validationSchema);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (isDirty && !client) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      
      const timer = setTimeout(() => {
        localStorage.setItem('client-form-draft', JSON.stringify(formData));
      }, 2000);
      
      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [formData, isDirty, client, autoSaveTimer]);

  // Load draft on mount (only for new clients)
  useEffect(() => {
    if (!client) {
      const draft = localStorage.getItem('client-form-draft');
      if (draft) {
        try {
          const draftData = JSON.parse(draft);
          setFormData(draftData);
          setIsDirty(true);
        } catch (error) {
          console.error('Error loading draft:', error);
          localStorage.removeItem('client-form-draft');
        }
      }
    }
  }, [client]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSubmitError(null);
    
    // Real-time validation
    handleBlur(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      setSubmitError('Please fix the validation errors below.');
      return;
    }

    try {
      await onSubmit(formData as any);
      
      // Clear draft on successful submission
      if (!client) {
        localStorage.removeItem('client-form-draft');
      }
      
      setIsDirty(false);
      clearErrors();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }
    
    if (!client) {
      localStorage.removeItem('client-form-draft');
    }
    
    onCancel();
  };

  const clearDraft = () => {
    localStorage.removeItem('client-form-draft');
    setFormData({
      name: '',
      industry: '',
      company_size: '',
      website: '',
      phone: '',
      email: '',
      status: 'active',
      notes: '',
    });
    setIsDirty(false);
    clearErrors();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {client ? 'Edit Client' : 'Add New Client'}
        </CardTitle>
        <CardDescription>
          {client 
            ? 'Update client information and settings.'
            : 'Enter client details to add them to your system.'
          }
        </CardDescription>
        {isDirty && !client && (
          <div className="flex items-center justify-between bg-muted p-2 rounded-md text-sm">
            <span className="text-muted-foreground">Draft auto-saved</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearDraft}
              className="h-auto p-1 text-xs"
            >
              Clear Draft
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={(e) => handleBlur('name', e.target.value)}
                placeholder="Enter company name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={(e) => handleBlur('email', e.target.value)}
                placeholder="contact@company.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={(e) => handleBlur('phone', e.target.value)}
                placeholder="+1-555-0123"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                onBlur={(e) => handleBlur('website', e.target.value)}
                placeholder="https://company.com"
                className={errors.website ? 'border-destructive' : ''}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Technology, Healthcare, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Select
                value={formData.company_size}
                onValueChange={(value) => handleInputChange('company_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-1000">201-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this client..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isValid}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {client ? 'Update Client' : 'Create Client'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};