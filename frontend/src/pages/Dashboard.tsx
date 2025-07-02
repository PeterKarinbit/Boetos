import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarView from '../components/calendar/CalendarView';
import BurnoutInsights from '../components/burnout/BurnoutInsights';
import QuickActions from '../components/actions/QuickActions';
import { CalendarEvent } from '../types/calendar';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, Clock, Calendar, Users, BarChart3, Activity as LucideActivity, Target, Brain, Zap, Award, CheckSquare, Mic, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { DailySurvey } from '../components/survey/DailySurvey';
import MemoryArea from '../components/memory/MemoryArea';
import NotificationsDropdown from '../components/navigation/NotificationsDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

// Motivational quotes array
export const motivationalQuotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it."
];

// Add a fallback type for Activity if needed:
type Activity = any;

const UserAnalytics: React.FC<{ burnoutRisk: number }> = ({ burnoutRisk }) => {
  // --- Mock Data ---
  const calendarEvents = [
    { type: 'meeting', start: new Date('2025-06-23T10:00:00') },
    { type: 'meeting', start: new Date('2025-06-25T14:00:00') },
    { type: 'task', start: new Date('2025-06-24T09:00:00') },
  ];
  const tasks = [
    { completed: true, completedAt: new Date('2025-06-23'), createdAt: new Date('2025-06-23') },
    { completed: false, createdAt: new Date('2025-06-24') },
    { completed: true, completedAt: new Date('2025-06-25'), createdAt: new Date('2025-06-25') },
  ];
  const focusSessions = [
    { start: new Date('2025-06-26T09:00:00'), end: new Date('2025-06-26T10:00:00') },
    { start: new Date('2025-06-26T11:00:00'), end: new Date('2025-06-26T11:30:00') },
  ];
  const surveys = [
    { date: new Date('2025-06-26'), stress: 4, sleep: 7, energy: 80 },
    { date: new Date('2025-06-25'), stress: 6, sleep: 6, energy: 70 },
  ];
  const goals = [
    { completed: true, completedAt: new Date('2025-06-23') },
    { completed: false },
    { completed: true, completedAt: new Date('2025-06-25') },
  ];

  // --- Helper Functions ---
  function isThisWeek(date: Date) {
    const now = new Date();
    const first = now.getDate() - now.getDay();
    const last = first + 6;
    const firstDay = new Date(now.setDate(first));
    const lastDay = new Date(now.setDate(last));
    return date >= firstDay && date <= lastDay;
  }
  function isToday(date: Date) {
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  // --- Calculations ---
  // Meetings This Week
  const meetingsThisWeek = calendarEvents.filter(e => e.type === 'meeting' && isThisWeek(e.start)).length;
  // Productivity Score
  const tasksThisWeek = tasks.filter(t => isThisWeek(t.createdAt)).length;
  const completedTasksThisWeek = tasks.filter(t => t.completed && t.completedAt && isThisWeek(t.completedAt)).length;
  const productivityScore = tasksThisWeek > 0 ? Math.round((completedTasksThisWeek / tasksThisWeek) * 100) : 0;
  // Focus Time Today
  const focusTimeTodayMinutes = focusSessions.filter(s => isToday(s.start)).reduce((sum, s) => sum + ((s.end.getTime() - s.start.getTime()) / 60000), 0);
  const focusTimeToday = focusTimeTodayMinutes >= 60 ? `${(focusTimeTodayMinutes / 60).toFixed(1)}h` : `${focusTimeTodayMinutes}m`;
  // Goal Progress
  const goalsThisWeek = goals.length;
  const completedGoalsThisWeek = goals.filter(g => g.completed && g.completedAt && isThisWeek(g.completedAt)).length;
  const goalCompletion = goalsThisWeek > 0 ? Math.round((completedGoalsThisWeek / goalsThisWeek) * 100) : 0;
  // Energy Level
  const energyLevel = surveys[0] ? surveys[0].energy : 0;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Your Analytics</h2>
          <p className="text-slate-400 mt-1">
            Comprehensive insights into your productivity patterns
          </p>
        </div>
        <BarChart3 className="h-8 w-8 text-blue-400" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="text-center p-6 bg-slate-700/60 rounded-2xl border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <Calendar className="h-6 w-6 text-blue-400 mr-2" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {meetingsThisWeek}
          </div>
          <div className="text-sm text-slate-300">
            Meetings This Week
          </div>
        </div>
        <div className="text-center p-6 bg-slate-700/60 rounded-2xl border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <TrendingUp className="h-6 w-6 text-green-400 mr-2" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {productivityScore}%
          </div>
          <div className="text-sm text-slate-300">
            Productivity Score
          </div>
          <div className="text-xs text-green-400 mt-2">
            {completedTasksThisWeek} tasks completed
          </div>
        </div>
        <div className="text-center p-6 bg-slate-700/60 rounded-2xl border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <Clock className="h-6 w-6 text-purple-400 mr-2" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {focusTimeToday}
          </div>
          <div className="text-sm text-slate-300">
            Focus Time Today
          </div>
        </div>
        <div className="text-center p-6 bg-slate-700/60 rounded-2xl border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <LucideActivity className="h-6 w-6 text-amber-400 mr-2" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-2">
            {burnoutRisk}%
          </div>
          <div className="text-sm text-slate-300">
            Burnout Risk
          </div>
          <div className="text-xs text-amber-400 mt-2">
            Energy: {energyLevel}%
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-700/60 rounded-2xl hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center mb-4">
            <Target className="h-5 w-5 text-indigo-400 mr-3" />
            <span className="font-semibold text-slate-200">Goal Progress</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-400">
              Weekly Goals
            </span>
            <span className="text-sm font-semibold text-indigo-400">
              {goalCompletion}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${goalCompletion}%` }}></div>
          </div>
        </div>
        <div className="p-6 bg-slate-700/60 rounded-2xl hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center mb-4">
            <Award className="h-5 w-5 text-orange-400 mr-3" />
            <span className="font-semibold text-slate-200">Tasks Completed</span>
          </div>
          <div className="text-2xl font-bold text-orange-400 mb-2">
            {completedTasksThisWeek}
          </div>
          <div className="text-sm text-slate-400">
            This week
          </div>
        </div>
        <div className="p-6 bg-slate-700/60 rounded-2xl hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 text-pink-400 mr-3" />
            <span className="font-semibold text-slate-200">Energy Level</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-400">
              Current Energy
            </span>
            <span className="text-sm font-semibold text-pink-400">
              {energyLevel}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div className="bg-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${energyLevel}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BurnoutInsightsExpanded: React.FC = () => {
  const { theme } = useTheme();
  const burnoutData = {
    weeklyData: [
      { day: 'Mon', stress: 65, productivity: 85 },
      { day: 'Tue', stress: 70, productivity: 80 },
      { day: 'Wed', stress: 75, productivity: 75 },
      { day: 'Thu', stress: 60, productivity: 90 },
      { day: 'Fri', stress: 55, productivity: 95 }
    ],
    monthlyTrend: {
      stressTrend: 'decreasing',
      productivityTrend: 'increasing',
      workLifeBalance: 'improving'
    },
    recommendations: [
      'Take a 15-minute break every 2 hours',
      'Consider blocking 30 minutes for deep work',
      'Schedule a brief walk after your 3 PM meeting',
      'Try a 5-minute breathing exercise before high-stress meetings'
    ],
    burnoutRisk: 'Moderate',
    severity: 65
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Burnout Insights</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your wellbeing and get personalized recommendations
          </p>
        </div>
        <div className="p-3 rounded-full bg-blue-500">
          <Brain className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900 dark:text-white">Overall Risk</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              burnoutData.burnoutRisk === 'Low' ? 'bg-green-100 text-green-800' :
              burnoutData.burnoutRisk === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {burnoutData.burnoutRisk}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Stress Level: {burnoutData.severity}%
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900 dark:text-white">Monthly Trend</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {burnoutData.monthlyTrend.stressTrend}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Work-Life Balance: {burnoutData.monthlyTrend.workLifeBalance}
          </div>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Recommendations</h3>
        <div className="space-y-2">
          {burnoutData.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return fallback || (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg">
        <h3 className="font-bold mb-2">Something went wrong</h3>
        <p className="text-sm">Please refresh the page or try again later.</p>
        <button 
          onClick={() => setHasError(false)}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  return <>{children}</>;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const greetingMessages = [
  (name: string) => `Good morning, ${name}! What would you like help with today?`,
  (name: string) => `Welcome back, ${name}! Let's make today productive.`,
  (name: string) => `Hi ${name}, your tasks and notes are ready.`
];

export const Dashboard: React.FC = () => {
  const [showDailySurvey, setShowDailySurvey] = useState(false);
  const { user } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentQuote, setCurrentQuote] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Predictive Insights state
  const [predictSummary, setPredictSummary] = useState('');
  const [predictRecs, setPredictRecs] = useState<string[]>([]);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showVerifyBanner, setShowVerifyBanner] = useState(true);
  const [streak, setStreak] = useState(0);
  // Real burnout data state
  const [weeklyBurnoutData, setWeeklyBurnoutData] = useState<any[]>([]);
  const [monthlyBurnoutData, setMonthlyBurnoutData] = useState<any[]>([]);
  const [burnoutRisk, setBurnoutRisk] = useState(35);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    // Load streak from localStorage
    const storedStreak = localStorage.getItem('dailySurveyStreak');
    if (storedStreak) setStreak(Number(storedStreak));
    // Show survey only if not filled today
    const lastSurveyDate = localStorage.getItem('lastSurveyDate');
    const today = new Date().toDateString();
    if (lastSurveyDate !== today) {
      setShowDailySurvey(true);
    }
  }, []);

  useEffect(() => {
    const handleError = () => setError('Failed to load calendar events');
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Set random quote on mount
  useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  // Fetch calendar events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<CalendarEvent[]>('/api/calendar/events');
        const events = response.data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setUpcomingEvents(events);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load calendar events');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.email) {
      fetchEvents();
    }
  }, [user?.email]);

  useEffect(() => {
    async function fetchPredict() {
      try {
        const res = await api.get('/api/burnout/predict');
        setPredictSummary(res.data.summary);
        setPredictRecs(res.data.recommendations);
      } catch (e) {
        setPredictSummary('Could not load predictive insights.');
      }
    }
    fetchPredict();
  }, []);

  // Fetch real burnout data
  useEffect(() => {
    const fetchBurnoutData = async () => {
      try {
        const [weeklyResponse, monthlyResponse, recommendationsResponse] = await Promise.all([
          api.get('/api/mental-health/history/week'),
          api.get('/api/mental-health/history/month'),
          api.get('/api/mental-health/recommendations')
        ]);
        
        setWeeklyBurnoutData(Array.isArray(weeklyResponse.data) ? weeklyResponse.data : []);
        setMonthlyBurnoutData(Array.isArray(monthlyResponse.data) ? monthlyResponse.data : []);
        
        const recs = recommendationsResponse.data && Array.isArray(recommendationsResponse.data.recommendations)
          ? recommendationsResponse.data.recommendations
          : [];
        setRecommendations(recs.map((rec: string) => ({
          icon: Brain,
          title: rec.split(':')[0],
          description: rec.split(':')[1] || rec,
          priority: 'medium',
          action: 'Learn More'
        })));
        
        // Calculate current burnout risk from latest data
        if (weeklyResponse.data && weeklyResponse.data.length > 0) {
          const latest = weeklyResponse.data[weeklyResponse.data.length - 1];
          const risk = Math.round((latest.stress * 2 + (10 - latest.sleep) + (100 - latest.energy) / 10) / 3 * 10);
          setBurnoutRisk(risk);
        }
      } catch (error) {
        console.error('Error fetching burnout data:', error);
        setWeeklyBurnoutData([]);
        setMonthlyBurnoutData([]);
        setRecommendations([]);
      }
    };

    if (user?.email) {
      fetchBurnoutData();
    }
  }, [user?.email]);

  // Helper functions for burnout data
  const getBurnoutRiskColor = (risk: number) => {
    if (risk < 30) return { text: 'text-green-400', bg: 'bg-green-500/10', ring: 'ring-green-500/30' };
    if (risk < 60) return { text: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/30' };
    return { text: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/30' };
  };

  const getBurnoutRiskText = (risk: number) => {
    if (risk < 30) return 'Low Risk';
    if (risk < 60) return 'Moderate Risk';
    return 'High Risk';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700/80 backdrop-blur-sm p-4 rounded-xl border border-slate-600/50">
          <p className="label text-slate-300">{`${label}`}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color }} className="intro">{`${pld.name}: ${pld.value}`}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (user && user.name && !sessionStorage.getItem('greetingShown')) {
      // Determine greeting based on time
      const hour = currentTime.getHours();
      let timeGreeting = '';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 18) timeGreeting = 'Good afternoon';
      else timeGreeting = 'Good evening';
      // Pick a random motivational quote
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      // Compose the greeting
      const presetGreeting = `${timeGreeting}, ${user.name}! ${randomQuote}`;
      setGreeting(presetGreeting);
      setShowGreeting(true);
      sessionStorage.setItem('greetingShown', 'true');
    }
  }, [user, currentTime]);

  const handleDailySurveySubmit = async (data: any) => {
    try {
      await api.post('/api/mental-health/check-in', data);
      setShowDailySurvey(false);
      // Update streak
      const today = new Date().toDateString();
      const lastSurveyDate = localStorage.getItem('lastSurveyDate');
      let newStreak = streak;
      if (lastSurveyDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastSurveyDate === yesterday.toDateString()) {
          newStreak = streak + 1;
        } else if (lastSurveyDate !== today) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      setStreak(newStreak);
      localStorage.setItem('dailySurveyStreak', String(newStreak));
      localStorage.setItem('lastSurveyDate', today);
      // Refresh dashboard data
      // Add your data refresh logic here
    } catch (error) {
      console.error('Error saving daily survey:', error);
      alert('Failed to save survey data. Please try again.');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Show greeting notification for 6 seconds
  useEffect(() => {
    if (showGreeting) {
      const timer = setTimeout(() => setShowGreeting(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showGreeting]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Fix filteredEvents filter:
  const filteredEvents = upcomingEvents.filter(e => e.type !== 'reminder' && e.type !== 'memory');

  return (
    <ErrorBoundary fallback={<div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg">Something went wrong. Please refresh the page.</div>}>
      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        {/* Streak Component */}
        {streak > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl shadow text-orange-600 dark:text-orange-300 w-fit mx-auto animate-bounce">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-lg">{streak}-day streak!</span>
          </div>
        )}
        
        {/* Header with Notifications */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">
              {getGreeting()}, {user?.name || 'User'}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Here's what's happening with your productivity today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
          </div>
        </div>

        {/* AI Greeting Notification - now top right */}
        <AnimatePresence>
          {showGreeting && (
            <motion.div
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed top-6 right-6 z-50 bg-white dark:bg-slate-800 border border-blue-400 shadow-xl rounded-2xl px-8 py-4 flex flex-col items-center min-w-[320px] max-w-md"
            >
              <div className="mb-2 text-2xl font-bold text-blue-600 dark:text-blue-300">👋</div>
              <div className="mb-1 text-base text-slate-800 dark:text-slate-100 text-center font-semibold">{greeting}</div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Email Verification Warning */}
        {user && !user.emailVerified && showVerifyBanner && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Please verify your email to unlock full features
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Check your inbox for a verification link, or request a new one.
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => navigate('/resend-verification')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Resend Email
              </button>
              <button
                onClick={() => setShowVerifyBanner(false)}
                className="px-2 py-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                aria-label="Close email verification banner"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid - Using 12-column grid system */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Analytics Section - Spans 8 columns on large screens */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <UserAnalytics burnoutRisk={burnoutRisk} />
            <MemoryArea />
          </div>
          
          {/* Right Column - Spans 4 columns on large screens */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <QuickActions />
            <CalendarView events={filteredEvents} readOnly />
          </div>
        </div>

        {/* Burnout Insights - Full width */}
        <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Burnout Insights</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Monitor your wellbeing and get personalized recommendations
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Burnout Risk Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-700/60 rounded-2xl border border-slate-600/50 p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <LucideActivity className="h-6 w-6 text-amber-400 mr-2" />
              </div>
              <div className="text-3xl font-bold text-amber-400 mb-2">
                {burnoutRisk}%
              </div>
              <div className="text-sm text-slate-300">
                Burnout Risk
              </div>
              <div className={`text-xs mt-2 px-2 py-1 rounded-full font-medium ${getBurnoutRiskColor(burnoutRisk).bg} ${getBurnoutRiskColor(burnoutRisk).text}`}>
                {getBurnoutRiskText(burnoutRisk)}
              </div>
            </div>
            
            <div className="bg-slate-700/60 rounded-2xl border border-slate-600/50 p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-green-400 mr-2" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {weeklyBurnoutData.length}
              </div>
              <div className="text-sm text-slate-300">
                Check-ins This Week
              </div>
            </div>
            
            <div className="bg-slate-700/60 rounded-2xl border border-slate-600/50 p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Award className="h-6 w-6 text-purple-400 mr-2" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {recommendations.length}
              </div>
              <div className="text-sm text-slate-300">
                Active Recommendations
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Weekly Report */}
            <div className="bg-slate-700/60 rounded-2xl border border-slate-600/50 p-6">
              <h3 className="font-semibold text-slate-200 mb-4">Weekly Wellness Trends</h3>
              {weeklyBurnoutData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={weeklyBurnoutData}>
                    <defs>
                      <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="stress" stroke="#f87171" fillOpacity={1} fill="url(#colorStress)" name="Stress" />
                    <Area type="monotone" dataKey="mood" stroke="#60a5fa" fillOpacity={1} fill="url(#colorMood)" name="Mood" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <div className="text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No wellness data available</p>
                    <p className="text-sm">Complete your daily check-ins to see trends</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Monthly Trend */}
            <div className="bg-slate-700/60 rounded-2xl border border-slate-600/50 p-6">
              <h3 className="font-semibold text-slate-200 mb-4">Monthly Burnout Trend</h3>
              {monthlyBurnoutData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyBurnoutData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="burnoutScore" stroke="#818cf8" strokeWidth={2} name="Burnout Score" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No monthly data available</p>
                    <p className="text-sm">Continue tracking to see long-term trends</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-slate-700/60 rounded-2xl border border-slate-600/50 p-6">
              <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-400" /> 
                Proactive Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.slice(0, 6).map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 bg-slate-600/40 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-500/50 flex items-center justify-center">
                      <rec.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-200 text-sm mb-1">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-400 mb-2">{rec.description}</p>
                      <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-semibold transition-colors duration-200">
                        Try Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Predictive Insights - Full width */}
        <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Upcoming Stress Prediction</h2>
          <p className="mb-4 text-slate-700 dark:text-slate-300">{predictSummary}</p>
          {predictRecs.length > 0 && (
            <ul className="list-disc pl-6 text-slate-700 dark:text-slate-300 space-y-1">
              {predictRecs.map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
          )}
        </div>
      </div>
      {/* Daily Survey Modal */}
      {showDailySurvey && (
        <DailySurvey
          onSubmit={handleDailySurveySubmit}
          onClose={() => setShowDailySurvey(false)}
        />
      )}
    </ErrorBoundary>
  );
};

export default Dashboard;