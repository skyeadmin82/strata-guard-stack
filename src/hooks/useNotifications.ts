import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata: any;
  expires_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (filters: {
    read?: boolean;
    type?: string;
    category?: string;
    limit?: number;
  } = {}) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.read !== undefined) {
        if (filters.read) {
          query = query.not('read_at', 'is', null);
        } else {
          query = query.is('read_at', null);
        }
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.now()');

      const { data, error } = await query;

      if (error) throw error;

      setNotifications((data || []) as Notification[]);
      
      // Count unread notifications
      const unread = (data || []).filter(n => !n.read_at).length;
      setUnreadCount(unread);

    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .or(`user_id.is.null,user_id.eq.${profile.id}`)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );

      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });

    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [profile?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (error: any) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  const createNotification = useCallback(async (notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    category?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    user_id?: string;
    action_url?: string;
    action_label?: string;
    metadata?: any;
    expires_at?: string;
  }) => {
    if (!profile?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          tenant_id: profile.tenant_id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          category: notification.category || 'general',
          priority: notification.priority || 'normal',
          user_id: notification.user_id,
          action_url: notification.action_url,
          action_label: notification.action_label,
          metadata: notification.metadata || {},
          expires_at: notification.expires_at,
        });

      if (error) throw error;

      // Refresh notifications to show the new one
      fetchNotifications();

    } catch (error: any) {
      console.error('Failed to create notification:', error);
    }
  }, [fetchNotifications, profile?.tenant_id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.read_at) {
            setUnreadCount(prev => prev + 1);
          }

          // Show toast for important notifications
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'error' ? 'destructive' : 'default',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        }
      )
      .subscribe();

    // Initial fetch
    fetchNotifications();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  };
};