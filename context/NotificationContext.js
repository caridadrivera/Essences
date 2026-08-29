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

      if (error) {
        console.error('Load notification count error:', error)
        return
      }
      setNotificationCount(count || 0)
    }

    loadUnreadCount()
    const notificationsChannel = supabase
      .channel(`notifications-badge:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, handleNotificationEvent)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.error('Notification realtime channel failed')
      })

    return () => supabase.removeChannel(notificationsChannel)
  }, [user?.id]);

  const handleNotificationEvent = async (payload) => {
    if (payload.eventType === 'INSERT' && payload.new.id) {
      setNotificationCount(prev => prev + 1);
    }
  };

  return (
    <NotificationContext.Provider value={{ notificationCount, setNotificationCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
