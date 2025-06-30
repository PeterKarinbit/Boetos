import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import VoiceAssistant from './pages/VoiceAssistant';
import BurnoutTracker from './pages/BurnoutTracker';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import VerifyEmailSuccess from './pages/VerifyEmailSuccess';
import VerifyEmailError from './pages/VerifyEmailError';
import ResendVerification from './pages/ResendVerification';
import { UserProvider, useUser } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TimerProvider } from './contexts/TimerContext';
import LoadingScreen from './components/common/LoadingScreen';
import { ProtectedRoute } from './components/ProtectedRoute';
import Sidebar from './components/navigation/Sidebar';
import { Menu } from 'lucide-react';
import api from './services/api'; // <-- IMPORT THE API SERVICE
import BoetosTaskTimer from './components/common/BoetosTaskTimer';
import { FocusModeProvider, useFocusMode } from './contexts/FocusModeContext';
import FocusPopup from './components/common/FocusPopup';
import OneSignal from 'react-onesignal';

// Types for better type safety
interface AppState {
  isLoading: boolean;
  isSidebarOpen: boolean;
  isDarkMode: boolean;
}

// Constants
const LOADING_TIMEOUT = 2000;
const GOOGLE_API_URL = 'https://apis.google.com/js/api.js';
const THEME_STORAGE_KEY = 'theme';
const SIDEBAR_STORAGE_KEY = 'sidebarOpen';
const IDLE_TIMEOUT_MINUTES = 5; // Define idle timeout
const ACTIVITY_REPORT_INTERVAL_SECONDS = 60; // How often to report activity
const ONESIGNAL_APP_ID = '36ea6058-6843-4080-b67d-811dc96c1783';

function App() {
  console.log('App component rendered');
  const location = useLocation();
  const { user, isLoading } = useUser();

  // Initialize state with proper type safety and local storage recovery
  const [appState, setAppState] = useState<AppState>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const savedSidebarState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return {
      isLoading: true,
      isSidebarOpen: savedSidebarState ? JSON.parse(savedSidebarState) : true,
      isDarkMode: savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    };
  });

  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());

  // Function to send activity to backend
  const sendActivity = useCallback(async (type: string, details?: any) => {
    if (!user?.id) {
      // console.warn('Cannot log activity: User not authenticated.'); // Uncomment for debugging
      return;
    }
    try {
      await api.post('/activity', {
        type: type,
        description: `User activity: ${type}`,
        metadata: details,
      });
      // console.log('Activity sent:', type); // Uncomment for debugging
    } catch (error) {
      console.error('Failed to send activity:', error);
    }
  }, [user]); // Depend on user to ensure userId is up-to-date

  // Memoized values for performance
  const themeClass = useMemo(() => appState.isDarkMode ? 'dark' : 'light', [appState.isDarkMode]);

  // Optimized theme toggle function
  const toggleTheme = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      isDarkMode: !prev.isDarkMode
    }));
  }, []);

  // Optimized sidebar toggle function
  const toggleSidebar = useCallback(() => {
    setAppState(prev => {
      const newSidebarState = !prev.isSidebarOpen;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(newSidebarState));
      return {
        ...prev,
        isSidebarOpen: newSidebarState
      };
    });
  }, []);

  // Enhanced Google API loading with better error handling
  const loadGoogleApi = useCallback(async (): Promise<void> => {
    if (window.gapi) {
      console.log('Google API already loaded');
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GOOGLE_API_URL;
      script.async = true;
      script.defer = true;
      
      const cleanup = () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      };

      const onLoad = () => {
        cleanup();
        console.log('Google API loaded successfully');
        resolve();
      };

      const onError = (error: Event) => {
        cleanup();
        console.error('Failed to load Google API script:', error);
        reject(new Error('Failed to load Google API script'));
      };

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      
      // Add timeout for loading
      setTimeout(() => {
        cleanup();
        reject(new Error('Google API loading timeout'));
      }, 10000);

      document.head.appendChild(script);
    });
  }, []);

  // Enhanced initialization effect
  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        // Load Google API and simulate initial setup
        await Promise.allSettled([
          loadGoogleApi(),
          new Promise(resolve => setTimeout(resolve, LOADING_TIMEOUT))
        ]);

        if (isMounted) {
          setAppState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('App initialization error:', error);
        // Still proceed even if Google API fails
        if (isMounted) {
          setAppState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [loadGoogleApi]);

  // Effect for updating last activity time on user interaction
  useEffect(() => {
    if (!user) return;

    const updateActivityTime = () => {
      setLastActivityTime(Date.now());
    };

    window.addEventListener('mousemove', updateActivityTime);
    window.addEventListener('keydown', updateActivityTime);
    window.addEventListener('click', updateActivityTime);
    window.addEventListener('scroll', updateActivityTime); // Add scroll for more comprehensive activity

    // Initial activity log when component mounts
    sendActivity('APP_LOAD');

    return () => {
      window.removeEventListener('mousemove', updateActivityTime);
      window.removeEventListener('keydown', updateActivityTime);
      window.removeEventListener('click', updateActivityTime);
      window.removeEventListener('scroll', updateActivityTime);
    };
  }, [user, sendActivity]); // Depend on user and sendActivity

  // Effect for periodic activity reporting and idle detection
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityTime;
      const idleMinutes = idleTime / (1000 * 60);

      if (idleMinutes >= IDLE_TIMEOUT_MINUTES) {
        sendActivity('IDLE', { durationMinutes: idleMinutes.toFixed(2) });
      } else {
        sendActivity('ACTIVE');
      }
    }, ACTIVITY_REPORT_INTERVAL_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [user, lastActivityTime, sendActivity]); // Depend on user, lastActivityTime and sendActivity

  // Enhanced theme application effect
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Apply theme classes
    if (appState.isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }

    // Update meta theme color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', appState.isDarkMode ? '#111827' : '#ffffff');
    }

    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { isDarkMode: appState.isDarkMode } 
    }));
  }, [appState.isDarkMode]);

  // Handle theme changes from OS
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setAppState(prev => ({
        ...prev,
        isDarkMode: e.matches
      }));
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => {
    OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      notifyButton: {
        enable: true,
        prenotify: true,
        showCredit: false,
        text: {
          'tip.state.unsubscribed': 'Subscribe to notifications',
          'tip.state.subscribed': "You're subscribed to notifications",
          'tip.state.blocked': "You've blocked notifications",
          'message.prenotify': 'Click to subscribe to notifications',
          'message.action.subscribed': "Thanks for subscribing!",
          'message.action.resubscribed': "You're subscribed to notifications",
          'message.action.unsubscribed': "You won't receive notifications again",
          'message.action.subscribing': 'Subscribing...',
          'dialog.main.title': 'Manage Site Notifications',
          'dialog.main.button.subscribe': 'SUBSCRIBE',
          'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
          'dialog.blocked.title': 'Unblock Notifications',
          'dialog.blocked.message': 'Follow these instructions to allow notifications:'
        }
      },
      allowLocalhostAsSecureOrigin: true,
    });
  }, []);

  if (isLoading) {
    return (
      <div className={`app-container ${themeClass}`}>
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed top-4 right-4 z-50"
          style={{ maxHeight: '40px' }}
        >
          <img
            src={appState.isDarkMode ? "/Bolt white.jpg" : "/bolt balck.jpg"}
            alt="Bolt.new Hackathon Badge"
            className="h-10 max-h-10 w-auto transition-all duration-300 shadow-lg rounded-md"
            style={{ maxHeight: '40px' }}
          />
        </a>
        <LoadingScreen />
      </div>
    );
  }

  // Unauthenticated users only see the Login page
  if (!user) {
    return (
      <div className={`app-container ${themeClass}`}>
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed top-4 right-4 z-50"
          style={{ maxHeight: '40px' }}
        >
          <img
            src={appState.isDarkMode ? "/Bolt white.jpg" : "/bolt balck.jpg"}
            alt="Bolt.new Hackathon Badge"
            className="h-10 max-h-10 w-auto transition-all duration-300 shadow-lg rounded-md"
            style={{ maxHeight: '40px' }}
          />
        </a>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    );
  }

  // Authenticated user layout
  return (
    <FocusModeProvider>
      <BoetosTaskTimer />
      <div className={`app-container ${themeClass}`}>
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed top-4 right-4 z-50"
          style={{ maxHeight: '40px' }}
        >
          <img
            src={appState.isDarkMode ? "/Bolt white.jpg" : "/bolt balck.jpg"}
            alt="Bolt.new Hackathon Badge"
            className="h-10 max-h-10 w-auto transition-all duration-300 shadow-lg rounded-md"
            style={{ maxHeight: '40px' }}
          />
        </a>
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
          <Sidebar 
            isOpen={appState.isSidebarOpen} 
            onToggle={toggleSidebar}
          />
          <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            appState.isSidebarOpen ? 'lg:ml-64' : 'ml-0'
          }`}>
            <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 lg:hidden">
              <button onClick={toggleSidebar} className="text-slate-600 dark:text-slate-300">
                <Menu />
              </button>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Boetos
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/login" element={<Navigate to="/" />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                <Route path="/voice-assistant" element={<ProtectedRoute><VoiceAssistant /></ProtectedRoute>} />
                <Route path="/burnout-tracker" element={<ProtectedRoute><BurnoutTracker /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/verify-email-success" element={<ProtectedRoute><VerifyEmailSuccess /></ProtectedRoute>} />
                <Route path="/verify-email-error" element={<ProtectedRoute><VerifyEmailError /></ProtectedRoute>} />
                <Route path="/resend-verification" element={<ProtectedRoute><ResendVerification /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
      <FocusPopupWrapper />
    </FocusModeProvider>
  );
}

// Helper to only show popup when focus mode is active
function FocusPopupWrapper() {
  const { active } = useFocusMode();
  return active ? <FocusPopup /> : null;
}

const AppWrapper = () => (
  <UserProvider>
    <TimerProvider>
      <NotificationProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </NotificationProvider>
    </TimerProvider>
  </UserProvider>
);

export default AppWrapper;