import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailAutomation, EmailTemplate } from '@/hooks/useEmailAutomation';
import { Eye, Send, Save, Code, Settings } from 'lucide-react';

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
  onClose: () => void;
}

export const EmailTemplateDialog: React.FC<EmailTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  onClose,
}) => {
  const { createTemplate, updateTemplate, testEmail, isLoading, isSending } = useEmailAutomation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject_template: '',
    html_template: '',
    text_template: '',
    category: '',
    sender_name: '',
    sender_email: '',
    reply_to: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    template_variables: {} as Record<string, any>
  });

  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        subject_template: template.subject_template,
        html_template: template.html_template || '',
        text_template: template.text_template || '',
        category: template.category || '',
        sender_name: template.sender_name || '',
        sender_email: template.sender_email || '',
        reply_to: template.reply_to || '',
        status: template.status,
        template_variables: template.template_variables || {}
      });
    } else {
      setFormData({
        name: '',
        description: '',
        subject_template: '',
        html_template: '',
        text_template: '',
        category: '',
        sender_name: '',
        sender_email: '',
        reply_to: '',
        status: 'draft',
        template_variables: {}
      });
    }
    setTestEmailAddress('');
    setVariableValues({});
  }, [template, open]);

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))];
  };

  const getAllVariables = (): string[] => {
    const subjectVars = extractVariables(formData.subject_template);
    const htmlVars = extractVariables(formData.html_template);
    const textVars = extractVariables(formData.text_template);
    return [...new Set([...subjectVars, ...htmlVars, ...textVars])];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (template) {
        await updateTemplate(template.id, formData);
      } else {
        await createTemplate(formData);
      }
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleTestEmail = async () => {
    if (!template || !testEmailAddress) return;
    
    try {
      await testEmail(template.id, testEmailAddress, variableValues);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderPreview = () => {
    let subject = formData.subject_template;
    let htmlContent = formData.html_template;
    let textContent = formData.text_template;

    // Replace variables with preview values
    Object.entries(variableValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value || `[${key}]`);
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value || `[${key}]`);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value || `[${key}]`);
    });

    return { subject, htmlContent, textContent };
  };

  const variables = getAllVariables();
  const preview = renderPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Email Template' : 'Create Email Template'}
          </DialogTitle>
          <DialogDescription>
            {template 
              ? 'Update your email template with SMTP2GO integration and error handling.'
              : 'Create a new email template with merge fields and validation.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Welcome Email Template"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Welcome, Newsletter, Promotional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of this template"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.subject_template}
                  onChange={(e) => handleInputChange('subject_template', e.target.value)}
                  placeholder="Welcome to {{company_name}}, {{first_name}}!"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use {`{{variable_name}}`} for merge fields
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="html_template">HTML Content</Label>
                <Textarea
                  id="html_template"
                  value={formData.html_template}
                  onChange={(e) => handleInputChange('html_template', e.target.value)}
                  placeholder="<h1>Welcome {{first_name}}!</h1><p>Thank you for joining {{company_name}}.</p>"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_template">Plain Text Content</Label>
                <Textarea
                  id="text_template"
                  value={formData.text_template}
                  onChange={(e) => handleInputChange('text_template', e.target.value)}
                  placeholder="Welcome {{first_name}}! Thank you for joining {{company_name}}."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Fallback content for email clients that don't support HTML
                </p>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sender_name">Sender Name</Label>
                <Input
                  id="sender_name"
                  value={formData.sender_name}
                  onChange={(e) => handleInputChange('sender_name', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_email">Sender Email</Label>
                <Input
                  id="sender_email"
                  type="email"
                  value={formData.sender_email}
                  onChange={(e) => handleInputChange('sender_email', e.target.value)}
                  placeholder="noreply@yourcompany.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply_to">Reply-To Email</Label>
              <Input
                id="reply_to"
                type="email"
                value={formData.reply_to}
                onChange={(e) => handleInputChange('reply_to', e.target.value)}
                placeholder="support@yourcompany.com"
              />
            </div>
          </TabsContent>

          <TabsContent value="variables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Detected Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                {variables.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {variables.map((variable) => (
                        <Badge key={variable} variant="secondary">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These variables will be replaced with actual values when sending emails.
                    </p>
                    
                    <div className="space-y-2">
                      <Label>Preview Values (for testing)</Label>
                      {variables.map((variable) => (
                        <div key={variable} className="flex items-center gap-2">
                          <Label className="w-32 text-sm">{variable}:</Label>
                          <Input
                            value={variableValues[variable] || ''}
                            onChange={(e) => setVariableValues(prev => ({
                              ...prev,
                              [variable]: e.target.value
                            }))}
                            placeholder={`Sample ${variable}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No variables detected. Use {`{{variable_name}}`} syntax to add merge fields.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Email Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject:</Label>
                  <p className="text-sm bg-muted p-2 rounded">{preview.subject}</p>
                </div>

                {preview.htmlContent && (
                  <div>
                    <Label className="text-sm font-medium">HTML Content:</Label>
                    <div 
                      className="text-sm bg-muted p-4 rounded border max-h-64 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: preview.htmlContent }}
                    />
                  </div>
                )}

                {preview.textContent && (
                  <div>
                    <Label className="text-sm font-medium">Plain Text:</Label>
                    <pre className="text-sm bg-muted p-4 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {preview.textContent}
                    </pre>
                  </div>
                )}

                {template && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Input
                      placeholder="test@example.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={!testEmailAddress || isSending}
                      variant="outline"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSending ? 'Sending...' : 'Send Test'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !formData.name || !formData.subject_template}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};