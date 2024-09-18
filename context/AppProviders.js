import React from 'react';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';

const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppProviders;
