import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const { user } = useAuth();


  useEffect(() => {
    if (user?.id) {
      let notificationsChannel = supabase
        .channel('notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, handleNotificationEvent)
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsChannel);
      };
    }
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
