import React, { useState } from 'react';
import { Moon, Sun, Bell, Calendar, Mic, LogOut, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sound: true
  });

  const [voiceSettings, setVoiceSettings] = useState({
    voiceCommands: true,
    wakeWord: true
  });

  const handleLogout = () => {
    alert('Logout functionality - would navigate to login page');
  };

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleVoiceSettingChange = (type: keyof typeof voiceSettings) => {
    setVoiceSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleCalendarConnect = () => {
    alert('Calendar integration would connect to Google Calendar API');
  };

  // Custom toggle component
  const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ 
    checked, 
    onChange, 
    label 
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
        {label}
      </span>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
        } ${
          checked ? 'bg-blue-600' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-xl shadow-lg p-4 sm:p-8 transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h1 className={`text-xl sm:text-2xl font-bold mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
              Settings
            </h1>

            {/* Theme Settings */}
            <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h2 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Appearance
              </h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Theme Mode</span>
                  <span className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    theme === 'dark' 
                      ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" />
                      <span className="hidden xs:inline">Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      <span className="hidden xs:inline">Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h2 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                <Bell className="h-4 w-4" />
                Notifications
              </h2>
              <div className="space-y-2">
                <Toggle
                  checked={notifications.email}
                  onChange={() => handleNotificationChange('email')}
                  label="Email Notifications"
                />
                <Toggle
                  checked={notifications.push}
                  onChange={() => handleNotificationChange('push')}
                  label="Push Notifications"
                />
                <Toggle
                  checked={notifications.sound}
                  onChange={() => handleNotificationChange('sound')}
                  label="Sound Alerts"
                />
              </div>
            </div>

            {/* Calendar Integration */}
            <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h2 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                <Calendar className="h-4 w-4" />
                Calendar Integration
              </h2>
              <button 
                onClick={handleCalendarConnect}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium w-full sm:w-auto justify-center"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden xs:inline">Connect Google Calendar</span>
                <span className="inline xs:hidden">Connect</span>
              </button>
            </div>

            {/* Voice Assistant Settings */}
            <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h2 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                <Mic className="h-4 w-4" />
                Voice Assistant
              </h2>
              <div className="space-y-2">
                <Toggle
                  checked={voiceSettings.voiceCommands}
                  onChange={() => handleVoiceSettingChange('voiceCommands')}
                  label="Voice Commands"
                />
                <Toggle
                  checked={voiceSettings.wakeWord}
                  onChange={() => handleVoiceSettingChange('wakeWord')}
                  label="Wake Word Detection"
                />
              </div>
            </div>

            {/* Account Section */}
            <div className={`pt-6 sm:pt-8 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}> 
              <h2 className={`text-base sm:text-lg font-semibold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}> 
                Account
              </h2>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
                } w-full sm:w-auto justify-center`}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xs:inline">Sign Out</span>
                <span className="inline xs:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;