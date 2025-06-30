import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { Bell, Menu, X, Moon, Sun, Mic } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import VoiceCommandIndicator from '../voice/VoiceCommandIndicator';

interface NavbarProps {
  onMenuToggle?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const { unreadCount } = useNotificationContext();
  const [isListening, setIsListening] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const toggleVoiceRecognition = () => {
    setIsListening(!isListening);
  };

  return (
    <>
      <nav className={`fixed w-full top-0 z-50 ${
        theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'
      } border-b shadow-sm transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center gap-4">
              {onMenuToggle && (
                <button 
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" 
                  onClick={onMenuToggle}
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              
              {/* Logo - visible on mobile when sidebar is closed */}
              <div className="flex items-center lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">Boetos</span>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Voice Command Button */}
              <button 
                onClick={toggleVoiceRecognition}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 scale-110' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                aria-label="Toggle voice commands"
                title="Voice Commands"
              >
                <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
              </button>
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200 relative"
                  aria-label="Open notifications"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {notificationsOpen && (
                  <NotificationsDropdown 
                    onClose={() => setNotificationsOpen(false)} 
                  />
                )}
              </div>
              
              {/* User Avatar */}
              {user && (
                <div className="flex items-center ml-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Voice Command Indicator */}
      {isListening && (
        <VoiceCommandIndicator onClose={() => setIsListening(false)} />
      )}
    </>
  );
};

export default Navbar;