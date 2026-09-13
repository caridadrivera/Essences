import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const { user } = useAuth();


  useEffect(() => {
    if (!user?.id) {
      setNotificationCount(0)
      return
    }

    const loadUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('receiverId', user.id)
        .eq('isRead', false)

      if (error) {
        console.error('Load notification count error:', error)
        return
      }
      setNotificationCount(count || 0)
    }

    loadUnreadCount()
    const notificationsChannel = supabase
      .channel(`notifications-badge:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload?.new?.receiverId === user.id) {
          setNotificationCount((currentCount) => currentCount + 1)
        }
      })
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') loadUnreadCount()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Notification realtime channel failed:', error)
        }
      })

    const unreadCountRefresh = setInterval(loadUnreadCount, 15000)

    return () => {
      clearInterval(unreadCountRefresh)
      supabase.removeChannel(notificationsChannel)
    }
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{ notificationCount, setNotificationCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
