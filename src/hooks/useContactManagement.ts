import { useState, useEffect, useCallback } from 'react';
import { Contact } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useContactManagement = (clientId: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch contacts for the client
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  // Real-time updates for contacts
  useEffect(() => {
    if (!clientId) return;

    fetchContacts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Contact change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setContacts(prev => [payload.new as Contact, ...prev]);
              break;
            case 'UPDATE':
              setContacts(prev => 
                prev.map(contact => 
                  contact.id === payload.new.id ? payload.new as Contact : contact
                )
              );
              break;
            case 'DELETE':
              setContacts(prev => 
                prev.filter(contact => contact.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchContacts]);

  // Create contact
  const createContact = useCallback(async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id, id')
        .eq('auth_user_id', currentUser.user?.id)
        .single();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // If setting as primary, first remove primary status from others
      if (contactData.is_primary) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('client_id', clientId);
      }

      // Validate email domain against client domains
      const { data: clientData } = await supabase
        .from('clients')
        .select('domains')
        .eq('id', clientId)
        .single();

      if (clientData?.domains && clientData.domains.length > 0) {
        const emailDomain = contactData.email.toLowerCase().split('@')[1];
        if (!clientData.domains.includes(emailDomain)) {
          throw new Error(`Email domain "${emailDomain}" is not authorized for this client. Authorized domains: ${clientData.domains.join(', ')}`);
        }
      }

      // Clean up the contact data - convert empty strings to null for optional fields
      const cleanedContactData = {
        ...contactData,
        phone: contactData.phone?.trim() || null,
        title: contactData.title?.trim() || null,
        department: contactData.department?.trim() || null,
        notes: contactData.notes?.trim() || null,
        tenant_id: userProfile.tenant_id,
        // Use the users table ID (which the foreign key references)
        created_by: userProfile.id,
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert(cleanedContactData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to create contact',
        variant: 'destructive',
      });
      throw error;
    }
  }, [clientId, toast]);

  // Update contact
  const updateContact = useCallback(async (contactId: string, contactData: Partial<Contact>) => {
    try {
      // Validate email domain if email is being updated
      if (contactData.email) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('domains')
          .eq('id', clientId)
          .single();

        if (clientData?.domains && clientData.domains.length > 0) {
          const emailDomain = contactData.email.toLowerCase().split('@')[1];
          if (!clientData.domains.includes(emailDomain)) {
            throw new Error(`Email domain "${emailDomain}" is not authorized for this client. Authorized domains: ${clientData.domains.join(', ')}`);
          }
        }
      }

      // If setting as primary, first remove primary status from others
      if (contactData.is_primary) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('client_id', clientId)
          .neq('id', contactId);
      }

      // Clean up the contact data - convert empty strings to null for optional fields
      const cleanedContactData = {
        ...contactData,
        phone: contactData.phone?.trim() || null,
        title: contactData.title?.trim() || null,
        department: contactData.department?.trim() || null,
        notes: contactData.notes?.trim() || null,
      };

      const { data, error } = await supabase
        .from('contacts')
        .update(cleanedContactData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact',
        variant: 'destructive',
      });
      throw error;
    }
  }, [clientId, toast]);

  // Delete contact
  const deleteContact = useCallback(async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    contacts,
    loading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
};