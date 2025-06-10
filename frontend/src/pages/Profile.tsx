import React, { useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext'; // Your existing UserContext
import { User, Calendar, Clock, Brain, Heart, Mic, Settings, TrendingUp, AlertTriangle, CheckCircle, Camera, Upload, Save, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import TabButton from '../components/common/TabButton.tsx';

// Define types
interface ProfileData {
  name: string;
  email: string;
  role: string;
  company: string;
  bio: string;
}

interface BoetosData {
  productivityScore: number;
  burnoutRisk: string;
  stressLevel: number;
  workPatterns: {
    avgMeetingsPerDay: number;
    avgWorkHours: number;
    lateNightSessions: number;
    focusTimeBlocks: number;
  };
  weeklyInsights: Array<{
    day: string;
    productivity: number;
    meetings: number;
  }>;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useUser(); // Assuming updateUser function exists in context
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state with default values
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    role: '',
    company: '',
    bio: ''
  });

  const [boetosData, setBoetosData] = useState<BoetosData>({
    productivityScore: 85,
    burnoutRisk: 'Low',
    stressLevel: 65,
    workPatterns: {
      avgMeetingsPerDay: 4,
      avgWorkHours: 8.5,
      lateNightSessions: 2,
      focusTimeBlocks: 3
    },
    weeklyInsights: [
      { day: 'Mon', productivity: 85, meetings: 45 },
      { day: 'Tue', productivity: 75, meetings: 60 },
      { day: 'Wed', productivity: 90, meetings: 30 },
      { day: 'Thu', productivity: 80, meetings: 90 },
      { day: 'Fri', productivity: 70, meetings: 45 }
    ]
  });

  const handleVoiceCommand = () => {
    setIsListening(!isListening);
    // Voice command simulation
    setTimeout(() => setIsListening(false), 3000);
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        setShowImageModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setShowImageModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulate API call - replace with your actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedProfile = {
        ...profileData,
        profileImage
      };

      // Update user context (assuming updateUser function exists)
      if (updateUser) {
        updateUser(updatedProfile);
      }
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const StressThermometerComponent = ({ level }: { level: number }) => {
    const getColor = (level: number) => {
      if (level < 30) return 'bg-green-500';
      if (level < 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="relative w-8 h-32 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`absolute bottom-0 w-full transition-all duration-1000 ${getColor(level)}`}
          style={{ height: `${level}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
          {level}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header with Boetos Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 w-full">
              {/* Enhanced Profile Picture with Upload */}
              <div className="relative group flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profileData.name?.charAt(0) || 'U'
                  )}
                </div>
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white transition-all group-hover:scale-110"
                >
                  <Camera size={14} />
                </button>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-start w-full min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white break-words w-full text-center sm:text-left">
                  {profileData.name || 'User Name'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 break-all w-full text-center sm:text-left">
                  {profileData.email || 'user@example.com'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 w-full text-center sm:text-left">
                  Boetos Guardian since March 2024
                </p>
              </div>
            </div>

            {/* Voice Control Button */}
            <button
              onClick={handleVoiceCommand}
              className={`p-4 rounded-full transition-all duration-300 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              }`}
            >
              <Mic size={24} />
            </button>
          </div>

          {/* Boetos Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Productivity Score</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">{boetosData.productivityScore}%</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Burnout Risk</p>
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{boetosData.burnoutRisk}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Avg Meetings/Day</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{boetosData.workPatterns.avgMeetingsPerDay}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-600 dark:text-purple-400" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Focus Time/Day</p>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{boetosData.workPatterns.focusTimeBlocks}h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <TabButton id="profile" label="Profile" icon={User} active={activeTab === 'profile'} onClick={setActiveTab} />
          <TabButton id="overview" label="Overview" icon={TrendingUp} active={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="patterns" label="Work Patterns" icon={Brain} active={activeTab === 'patterns'} onClick={setActiveTab} />
          <TabButton id="wellness" label="Wellness" icon={Heart} active={activeTab === 'wellness'} onClick={setActiveTab} />
          <TabButton id="settings" label="Settings" icon={Settings} active={activeTab === 'settings'} onClick={setActiveTab} />
        </div>

        {/* Enhanced Profile Tab with Save Functionality */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Profile Information
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Changes are saved automatically
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role/Title
                  </label>
                  <input
                    type="text"
                    value={profileData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="e.g., Startup Founder, CEO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white transition-all"
                  rows={4}
                  placeholder="Tell us about yourself and your entrepreneurial journey..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {profileData.bio.length}/500 characters
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Rest of your existing tabs remain the same */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stress Level Monitor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20} />
                Current Stress Level
              </h3>
              <div className="flex items-center gap-6">
                <StressThermometerComponent level={boetosData.stressLevel} />
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{boetosData.stressLevel}%</p>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Above your healthy baseline of 45%</p>
                  <div className="bg-orange-50 dark:bg-orange-900 border-l-4 border-orange-500 p-3 rounded">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      <strong>Guardian's Suggestion:</strong> You've had 6 back-to-back meetings today. 
                      Consider taking a 15-minute break before your next call.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Overview Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={20} />
                Weekly Performance
              </h3>
              <div className="space-y-3">
                {boetosData.weeklyInsights.map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 text-sm font-medium text-gray-600 dark:text-gray-300">{day.day}</div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                        style={{ width: `${day.productivity}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 w-12">{day.productivity}%</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{day.meetings}m</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Work Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <Brain className="text-purple-500" size={20} />
              Work Pattern Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Meeting Density</h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300 mb-1">{boetosData.workPatterns.avgMeetingsPerDay}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">meetings per day</p>
                <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                  ↑ 15% from last month
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900 p-4 rounded-xl">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Work Hours</h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-300 mb-1">{boetosData.workPatterns.avgWorkHours}h</p>
                <p className="text-sm text-red-700 dark:text-red-300">average daily</p>
                <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                  ⚠ Above recommended 9h
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-xl">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Late Night Sessions</h4>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 mb-1">{boetosData.workPatterns.lateNightSessions}</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">times this week</p>
                <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                  Past 10 PM work detected
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 p-6 rounded-xl">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">AI Insights & Recommendations</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 mt-1" size={16} />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Your productivity peaks between 9-11 AM. Consider scheduling important tasks during this window.</p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-orange-500 mt-1" size={16} />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Meeting fatigue detected on Thursdays. Try to limit back-to-back meetings.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Brain className="text-blue-500 mt-1" size={16} />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Your focus time is fragmented. Blocking 2-hour chunks could improve deep work quality.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wellness Tab */}
        {activeTab === 'wellness' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <Heart className="text-red-500" size={20} />
              Mental Health & Wellness
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Burnout Prevention</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                    <span className="text-sm text-green-800 dark:text-green-200">Break Frequency</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">Good</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">Sleep Schedule</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">Needs Attention</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                    <span className="text-sm text-red-800 dark:text-red-200">Work-Life Balance</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">At Risk</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Guardian Interventions</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Today:</strong> Suggested 3 micro-breaks, blocked 1 hour focus time
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <strong>This Week:</strong> Protected 2 evenings, rescheduled conflicting meetings
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Impact:</strong> 23% reduction in reported stress levels
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <StressThermometerComponent level={boetosData.stressLevel} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="text-gray-500" size={20} />
              Boetos Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voice Commands Language
                </label>
                <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stress Level Threshold
                </label>
                <input 
                  type="range" 
                  min="30" 
                  max="80" 
                  defaultValue="60"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;