import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext'; // Your existing UserContext
import { User, Calendar, Clock, Brain, Heart, Mic, Settings, TrendingUp, AlertTriangle, CheckCircle, Camera, Upload, Save, X, Edit, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import TabButton from '../components/common/TabButton';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { DailySurvey } from '../components/survey/DailySurvey';
import api from '../services/api';

// Define types
interface ProfileData {
  name: string;
  email: string;
  role: string;
  company: string;
  bio: string;
  onboardingCompleted?: boolean;
}

// Extend the User type to include onboardingCompleted
interface ExtendedUser {
  name?: string;
  email?: string;
  profileImage?: string;
  onboardingCompleted?: boolean;
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
  dailySurvey?: {
    date: string;
    stressLevel: number;
    productivity: number;
    mood: string;
    notes: string;
  };
}

const ROLE_OPTIONS = [
  'Engineer',
  'Designer',
  'Manager',
  'Product Owner',
  'HR',
  'Sales',
  'Marketing',
  'Student',
  'Other',
];

const Profile: React.FC = () => {
  const { user, updateUser } = useUser(); // Assuming updateUser function exists in context
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state with default values
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    role: '',
    company: '',
    bio: '',
    onboardingCompleted: (user as ExtendedUser)?.onboardingCompleted || false
  });

  const [boetosData, setBoetosData] = useState<BoetosData>({
    productivityScore: 0,
    burnoutRisk: 'Unknown',
    stressLevel: 0,
    workPatterns: {
      avgMeetingsPerDay: 0,
      avgWorkHours: 0,
      lateNightSessions: 0,
      focusTimeBlocks: 0
    },
    weeklyInsights: []
  });

  useEffect(() => {
    const fetchBoetosData = async () => {
      try {
        const response = await api.get('/api/boetos/data');
        setBoetosData(response.data);
      } catch (error) {
        console.error('Error fetching Boetos data:', error);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/api/user/profile');
        const userData = response.data;
        
        // Update the profile data with fetched user data
        setProfileData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || '',
          company: userData.company || '',
          bio: userData.bio || '',
          onboardingCompleted: userData.onboardingCompleted || false
        }));
        
        // Update profile image if available
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user?.email) {
      fetchBoetosData();
      fetchUserProfile();
    }
  }, [user?.email]);

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
      const updatedProfile = {
        ...profileData,
        profileImage
      };

      await api.put('/api/user/profile', updatedProfile);
      
      if (updateUser) {
        updateUser(updatedProfile);
      }
      
      setIsEditing(false); // Exit editing mode on save
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

  const ProfileInput = ({ label, value, field, editing }: { label: string, value: string, field: keyof ProfileData, editing: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      {editing ? (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full mt-1 p-3 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
        />
      ) : (
        <p className="text-slate-900 dark:text-slate-100 text-base mt-1">{value || 'Not set'}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name?.charAt(0)}</span>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700"
            title="Upload new picture"
          >
              <Camera className="h-4 w-4" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        </div>
        <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{profileData.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">{profileData.email}</p>
            <p className="text-slate-700 dark:text-slate-300 mt-2">{profileData.role && `Role: ${profileData.role}`}{profileData.company && ` at ${profileData.company}`}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center gap-2 text-slate-700 dark:text-slate-300"
          >
            {isEditing ? <EyeOff className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          {isEditing && (
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center gap-2 disabled:opacity-50 text-white"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Profile Details */}
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl mt-8">
          <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-100">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ProfileInput label="Full Name" value={profileData.name} field="name" editing={isEditing} />
          <ProfileInput label="Email Address" value={profileData.email} field="email" editing={isEditing} />
          {isEditing ? (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Role</label>
              <select
                className="w-full mt-1 p-3 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                value={ROLE_OPTIONS.includes(profileData.role) ? profileData.role : 'Other'}
                onChange={e => {
                  const value = e.target.value;
                  if (value === 'Other') {
                    handleInputChange('role', '');
                  } else {
                    handleInputChange('role', value);
                  }
                }}
              >
                <option value="" disabled>Select your role</option>
                {ROLE_OPTIONS.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {(!ROLE_OPTIONS.includes(profileData.role) || profileData.role === '') && (
                <input
                  type="text"
                  className="w-full mt-2 p-3 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  placeholder="Enter your role"
                  value={profileData.role}
                  onChange={e => handleInputChange('role', e.target.value)}
                />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Role</label>
              <p className="text-slate-900 dark:text-slate-100 text-base mt-1">{profileData.role || 'Not set'}</p>
            </div>
          )}
          <ProfileInput label="Company / Institution" value={profileData.company} field="company" editing={isEditing} />
          <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Bio</label>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-100/50 dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                rows={4}
              />
            ) : (
                <p className="text-slate-900 dark:text-slate-100 text-base mt-1 whitespace-pre-wrap">{profileData.bio || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Boetos Data */}
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-6 rounded-2xl mt-8">
          <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-100">Your Boetos Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">Productivity Score</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{boetosData.productivityScore}%</p>
            </div>
            <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">Burnout Risk</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{boetosData.burnoutRisk}</p>
          </div>
            <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Work Hours</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{boetosData.workPatterns.avgWorkHours.toFixed(1)}</p>
          </div>
            <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Meetings/Day</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{boetosData.workPatterns.avgMeetingsPerDay.toFixed(1)}</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;