import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications, Notification } from '../../contexts/NotificationContext';
import { X, Info, AlertTriangle, Check, AlertCircle } from 'lucide-react';

interface NotificationsDropdownProps {
  onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { notifications, markAsRead, clearNotifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: "h-5 w-5 flex-shrink-0" };
    
    switch (type) {
      case 'info':
        return <Info {...iconProps} className="h-5 w-5 flex-shrink-0 text-blue-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-5 w-5 flex-shrink-0 text-amber-500" />;
      case 'success':
        return <Check {...iconProps} className="h-5 w-5 flex-shrink-0 text-green-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="h-5 w-5 flex-shrink-0 text-red-500" />;
      default:
        return <Info {...iconProps} className="h-5 w-5 flex-shrink-0 text-gray-500" />;
    }
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };
  
  return (
    <div 
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-80 max-w-sm rounded-lg shadow-xl ${
        theme === 'dark' 
          ? 'bg-gray-800 text-white border border-gray-700' 
          : 'bg-white text-gray-800 border border-gray-200'
      } ring-1 ring-black ring-opacity-5 z-50 animate-in slide-in-from-top-2 duration-200`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      } flex justify-between items-center`}>
        <h3 className="text-lg font-semibold">Notifications</h3>
        <button 
          onClick={onClose}
          className={`rounded-full p-1.5 transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className={`p-8 text-center ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors ${
                  !notification.isRead 
                    ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {notification.title && (
                      <p className={`font-medium text-sm mb-1 ${
                        !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </p>
                    )}
                    
                    <p className={`text-sm leading-relaxed ${
                      !notification.isRead 
                        ? 'text-gray-800 dark:text-gray-200' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTime(notification.time)}
                      </p>
                      
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > 0 && (
        <div className={`p-3 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button 
            onClick={clearNotifications}
            className={`w-full text-center text-sm py-2 px-3 rounded-md transition-colors ${
              theme === 'dark'
                ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                : 'text-blue-600 hover:text-blue-800 hover:bg-gray-50'
            }`}
          >
            Clear all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;