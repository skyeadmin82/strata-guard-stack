import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, Tenant } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useErrorLogger } from '@/hooks/useErrorLogger';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  tenant: Tenant | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { logError } = useErrorLogger();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile and tenant data
          setTimeout(async () => {
            try {
              await fetchUserData(session.user.id);
            } catch (error) {
              logError(error as Error, 'AUTH_DATA_FETCH', { userId: session.user.id });
            }
          }, 0);
        } else {
          setProfile(null);
          setTenant(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id).catch((error) => {
          logError(error as Error, 'INITIAL_AUTH_FETCH', { userId: session.user.id });
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (authUserId: string): Promise<void> => {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (userError) throw userError;
      setProfile(userData);

      // Fetch tenant data
      if (userData?.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .single();

        if (tenantError) throw tenantError;
        setTenant({
          ...tenantData,
          settings: tenantData.settings as Record<string, any> | null,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (error) {
      logError(error as Error, 'SIGN_IN_ERROR', { email });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>): Promise<void> => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      logError(error as Error, 'SIGN_UP_ERROR', { email });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      setUser(null);
      setProfile(null);
      setTenant(null);
      setSession(null);
      
      toast({
        title: "Signed Out",
        description: "Successfully signed out.",
      });
    } catch (error) {
      logError(error as Error, 'SIGN_OUT_ERROR');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    tenant,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user && !!profile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};