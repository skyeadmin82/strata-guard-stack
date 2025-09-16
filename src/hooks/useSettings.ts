import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';
import { useAuth } from '@/contexts/AuthContext';

interface UserSettings {
  preferences?: {
    theme?: string;
    timezone?: string;
    date_format?: string;
    time_format?: string;
  };
  notifications?: {
    email_enabled?: boolean;
    ticket_updates?: boolean;
    client_updates?: boolean;
    system_alerts?: boolean;
    marketing?: boolean;
    frequency?: string;
  };
}

interface CompanySettings {
  general?: {
    company_name?: string;
    industry?: string;
    website?: string;
    phone?: string;
    address?: string;
  };
  integrations?: {
    quickbooks?: {
      enabled?: boolean;
      sync_frequency?: string;
    };
    email?: {
      provider?: string;
      smtp_settings?: any;
      from_address?: string;
      from_name?: string;
    };
  };
  billing?: {
    plan?: string;
    billing_cycle?: string;
    billing_email?: string;
  };
  security?: {
    two_factor_enabled?: boolean;
    two_factor_required?: boolean;
    password_policy?: {
      min_length?: number;
      require_uppercase?: boolean;
      require_lowercase?: boolean;
      require_numbers?: boolean;
      require_symbols?: boolean;
    };
    session_timeout?: number;
    session_timeout_minutes?: number;
    ip_whitelist?: string[];
    audit_logging?: boolean;
    data_retention?: number;
    backup_frequency?: string;
  };
}

export const useSettings = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { user } = useAuth();
  
  const [userSettings, setUserSettings] = useState<UserSettings>({});
  const [companySettings, setCompanySettings] = useState<CompanySettings>({});
  const [loading, setLoading] = useState(false);

  // Load user settings
  const loadUserSettings = useCallback(async () => {
    if (!tenantId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id);

      if (error) throw error;

      const settings: UserSettings = {};
      data?.forEach(setting => {
        settings[setting.category as keyof UserSettings] = setting.settings as any;
      });

      setUserSettings(settings);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  }, [tenantId, user]);

  // Load company settings
  const loadCompanySettings = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const settings: CompanySettings = {};
      data?.forEach(setting => {
        settings[setting.category as keyof CompanySettings] = setting.settings as any;
      });

      setCompanySettings(settings);
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  }, [tenantId]);

  // Save user settings
  const saveUserSettings = useCallback(async (
    category: keyof UserSettings, 
    settings: any
  ) => {
    if (!tenantId || !user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          tenant_id: tenantId,
          user_id: user.id,
          category: category as string,
          settings
        }, {
          onConflict: 'tenant_id,user_id,category'
        });

      if (error) throw error;

      setUserSettings(prev => ({
        ...prev,
        [category]: settings
      }));

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });

    } catch (error) {
      console.error('Error saving user settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, user, toast]);

  // Save company settings
  const saveCompanySettings = useCallback(async (
    category: keyof CompanySettings, 
    settings: any
  ) => {
    if (!tenantId) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          tenant_id: tenantId,
          category: category as string,
          settings
        }, {
          onConflict: 'tenant_id,category'
        });

      if (error) throw error;

      setCompanySettings(prev => ({
        ...prev,
        [category]: settings
      }));

      toast({
        title: "Settings Saved", 
        description: "Company settings have been updated successfully",
      });

    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save company settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  // Load settings on mount
  useEffect(() => {
    loadUserSettings();
    loadCompanySettings();
  }, [loadUserSettings, loadCompanySettings]);

  return {
    userSettings,
    companySettings,
    loading,
    saveUserSettings,
    saveCompanySettings,
    refreshSettings: () => {
      loadUserSettings();
      loadCompanySettings();
    }
  };
};