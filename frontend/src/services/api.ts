import axios from 'axios';
import { isTokenExpired, isTokenAboutToExpire } from '../utils/tokenUtils';

// Get backend URL from environment or use a default
const getBackendUrl = () => {
  // In production, use the deployed backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://your-backend-app.onrender.com';
  }
  // In development, use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:4001';
};

// Function to refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await axios.post(
      `${getBackendUrl()}/api/auth/refresh`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const newToken = response.data.token;
    localStorage.setItem('token', newToken);
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

const api = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    // Removed debug logs for token and Authorization header
    if (token) {
      // Check if token is expired before sending request
      if (isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Return a rejected promise to prevent the request from being sent
        return Promise.reject(new Error('Token expired'));
      }

      // Check if token is about to expire and refresh it
      if (isTokenAboutToExpire(token)) {
        const newToken = await refreshToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        } else {
          // Token refresh failed, return rejected promise
          return Promise.reject(new Error('Token refresh failed'));
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error;
      
      // Try to refresh token if it's an authentication error
      if (errorMessage === 'Token expired' || 
          errorMessage === 'Invalid token' || 
          errorMessage === 'Invalid or expired token' ||
          errorMessage === 'No auth credentials found') {
        
        console.log('[DEBUG] Token authentication failed, attempting refresh');
        const newToken = await refreshToken();
        
        if (!newToken) {
          console.log('[DEBUG] Token refresh failed, logging out');
          // Only redirect if we're not already on the login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } else {
          // Retry the original request with the new token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Create a Boetos Task and sync to Google Calendar
 * @param {Object} task - { title, description, duration, start, category }
 */
export const createBoetosTask = async (task: {
  title: string;
  description?: string;
  duration: number;
  start: string | Date;
  category: string;
}) => {
  const response = await api.post('/api/calendar/boetos-tasks', task);
  return response.data;
};

export const getBoetosTaskHistory = async () => {
  const response = await api.get('/api/calendar/boetos-tasks/history');
  return response.data;
};

export const getBoetosTaskDetails = async (id: string) => {
  const response = await api.get(`/api/calendar/boetos-tasks/${id}`);
  return response.data;
};

export const updateBoetosTaskState = async (id: string, data: { boetos_task_state?: string; timer_state?: any }) => {
  const response = await api.patch(`/api/calendar/boetos-tasks/${id}/state`, data);
  return response.data;
};

export const setBoetosTaskReminder = async (id: string, reminder_time: string) => {
  const response = await api.post(`/api/calendar/boetos-tasks/${id}/reminder`, { reminder_time });
  return response.data;
};

/**
 * Send an 'overwhelmed' prompt to the AI assistant
 */
export const askAiOverwhelmed = async () => {
  const response = await api.post('/api/sidekick/overwhelmed');
  return response.data;
};

/**
 * Chat history API
 */
export const getChatMessages = async (session_id?: string) => {
  const params = session_id ? { session_id } : undefined;
  const response = await api.get('/api/memory/chat', { params });
  return response.data;
};

export const postChatMessage = async (data: { content: string; sender: 'user' | 'assistant'; session_id?: string }) => {
  const response = await api.post('/api/memory/chat', data);
  return response.data;
};

export const deleteChatMessage = async (id: string) => {
  const response = await api.delete(`/api/memory/chat/${id}`);
  return response.data;
};

export const deleteAllChatMessages = async () => {
  const response = await api.delete('/api/memory/chat');
  return response.data;
};

export const getChatSessions = async () => {
  const response = await api.get('/api/memory/chat-sessions');
  return response.data;
};

export default api; 