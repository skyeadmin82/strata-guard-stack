import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserSettings {
  notifications: {
    email_enabled: boolean;
    push_enabled: boolean;
    ticket_updates: boolean;
    client_updates: boolean;
    system_alerts: boolean;
    marketing: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    date_format: string;
    time_format: '12h' | '24h';
    dashboard_layout: 'compact' | 'comfortable';
  };
  privacy: {
    profile_visible: boolean;
    activity_tracking: boolean;
    usage_analytics: boolean;
  };
}

export interface CompanySettings {
  general: {
    company_name: string;
    industry: string;
    company_size: string;
    website: string;
    phone: string;
    address: any;
    logo_url?: string;
  };
  billing: {
    plan: string;
    billing_email: string;
    payment_method?: any;
    billing_address: any;
    tax_id?: string;
  };
  integrations: {
    quickbooks: {
      enabled: boolean;
      client_id?: string;
      sync_frequency: 'hourly' | 'daily' | 'weekly';
    };
    email: {
      provider: 'smtp2go' | 'sendgrid' | 'mailgun';
      api_key?: string;
      from_address: string;
      from_name: string;
    };
    calendar: {
      provider: 'google' | 'outlook' | 'ical';
      enabled: boolean;
    };
  };
  security: {
    two_factor_required: boolean;
    session_timeout_minutes: number;
    password_policy: {
      min_length: number;
      require_uppercase: boolean;
      require_lowercase: boolean;
      require_numbers: boolean;
      require_symbols: boolean;
    };
  };
  email_templates: {
    [key: string]: {
      subject: string;
      body: string;
      variables: string[];
    };
  };
}

export const useSettings = () => {
  const { profile } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUserSettings = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', profile.id);

      if (error) throw error;

      // Merge settings by category
      const settings: Partial<UserSettings> = {};
      data?.forEach(setting => {
        settings[setting.category as keyof UserSettings] = setting.settings as any;
      });

      // Set defaults for missing categories
      const defaultSettings: UserSettings = {
        notifications: {
          email_enabled: true,
          push_enabled: true,
          ticket_updates: true,
          client_updates: true,
          system_alerts: true,
          marketing: false,
          frequency: 'immediate',
        },
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          date_format: 'MM/dd/yyyy',
          time_format: '12h',
          dashboard_layout: 'comfortable',
        },
        privacy: {
          profile_visible: true,
          activity_tracking: true,
          usage_analytics: true,
        },
        ...settings,
      };

      setUserSettings(defaultSettings);

    } catch (error: any) {
      console.error('Failed to load user settings:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const saveUserSettings = useCallback(async (category: keyof UserSettings, settings: any) => {
    if (!profile?.id || !profile?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          user_id: profile.id,
          category,
          settings,
        }, {
          onConflict: 'tenant_id,user_id,category'
        });

      if (error) throw error;

      setUserSettings(prev => prev ? { ...prev, [category]: settings } : null);

      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });

    } catch (error: any) {
      console.error('Failed to save user settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  }, [profile?.id, profile?.tenant_id]);

  const loadCompanySettings = useCallback(async () => {
    if (!profile?.tenant_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

      if (error) throw error;

      // Merge settings by category
      const settings: Partial<CompanySettings> = {};
      data?.forEach(setting => {
        settings[setting.category as keyof CompanySettings] = setting.settings as any;
      });

      // Set defaults for missing categories
      const defaultSettings: CompanySettings = {
        general: {
          company_name: '',
          industry: '',
          company_size: '',
          website: '',
          phone: '',
          address: {},
        },
        billing: {
          plan: 'starter',
          billing_email: '',
          billing_address: {},
        },
        integrations: {
          quickbooks: {
            enabled: false,
            sync_frequency: 'daily',
          },
          email: {
            provider: 'smtp2go',
            from_address: '',
            from_name: '',
          },
          calendar: {
            provider: 'google',
            enabled: false,
          },
        },
        security: {
          two_factor_required: false,
          session_timeout_minutes: 480,
          password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_symbols: false,
          },
        },
        email_templates: {},
        ...settings,
      };

      setCompanySettings(defaultSettings);

    } catch (error: any) {
      console.error('Failed to load company settings:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  const saveCompanySettings = useCallback(async (category: keyof CompanySettings, settings: any) => {
    if (!profile?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          category,
          settings,
        }, {
          onConflict: 'tenant_id,category'
        });

      if (error) throw error;

      setCompanySettings(prev => prev ? { ...prev, [category]: settings } : null);

      toast({
        title: "Settings Saved",
        description: "Company settings have been updated successfully.",
      });

    } catch (error: any) {
      console.error('Failed to save company settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    if (profile) {
      loadUserSettings();
      loadCompanySettings();
    }
  }, [profile, loadUserSettings, loadCompanySettings]);

  return {
    userSettings,
    companySettings,
    loading,
    saveUserSettings,
    saveCompanySettings,
    loadUserSettings,
    loadCompanySettings,
  };
};