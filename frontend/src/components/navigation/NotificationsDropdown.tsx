import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Clock, MessageSquare, Calendar, Brain, Zap } from 'lucide-react';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useUser } from '../../contexts/UserContext';
import api from '../../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  data?: {
    memoryId?: string;
    taskId?: string;
    taskTitle?: string;
    hoursSinceCreation?: number;
    streak?: number;
    burnoutRisk?: number;
  };
  read: boolean;
  created_at: string;
}

const NotificationsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { hasNewNotifications, setHasNewNotifications } = useNotificationContext();

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedNotifications = response.data.notifications || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.read).length);
      setHasNewNotifications(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await api.patch(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await api.patch('/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle notification action
  const handleNotificationAction = async (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'memory-reminder':
        // Navigate to memory area with the specific memory
        window.location.href = `/memory?highlight=${notification.data?.memoryId}`;
        break;
      case 'boetos-reminder':
        // Navigate to calendar with the specific task
        window.location.href = `/calendar?task=${notification.data?.taskId}`;
        break;
      case 'daily-motivation':
        // Navigate to dashboard
        window.location.href = '/dashboard';
        break;
      case 'burnout-alert':
        // Navigate to burnout tracker
        window.location.href = '/burnout';
        break;
      default:
        // Default action - just close dropdown
        setIsOpen(false);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'memory-reminder':
        return <Brain className="w-4 h-4 text-blue-500" />;
      case 'boetos-reminder':
        return <Clock className="w-4 h-4 text-green-500" />;
      case 'daily-motivation':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'burnout-alert':
        return <MessageSquare className="w-4 h-4 text-red-500" />;
      case 'meeting-reminder':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get notification time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications when dropdown opens or when there are new notifications
  useEffect(() => {
    if (isOpen || hasNewNotifications) {
      fetchNotifications();
    }
  }, [isOpen, hasNewNotifications]);

  // Auto-refresh notifications every 30 seconds when dropdown is open
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Bulk delete selected notifications
  const deleteSelected = async () => {
    if (selected.length === 0) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.delete('/notifications/bulk', {
        data: { ids: selected },
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => !selected.includes(n.id)));
      setSelected([]);
      setUnreadCount(prev => {
        const deletedUnreadCount = notifications
          .filter(n => selected.includes(n.id) && !n.read)
          .length;
        return Math.max(0, prev - deletedUnreadCount);
      });
    } catch (error) {
      console.error('Failed to delete selected notifications:', error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await api.delete('/notifications/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setSelected([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {hasNewNotifications && unreadCount === 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-800"
                title="Clear all notifications"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bulk Delete Button */}
          {selected.length > 0 && (
            <div className="px-4 py-2 bg-yellow-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-700">{selected.length} selected</span>
              <button
                onClick={deleteSelected}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete Selected
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">We'll notify you about important updates</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-start space-x-3 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(notification.id)}
                      onChange={e => {
                        setSelected(sel =>
                          e.target.checked
                            ? [...sel, notification.id]
                            : sel.filter(id => id !== notification.id)
                        );
                      }}
                      className="mt-1 mr-2"
                      onClick={e => e.stopPropagation()}
                    />
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => handleNotificationAction(notification)}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">{getTimeAgo(notification.created_at)}</span>
                          {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{notification.message}</p>
                      {notification.data && (
                        <div className="mt-2 text-xs text-gray-500">
                          {notification.type === 'memory-reminder' && <span>💭 Memory from {notification.data.hoursSinceCreation}h ago</span>}
                          {notification.type === 'boetos-reminder' && <span>⏰ Task: {notification.data.taskTitle}</span>}
                          {notification.type === 'daily-motivation' && <span>🔥 {notification.data.streak}-day streak • Burnout: {notification.data.burnoutRisk}%</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => window.location.href = '/notifications'}
                className="w-full text-sm text-blue-600 hover:text-blue-800 text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;