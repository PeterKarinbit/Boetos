import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import api from '../services/api';
import { isTokenExpired } from '../utils/tokenUtils';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;  
  avatar: string;
  emailVerified?: boolean;
  preferences: {
    notificationsEnabled: boolean;
    voiceCommandsEnabled: boolean;
    burnoutPreventionEnabled: boolean;
    focusHours: {
      start: number;
      end: number;
    };
  };
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string>;
  updateUser: (updates: Partial<User>) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Check if token is expired before making API call
        if (isTokenExpired(token)) {
          console.log('Token expired during session validation');
          localStorage.removeItem('token');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, ...userData } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Fetch user data with the new token
      const userResponse = await api.get('/api/auth/me');
      const user = userResponse.data;
      setUser(user);

      // Check if daily survey is completed
      const surveyResponse = await api.get('/api/mental-health/status');
      if (!surveyResponse.data.completedToday) {
        // Store flag in localStorage to show survey
        localStorage.setItem('showDailySurvey', 'true');
      }
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('token');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token to refresh');
      }

      const response = await api.post('/api/auth/refresh');
      const { token: newToken, ...userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setUser(userData);
      
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      return updatedUser;
    });
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    refreshToken,
    updateUser,
    setUser,
  }), [user, isLoading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};