import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Calendar, Mic, LogOut, User, Key, Shield, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useUser();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
  });

  const [voiceSettings, setVoiceSettings] = useState({
    voiceCommands: true,
    wakeWord: true,
    voiceLanguage: 'en-US',
    voiceGender: 'female',
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
  const [newHour, setNewHour] = useState('08');
  const [newMinute, setNewMinute] = useState('00');

  const newTime = `${newHour}:${newMinute}`;

  // Load settings from backend on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load voice settings
        const voiceResponse = await api.get('/api/voice/settings');
        setVoiceSettings(prev => ({
          ...prev,
          voiceCommands: voiceResponse.data.voiceEnabled || false,
          voiceLanguage: voiceResponse.data.voiceLanguage || 'en-US',
          voiceGender: voiceResponse.data.voiceGender || 'female',
          voiceSpeed: voiceResponse.data.voiceSpeed || 1.0,
          voicePitch: voiceResponse.data.voicePitch || 1.0,
          voiceVolume: voiceResponse.data.voiceVolume || 1.0,
        }));

        // Load user preferences
        const preferencesResponse = await api.get('/api/user/preferences');
        if (preferencesResponse.data.notifications) {
          setNotifications(preferencesResponse.data.notifications);
        }
        if (preferencesResponse.data.notificationTimes) {
          setNotificationTimes(preferencesResponse.data.notificationTimes);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Call logout function from context
      if (logout) {
        logout();
      }
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
      navigate('/login');
    }
  };

  const handleNotificationChange = async (type: keyof typeof notifications) => {
    const newValue = !notifications[type];
    setNotifications(prev => ({
      ...prev,
      [type]: newValue
    }));

    try {
      await api.put('/api/user/preferences', {
        notifications: {
          ...notifications,
          [type]: newValue
        }
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // Revert the change if API call fails
      setNotifications(prev => ({
        ...prev,
        [type]: !newValue
    }));
    }
  };

  const handleVoiceSettingChange = async (type: keyof typeof voiceSettings, value?: any) => {
    let newValue;
    if (typeof value !== 'undefined') {
      newValue = value;
    } else {
      newValue = !voiceSettings[type];
    }
    setVoiceSettings(prev => ({
      ...prev,
      [type]: newValue
    }));

    try {
      if (type === 'voiceCommands') {
        await api.put('/api/voice/settings', {
          voiceEnabled: newValue
        });
      } else if ([
        'voiceLanguage',
        'voiceGender',
        'voiceSpeed',
        'voicePitch',
        'voiceVolume'
      ].includes(type)) {
        await api.put('/api/voice/settings', {
          [type]: newValue
        });
      }
      // TODO: Add wake word setting when backend supports it
    } catch (error) {
      console.error('Error updating voice settings:', error);
      // Revert the change if API call fails
      setVoiceSettings(prev => ({
        ...prev,
        [type]: type === 'voiceCommands' ? !newValue : voiceSettings[type]
      }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setIsChangingPassword(true);

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setIsChangingPassword(false);
      return;
    }

    try {
      await api.put('/api/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Show success message
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCalendarConnect = () => {
    // TODO: Implement Google Calendar OAuth flow
    alert('Google Calendar integration will be implemented in a future update');
  };

  const handleAddNotificationTime = async () => {
    if (!notificationTimes.includes(newTime)) {
      const updatedTimes = [...notificationTimes, newTime].sort();
      setNotificationTimes(updatedTimes);
      try {
        await api.put('/api/user/preferences', { notificationTimes: updatedTimes });
      } catch (error) {
        console.error('Error saving notification times:', error);
      }
    }
  };

  const handleRemoveNotificationTime = async (time: string) => {
    const updatedTimes = notificationTimes.filter(t => t !== time);
    setNotificationTimes(updatedTimes);
    try {
      await api.put('/api/user/preferences', { notificationTimes: updatedTimes });
    } catch (error) {
      console.error('Error saving notification times:', error);
    }
  };

  // Custom toggle component
  const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string, description?: string }> = ({ 
    checked, 
    onChange, 
    label,
    description
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-300/50 dark:border-slate-700/50 last:border-b-0">
      <div>
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {description && <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 ${
          checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
  
  const SettingsCard: React.FC<{ icon: React.ElementType, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-3 text-slate-900 dark:text-slate-100">
        <Icon className="h-5 w-5 text-blue-400" />
        {title}
      </h2>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <SettingsCard icon={User} title="Appearance">
            <div className="flex items-center justify-between py-4">
                <span className="font-medium text-slate-700 dark:text-slate-200">Theme</span>
              <div className="flex items-center gap-2">
                  <button onClick={() => theme !== 'light' && toggleTheme()} className={`p-2 rounded-lg ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}>
                  <Sun className="h-5 w-5" />
                </button>
                  <button onClick={() => theme !== 'dark' && toggleTheme()} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}>
                  <Moon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard icon={Bell} title="Notifications">
            <Toggle
              checked={notifications.email}
              onChange={() => handleNotificationChange('email')}
              label="Email Notifications"
              description="Get important notifications delivered to your inbox."
            />
            <Toggle
              checked={notifications.push}
              onChange={() => handleNotificationChange('push')}
              label="Push Notifications"
              description="Receive real-time alerts on your devices."
            />
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Preferred Notification Times</label>
              <div className="flex gap-2 mb-2">
                <select
                  value={newHour}
                  onChange={e => setNewHour(e.target.value)}
                  className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {[...Array(24).keys()].map(h => (
                    <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="self-center">:</span>
                <select
                  value={newMinute}
                  onChange={e => setNewMinute(e.target.value)}
                  className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {[...Array(60).keys()].map(m => (
                    <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddNotificationTime}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Add Time
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {notificationTimes.length === 0 && <span className="text-slate-400">No times set.</span>}
                {notificationTimes.map(time => (
                  <span key={time} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full">
                    {time}
                    <button onClick={() => handleRemoveNotificationTime(time)} className="ml-1 text-red-500 hover:text-red-700">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard icon={Mic} title="Voice Assistant">
            <Toggle
              checked={voiceSettings.voiceCommands}
              onChange={() => handleVoiceSettingChange('voiceCommands')}
              label="Enable Voice Commands"
              description="Allow voice control of the application."
            />
            <Toggle
              checked={voiceSettings.wakeWord}
              onChange={() => handleVoiceSettingChange('wakeWord')}
              label="Enable Wake Word"
              description="Activate voice assistant with wake word."
            />
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Language</label>
                <select
                  value={voiceSettings.voiceLanguage}
                  onChange={e => handleVoiceSettingChange('voiceLanguage', e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="zh-CN">Chinese</option>
                  {/* Add more as needed */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Gender</label>
                <select
                  value={voiceSettings.voiceGender}
                  onChange={e => handleVoiceSettingChange('voiceGender', e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Speed: {voiceSettings.voiceSpeed}</label>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={voiceSettings.voiceSpeed}
                  onChange={e => handleVoiceSettingChange('voiceSpeed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Pitch: {voiceSettings.voicePitch}</label>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={voiceSettings.voicePitch}
                  onChange={e => handleVoiceSettingChange('voicePitch', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Volume: {voiceSettings.voiceVolume}</label>
                <input
                  type="range"
                  min={0.0}
                  max={2.0}
                  step={0.05}
                  value={voiceSettings.voiceVolume}
                  onChange={e => handleVoiceSettingChange('voiceVolume', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <SettingsCard icon={Shield} title="Security">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full px-4 py-2 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300"
              >
              <Key className="h-4 w-4" /> Change Password
            </button>
          </SettingsCard>

            <div className="bg-red-100/50 dark:bg-red-900/20 backdrop-blur-sm border border-red-300/50 dark:border-red-500/30 p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <LogOut className="h-5 w-5" />
              Account Actions
            </h2>
            <button
              onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600/80 hover:bg-red-600 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Change Password</h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full p-3 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-slate-100 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full p-3 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-slate-100 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full p-3 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-slate-100 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <p className="text-red-600 dark:text-red-400 text-sm">{passwordError}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 font-semibold rounded-lg transition-all duration-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg transition-all duration-300 text-white disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;