import React, { useState, useEffect, useMemo } from 'react';
import CalendarView from '../components/calendar/CalendarView';
import BurnoutInsights from '../components/burnout/BurnoutInsights';
import QuickActions from '../components/actions/QuickActions';
//import UpcomingMeeting from '../components/calendar/UpcomingMeeting';
import { CalendarEvent } from '../types/calendar';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, Clock, Calendar, Users, BarChart3, Activity, Target, Brain, Zap, Award } from 'lucide-react';

// Motivational quotes array
const motivationalQuotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never came from comfort zones.",
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

// Enhanced User Analytics Component
const UserAnalytics: React.FC = () => {
  const { theme } = useTheme();
  
  // Mock analytics data - replace with real data from your backend
  const analyticsData = {
    meetingsThisWeek: 12,
    productivityScore: 85,
    focusTime: '6.5h',
    burnoutRisk: 'Low',
    completedTasks: 24,
    weeklyGrowth: '+12%',
    avgMeetingDuration: '45min',
    timeBlocked: '4.2h',
    energyLevel: 78,
    goalCompletion: 92
  };

  return (
    <div className={`rounded-lg p-8 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into your productivity patterns
          </p>
        </div>
        <BarChart3 className="h-8 w-8 text-blue-500" />
      </div>
      
      {/* Main Analytics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-6 w-6 text-blue-500 mr-2" />
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {analyticsData.meetingsThisWeek}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Meetings This Week
          </div>
          <div className="text-xs text-blue-500 mt-1">
            Avg: {analyticsData.avgMeetingDuration}
          </div>
        </div>
        
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            {analyticsData.productivityScore}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Productivity Score
          </div>
          <div className="text-xs text-green-500 mt-1">
            {analyticsData.weeklyGrowth} from last week
          </div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-6 w-6 text-purple-500 mr-2" />
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {analyticsData.focusTime}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Focus Time Today
          </div>
          <div className="text-xs text-purple-500 mt-1">
            {analyticsData.timeBlocked} time blocked
          </div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-6 w-6 text-yellow-500 mr-2" />
          </div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
            {analyticsData.burnoutRisk}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Burnout Risk
          </div>
          <div className="text-xs text-yellow-500 mt-1">
            Energy: {analyticsData.energyLevel}%
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center mb-3">
            <Target className="h-5 w-5 text-indigo-500 mr-2" />
            <span className="font-semibold">Goal Progress</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Weekly Goals
            </span>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {analyticsData.goalCompletion}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${analyticsData.goalCompletion}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center mb-3">
            <Award className="h-5 w-5 text-orange-500 mr-2" />
            <span className="font-semibold">Tasks Completed</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {analyticsData.completedTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            This week
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center mb-3">
            <Zap className="h-5 w-5 text-pink-500 mr-2" />
            <span className="font-semibold">Energy Level</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Energy
            </span>
            <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
              {analyticsData.energyLevel}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-pink-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${analyticsData.energyLevel}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Burnout Insights as a Page Section
const BurnoutInsightsExpanded: React.FC = () => {
  const { theme } = useTheme();
  
  const burnoutData = {
    overallRisk: 'Moderate',
    stressLevel: 65,
    workloadBalance: 'High',
    breaksTaken: 3,
    recommendedBreaks: 6,
    sleepQuality: 7.2,
    mentalWellness: 6.8,
    recommendations: [
      'Take a 15-minute break every 2 hours',
      'Consider blocking 30 minutes for deep work',
      'Schedule a brief walk after your 3 PM meeting',
      'Try a 5-minute breathing exercise before high-stress meetings'
    ]
  };

  return (
    <div className={`rounded-lg p-8 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } shadow-lg transition-all duration-300`}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Brain className="h-8 w-8 mr-3 text-purple-500" />
              Burnout Prevention Insights
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI-powered analysis of your work patterns and wellness indicators
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            burnoutData.overallRisk === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            burnoutData.overallRisk === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {burnoutData.overallRisk} Risk
          </div>
        </div>
      </div>

      {/* Wellness Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-100 dark:border-red-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-700 dark:text-red-300">Stress Level</h3>
            <Activity className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            {burnoutData.stressLevel}%
          </div>
          <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-2 mb-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${burnoutData.stressLevel}%` }}
            ></div>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">Above recommended level</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300">Sleep Quality</h3>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {burnoutData.sleepQuality}/10
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(burnoutData.sleepQuality / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400">Good quality sleep</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-green-700 dark:text-green-300">Breaks Today</h3>
            <Target className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {burnoutData.breaksTaken}/{burnoutData.recommendedBreaks}
          </div>
          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mb-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(burnoutData.breaksTaken / burnoutData.recommendedBreaks) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">Need {burnoutData.recommendedBreaks - burnoutData.breaksTaken} more breaks</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300">Mental Wellness</h3>
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {burnoutData.mentalWellness}/10
          </div>
          <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mb-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(burnoutData.mentalWellness / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-purple-600 dark:text-purple-400">Maintaining well</p>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-blue-500" />
          AI-Powered Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {burnoutData.recommendations.map((recommendation, index) => (
            <div 
              key={index}
              className="flex items-start p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mr-3 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  {index + 1}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Generate random quote on component mount and when user signs in
  useEffect(() => {
    const generateRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      setCurrentQuote(motivationalQuotes[randomIndex]);
    };
    
    generateRandomQuote();
    
    // Optional: Change quote every hour
    const quoteInterval = setInterval(generateRandomQuote, 3600000); // 1 hour
    
    return () => clearInterval(quoteInterval);
  }, [user]); // Regenerate when user changes (sign in/out)

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Real-time upcoming meetings calculation
  const upcomingMeetings = useMemo(() => {
    // Get events from localStorage
    const savedEvents = localStorage.getItem('calendarEvents');
    const events = savedEvents ? JSON.parse(savedEvents) : [];
    
    return events
      .filter((event: CalendarEvent) => new Date(event.start) > currentTime && event.type === 'meeting')
      .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [currentTime]);

  const nextMeeting = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;

  // Get time until next meeting
  const getTimeUntilMeeting = (meetingStart: string) => {
    const now = currentTime.getTime();
    const meetingTime = new Date(meetingStart).getTime();
    const timeDiff = meetingTime - now;
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Section with Motivational Quote */}
      <div className={`rounded-lg p-6 ${
        theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'
      } shadow-md transition-all duration-300 border ${
        theme === 'dark' ? 'border-gray-600' : 'border-blue-100'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {user?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Your AI assistant is here to help you stay productive and avoid burnout.
            </p>
            <div className={`p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700 border-l-4 border-blue-500' : 'bg-white border-l-4 border-blue-500'
            } shadow-sm`}>
              <p className="text-sm italic text-gray-700 dark:text-gray-300">
                💡 "{currentQuote}"
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentTime.toLocaleDateString([], { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Enhanced Next Meeting Card with Real-time Updates */}
          {nextMeeting && (
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-md transition-all duration-300 border-l-4 border-green-500`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  Next Meeting
                </h3>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                  In {getTimeUntilMeeting(new Date(nextMeeting.start).toISOString())}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{nextMeeting.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(nextMeeting.start).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {nextMeeting.attendees && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                      <Users className="h-4 w-4 mr-1" />
                      {nextMeeting.attendees} attendees
                    </p>
                  )}
                </div>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                  Join Meeting
                </button>
              </div>
            </div>
          )}

          {/* Expanded User Analytics Section */}
          <UserAnalytics />
          

          {/* Expanded Burnout Insights Section */}
          <BurnoutInsightsExpanded />
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default Dashboard;