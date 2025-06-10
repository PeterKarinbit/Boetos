import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import VoiceAssistant from './pages/VoiceAssistant';
import BurnoutTracker from './pages/BurnoutTracker';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { UserProvider, useUser } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoadingScreen from './components/common/LoadingScreen';
import { ProtectedRoute } from './components/ProtectedRoute';
import Sidebar from './components/navigation/Sidebar';
import { Menu } from 'lucide-react';

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

function App() {
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

  const { user } = useUser(); // Get user from context using the custom hook
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());

  // Function to send activity to backend
  const sendActivity = useCallback(async (type: string, details?: any) => {
    if (!user?.id) {
      // console.warn('Cannot log activity: User not authenticated.'); // Uncomment for debugging
      return;
    }
    try {
      await fetch('/api/activity/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization token if needed, e.g., 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          activityType: type,
          timestamp: new Date().toISOString(),
          details: details,
        }),
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
  }, [sendActivity]); // Depend on sendActivity

  // Effect for periodic activity reporting and idle detection
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityTime;
      const idleMinutes = idleTime / (1000 * 60);

      if (idleMinutes >= IDLE_TIMEOUT_MINUTES) {
        sendActivity('IDLE', { durationMinutes: idleMinutes.toFixed(2) });
      } else {
        sendActivity('ACTIVE_PING');
      }
    }, ACTIVITY_REPORT_INTERVAL_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [lastActivityTime, sendActivity]); // Depend on lastActivityTime and sendActivity

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

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!savedTheme) {
        setAppState(prev => ({ ...prev, isDarkMode: e.matches }));
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Protected route wrapper component for DRY principle
  const ProtectedPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ProtectedRoute>
      <div className="flex w-full h-full">
        <Sidebar
          isOpen={appState.isSidebarOpen}
          onToggle={toggleSidebar}
        />
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${appState.isSidebarOpen ? 'p-8' : 'p-8'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );

  // Show loading screen while initializing
  if (appState.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <UserProvider>
        <NotificationProvider>
          {/* Floating mobile sidebar open button */}
          {!appState.isSidebarOpen && (
            <button
              className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg lg:hidden"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
          )}
          <Routes>
            <Route path="/" element={<ProtectedPageWrapper><Dashboard /></ProtectedPageWrapper>} />
            <Route path="/calendar" element={<ProtectedPageWrapper><Calendar /></ProtectedPageWrapper>} />
            <Route path="/voice-assistant" element={<ProtectedPageWrapper><VoiceAssistant /></ProtectedPageWrapper>} />
            <Route path="/burnout-tracker" element={<ProtectedPageWrapper><BurnoutTracker /></ProtectedPageWrapper>} />
            <Route path="/settings" element={<ProtectedPageWrapper><Settings /></ProtectedPageWrapper>} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<ProtectedPageWrapper><Profile /></ProtectedPageWrapper>} />
          </Routes>
        </NotificationProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;