import React, { useState, useEffect } from 'react';
import { Client } from '@/types/database';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Save, X, Plus } from 'lucide-react';
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
    domains: client?.domains || [],
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
      // Transform form data to match database constraints
      const submissionData = {
        ...formData,
        // Convert empty strings to null for fields with database constraints
        company_size: formData.company_size || null,
        industry: formData.industry || null,
        website: formData.website || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
      };
      
      await onSubmit(submissionData as any);
      
      // Clear draft on successful submission
      if (!client) {
        localStorage.removeItem('client-form-draft');
      }
      
      setIsDirty(false);
      clearErrors();
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Handle specific database constraint errors
        if (message.includes('not-null constraint') || message.includes('null value')) {
          if (message.includes('name')) {
            errorMessage = 'Company name is required and cannot be empty.';
          } else {
            errorMessage = 'A required field is missing. Please check all required fields marked with *.';
          }
        } else if (message.includes('unique constraint') || message.includes('duplicate')) {
          if (message.includes('name')) {
            errorMessage = 'A client with this company name already exists.';
          } else if (message.includes('email')) {
            errorMessage = 'A client with this email address already exists.';
          } else {
            errorMessage = 'This client information already exists in the system.';
          }
        } else if (message.includes('check constraint') || message.includes('invalid')) {
          if (message.includes('company_size')) {
            errorMessage = 'Please select a valid company size from the dropdown.';
          } else if (message.includes('status')) {
            errorMessage = 'Please select a valid status from the dropdown.';
          } else if (message.includes('email')) {
            errorMessage = 'Please enter a valid email address format.';
          } else if (message.includes('phone')) {
            errorMessage = 'Please enter a valid phone number format.';
          } else if (message.includes('website')) {
            errorMessage = 'Please enter a valid website URL starting with http:// or https://.';
          } else {
            errorMessage = 'One or more fields contain invalid data. Please check your entries.';
          }
        } else if (message.includes('permission') || message.includes('access')) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (message.includes('network') || message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // For other errors, provide a more helpful generic message
          errorMessage = 'Unable to save client. Please verify all fields are completed correctly and try again.';
        }
      }
      
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
      domains: [],
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
                Company Name <span className="text-destructive" aria-label="required">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={(e) => handleBlur('name', e.target.value)}
                placeholder="Enter company name"
                className={errors.name ? 'border-destructive' : ''}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : "name-help"}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">{errors.name}</p>
              )}
              <p id="name-help" className="text-xs text-muted-foreground sr-only">
                Enter the full legal name of the company (2-100 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={(e) => handleBlur('email', e.target.value)}
                placeholder="contact@company.com"
                className={errors.email ? 'border-destructive' : ''}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : "email-help"}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive" role="alert">{errors.email}</p>
              )}
              <p id="email-help" className="text-xs text-muted-foreground sr-only">
                Primary contact email address for this client
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={(e) => handleBlur('phone', e.target.value)}
                placeholder="+1-555-0123"
                className={errors.phone ? 'border-destructive' : ''}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : "phone-help"}
              />
              {errors.phone && (
                <p id="phone-error" className="text-sm text-destructive" role="alert">{errors.phone}</p>
              )}
              <p id="phone-help" className="text-xs text-muted-foreground sr-only">
                Phone number with country code (7-20 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                onBlur={(e) => handleBlur('website', e.target.value)}
                placeholder="https://company.com"
                className={errors.website ? 'border-destructive' : ''}
                aria-invalid={!!errors.website}
                aria-describedby={errors.website ? "website-error" : "website-help"}
              />
              {errors.website && (
                <p id="website-error" className="text-sm text-destructive" role="alert">{errors.website}</p>
              )}
              <p id="website-help" className="text-xs text-muted-foreground sr-only">
                Company website URL (must start with http:// or https://)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Technology, Healthcare, etc."
                aria-describedby="industry-help"
              />
              <p id="industry-help" className="text-xs text-muted-foreground sr-only">
                The primary industry or business sector
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Select
                value={formData.company_size}
                onValueChange={(value) => handleInputChange('company_size', value)}
                name="company_size"
              >
                <SelectTrigger 
                  id="company_size"
                  aria-describedby="company-size-help"
                >
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
              <p id="company-size-help" className="text-xs text-muted-foreground sr-only">
                Approximate number of employees at the company
              </p>
            </div>
          </div>

          {/* Domains Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Authorized Domains</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(prev => ({ ...prev, domains: [...prev.domains, ''] }));
                  setIsDirty(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </div>
            <div className="space-y-2">
              {formData.domains.map((domain, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={domain}
                    onChange={(e) => {
                      const newDomains = [...formData.domains];
                      newDomains[index] = e.target.value.toLowerCase();
                      setFormData(prev => ({ ...prev, domains: newDomains }));
                      setIsDirty(true);
                    }}
                    placeholder="example.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newDomains = formData.domains.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, domains: newDomains }));
                      setIsDirty(true);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.domains.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add authorized domains to enable email validation for contacts, tickets, and user management.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                name="status"
              >
                <SelectTrigger 
                  id="status"
                  aria-describedby="status-help"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
              <p id="status-help" className="text-xs text-muted-foreground sr-only">
                Current relationship status with this client
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this client..."
              rows={3}
              aria-describedby="notes-help"
            />
            <p id="notes-help" className="text-xs text-muted-foreground sr-only">
              Optional additional information or special requirements for this client
            </p>
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