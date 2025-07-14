import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load from localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Load notifications from localStorage
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('user');
    localStorage.removeItem('notifications');
  };

  // Utility function to add new notifications
  const addNotification = (title, message, type = 'info') => {
    const newNotification = {
      id: Date.now() + Math.random(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      notifications, 
      setNotifications, 
      addNotification 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
