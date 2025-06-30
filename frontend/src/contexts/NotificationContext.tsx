import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';
import api from '../services/api';
import { toast, Toaster } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: NotificationType;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

interface NotificationContextType {
  // Existing notification context
  hasNewNotifications: boolean;
  setHasNewNotifications: (hasNew: boolean) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshNotifications: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Toast notifications
  showToast: (message: string, options?: ToastOptions) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Toast notification functions
  const showToast = (message: string, options: ToastOptions = {}) => {
    const { type = 'info', duration = 5000 } = options;
    
    const toastOptions = { duration };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'info':
      default:
        toast(message, toastOptions);
        break;
    }
  };

  const showSuccess = (message: string) => showToast(message, { type: 'success' });
  const showError = (message: string) => showToast(message, { type: 'error' });
  const showInfo = (message: string) => showToast(message, { type: 'info' });
  const showWarning = (message: string) => showToast(message, { type: 'warning' });
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch initial unread count
  const fetchUnreadCount = async () => {
    const token = getToken();
    if (!token || !user) return;
    
    try {
      const response = await api.get('/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const token = getToken();
    if (!token || !user) return;
    
    try {
      await api.patch(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const token = getToken();
    if (!token || !user) return;
    
    try {
      await api.patch('/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    fetchUnreadCount();
    setHasNewNotifications(false);
  };

  // Set up polling for new notifications
  useEffect(() => {
    const token = getToken();
    if (!token || !user) return;

    // Fetch initial count
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Set up WebSocket connection for real-time notifications (if available)
  useEffect(() => {
    const token = getToken();
    if (!token || !user) return;

    // For now, we'll use polling. In the future, you can implement WebSocket here
    // const ws = new WebSocket(`ws://localhost:3001/notifications?token=${token}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'new_notification') {
    //     setHasNewNotifications(true);
    //     setUnreadCount(prev => prev + 1);
    //   }
    // };
    // return () => ws.close();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        hasNewNotifications,
        setHasNewNotifications,
        unreadCount,
        setUnreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <Toaster position="top-right" richColors />
    </NotificationContext.Provider>
  );
};