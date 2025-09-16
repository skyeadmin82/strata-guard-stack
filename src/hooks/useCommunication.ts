import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Communication and Messaging Hook
export const useCommunication = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, any>>({});

  const sendMessage = useCallback(async (messageData: {
    recipient_id: string;
    subject?: string;
    content: string;
    message_type?: string;
    related_entity_type?: string;
    related_entity_id?: string;
    attachments?: any[];
    read_receipt_requested?: boolean;
  }) => {
    setLoading(true);
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          tenant_id: profile?.tenant_id,
          sender_id: profile?.id,
          sender_type: 'user',
          recipient_id: messageData.recipient_id,
          recipient_type: 'user',
          subject: messageData.subject,
          content: messageData.content,
          message_type: messageData.message_type || 'direct',
          related_entity_type: messageData.related_entity_type,
          related_entity_id: messageData.related_entity_id,
          attachments: messageData.attachments || [],
          read_receipt_requested: messageData.read_receipt_requested || false,
          status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate message delivery with error handling
      setTimeout(async () => {
        try {
          const deliveryResult = await simulateMessageDelivery(message.id);
          
          await supabase
            .from('messages')
            .update({
              status: deliveryResult.success ? 'delivered' : 'failed',
              delivered_at: deliveryResult.success ? new Date().toISOString() : null,
              delivery_errors: deliveryResult.errors || [],
              bounce_reason: deliveryResult.bounceReason,
              bounce_details: deliveryResult.bounceDetails
            })
            .eq('id', message.id);

          setDeliveryStatus(prev => ({
            ...prev,
            [message.id]: deliveryResult
          }));

          if (!deliveryResult.success) {
            toast({
              title: "Message Delivery Failed",
              description: deliveryResult.errors?.[0] || "Message could not be delivered",
              variant: "destructive",
            });
          }
        } catch (deliveryError) {
          console.error('Message delivery simulation failed:', deliveryError);
        }
      }, 1000);

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });

      setMessages(prev => [message, ...prev]);
      return { success: true, message };

    } catch (error: any) {
      console.error('Message sending error:', error);
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('recipient_id', profile?.id);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'read', read_at: new Date().toISOString() }
            : msg
        )
      );

      return { success: true };
    } catch (error: any) {
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }, [profile?.id]);

  const fetchMessages = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(first_name, last_name, email),
          recipient:users!messages_recipient_id_fkey(first_name, last_name, email)
        `)
        .eq('tenant_id', profile?.tenant_id)
        .or(`sender_id.eq.${profile?.id},recipient_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.thread_id) {
        query = query.eq('thread_id', filters.thread_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMessages(data || []);
      return { success: true, messages: data };

    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  return {
    messages,
    loading,
    deliveryStatus,
    sendMessage,
    markAsRead,
    fetchMessages,
  };
};

// Notification Preferences Hook
export const useNotificationPreferences = () => {
  const { profile } = useAuth();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('user_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Create default preferences if none exist
      if (!data) {
        const defaultPrefs = {
          tenant_id: profile?.tenant_id,
          user_id: profile?.id,
          email_enabled: true,
          sms_enabled: false,
          push_enabled: true,
          in_app_enabled: true,
          ticket_updates: { email: true, in_app: true },
          booking_reminders: { email: true, sms: false },
          system_alerts: { email: true, in_app: true },
          promotional: { email: false, sms: false },
          timezone: 'UTC'
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to fetch notification preferences:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const updatePreferences = useCallback(async (updates: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('tenant_id', profile?.tenant_id)
        .eq('user_id', profile?.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });

      return { success: true, preferences: data };
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const validateNotificationSettings = useCallback((settings: any) => {
    const errors: Record<string, string> = {};

    if (settings.quiet_hours_start && settings.quiet_hours_end) {
      const start = new Date(`2000-01-01T${settings.quiet_hours_start}`);
      const end = new Date(`2000-01-01T${settings.quiet_hours_end}`);
      
      if (start >= end) {
        errors.quiet_hours = 'Start time must be before end time';
      }
    }

    if (settings.frequency_limits) {
      Object.entries(settings.frequency_limits).forEach(([type, limit]: [string, any]) => {
        if (typeof limit !== 'number' || limit < 0) {
          errors[`frequency_${type}`] = 'Frequency limit must be a positive number';
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  // Initialize preferences on component mount
  useEffect(() => {
    if (profile?.id) {
      fetchPreferences();
    }
  }, [profile?.id, fetchPreferences]);

  return {
    preferences,
    loading,
    fetchPreferences,
    updatePreferences,
    validateNotificationSettings,
  };
};

// Real-time Chat Hook
export const useRealTimeChat = (roomId: string) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const sendChatMessage = useCallback(async (content: string) => {
    try {
      const message = {
        id: `temp-${Date.now()}`,
        content,
        sender_id: profile?.id,
        sender: profile,
        created_at: new Date().toISOString(),
        status: 'sending'
      };

      setMessages(prev => [...prev, message]);

      // Send to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          tenant_id: profile?.tenant_id,
          sender_id: profile?.id,
          content,
          message_type: 'chat',
          thread_id: roomId,
          status: 'sent'
        })
        .select(`
          *,
          sender:users!messages_sender_id_fkey(first_name, last_name, email)
        `)
        .single();

      if (error) throw error;

      // Replace temporary message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? data : msg
        )
      );

      return { success: true, message: data };
    } catch (error: any) {
      console.error('Chat message error:', error);
      
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === `temp-${Date.now()}` 
            ? { ...msg, status: 'failed', error: error.message }
            : msg
        )
      );

      return { success: false, error: error.message };
    }
  }, [profile, roomId]);

  const handleConnectionRecovery = useCallback(async () => {
    setConnectionStatus('reconnecting');
    
    try {
      // Attempt to reconnect
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, reconnectAttempts)));
      
      // Test connection by fetching recent messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      setConnectionStatus('connected');
      setReconnectAttempts(0);
      
      toast({
        title: "Connection Restored",
        description: "Chat connection has been restored.",
      });

    } catch (error) {
      setReconnectAttempts(prev => prev + 1);
      
      if (reconnectAttempts < 3) {
        setTimeout(handleConnectionRecovery, 2000);
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "Connection Failed",
          description: "Unable to restore chat connection. Please refresh the page.",
          variant: "destructive",
        });
      }
    }
  }, [roomId, reconnectAttempts]);

  // Initialize real-time subscription
  useEffect(() => {
    if (!roomId || !profile?.id) return;

    setConnectionStatus('connecting');

    // Subscribe to new messages in this room
    const messageSubscription = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${roomId}`
        },
        (payload) => {
          const newMessage = payload.new;
          if (newMessage.sender_id !== profile.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
          handleConnectionRecovery();
        }
      });

    // Track user presence
    const presenceChannel = supabase.channel(`presence-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.values(state).flat());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: profile.id,
            user_name: `${profile.first_name} ${profile.last_name}`,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      messageSubscription.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [roomId, profile?.id, handleConnectionRecovery]);

  return {
    messages,
    onlineUsers,
    connectionStatus,
    sendChatMessage,
    handleConnectionRecovery,
  };
};

// Utility function for message delivery simulation
const simulateMessageDelivery = async (messageId: string) => {
  // Simulate various delivery scenarios
  const scenarios = [
    { success: true, probability: 0.85 }, // 85% success rate
    { 
      success: false, 
      probability: 0.10,
      errors: ['Recipient mailbox full'],
      bounceReason: 'mailbox_full'
    },
    { 
      success: false, 
      probability: 0.03,
      errors: ['Invalid email address'],
      bounceReason: 'invalid_address'
    },
    { 
      success: false, 
      probability: 0.02,
      errors: ['Server temporarily unavailable'],
      bounceReason: 'server_error'
    }
  ];

  const random = Math.random();
  let cumulativeProbability = 0;

  for (const scenario of scenarios) {
    cumulativeProbability += scenario.probability;
    if (random <= cumulativeProbability) {
      return {
        success: scenario.success,
        errors: scenario.errors || [],
        bounceReason: scenario.bounceReason,
        bounceDetails: scenario.success ? null : {
          timestamp: new Date().toISOString(),
          retry_count: 0,
          final_failure: false
        }
      };
    }
  }

  return { success: true, errors: [] };
};