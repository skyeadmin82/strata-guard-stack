import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TenantInfo {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
}

export const useTenant = () => {
  const { toast } = useToast();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: userProfile, error } = await supabase
          .from('users')
          .select(`
            tenant_id,
            tenants:tenant_id (
              id,
              name,
              plan
            )
          `)
          .eq('auth_user_id', user.id)
          .single();

        if (error) throw error;

        if (userProfile?.tenants) {
          setTenant(userProfile.tenants as TenantInfo);
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
        toast({
          title: "Error",
          description: "Failed to load tenant information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [toast]);

  return { tenant, loading, tenantId: tenant?.id };
};