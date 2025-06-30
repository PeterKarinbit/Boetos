import { useState, useEffect } from 'react';
import { Heart, Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, Plus, Calendar, ShieldCheck, Wind, BarChart3, Target, Activity as LucideActivity, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import api from '../services/api';
import CircularProgress from '../components/common/CircularProgress';
import { useUser } from '../contexts/UserContext';
import { motivationalQuotes } from './Dashboard';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DailySurvey, DailySurveyData } from '../components/survey/DailySurvey';

interface MentalHealthData {
  mood: number;
  stress: number;
  sleep: number;
  energy: number;
  notes?: string;
}

interface BurnoutAnalysis {
  riskLevel: number;
  riskCategory: 'low' | 'moderate' | 'high';
  factors: string[];
  recommendations: string[];
  insights: string;
}

const trendMetrics = ['stress', 'sleep', 'energy'] as const;
type TrendMetric = typeof trendMetrics[number];

const BurnoutTracker = () => {
  const [burnoutRisk, setBurnoutRisk] = useState(35);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [predictSummary, setPredictSummary] = useState('');
  const [predictRecs, setPredictRecs] = useState<string[]>([]);
  const [predictDays, setPredictDays] = useState<any>({});
  const { user } = useUser();
  const [quote, setQuote] = useState('');
  const [streak, setStreak] = useState(0);
  const [trend, setTrend] = useState<Record<TrendMetric, 'up' | 'down' | 'flat'>>({
    stress: 'down',
    sleep: 'up',
    energy: 'flat',
  });
  const [weeklyStart, setWeeklyStart] = useState<Date | null>(null);
  const [weeklyEnd, setWeeklyEnd] = useState<Date | null>(null);
  const [showDailySurvey, setShowDailySurvey] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [latestCheckIn, setLatestCheckIn] = useState<any>(null);

  useEffect(() => {
    checkDailySurveyStatus();
    fetchHistoricalData();
    fetchRecommendations();
    fetchPredict();
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    // Load streak from localStorage (shared with Dashboard)
    const storedStreak = localStorage.getItem('dailySurveyStreak');
    if (storedStreak) setStreak(Number(storedStreak));
  }, []);

  const checkDailySurveyStatus = async () => {
    try {
      const response = await api.get('/api/mental-health/status');
      const { completedToday } = response.data;
      setHasCheckedInToday(completedToday);
      
      // Show survey if not completed today
      if (!completedToday) {
        setShowDailySurvey(true);
      } else {
        // If completed today, fetch the latest check-in data
        await fetchLatestCheckIn();
      }
    } catch (error) {
      console.error('Error checking daily survey status:', error);
      // If we can't check status, show survey to be safe
      setShowDailySurvey(true);
    }
  };

  const fetchLatestCheckIn = async () => {
    try {
      const response = await api.get('/api/mental-health/history/week');
      if (response.data && response.data.checkIns && response.data.checkIns.length > 0) {
        setLatestCheckIn(response.data.checkIns[0]); // Most recent check-in
      }
    } catch (error) {
      console.error('Error fetching latest check-in:', error);
    }
  };

  const handleDailySurveySubmit = async (data: DailySurveyData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert mood from string to number if needed
      const moodNumber = typeof data.mood === 'string' ? 
        parseInt(data.mood) : data.mood;

      const response = await api.post('/api/mental-health/check-in', {
        mood: moodNumber,
        stress: data.stress,
        sleep: data.sleep,
        energy: data.energy,
        notes: data.notes
      });

      const analysis: BurnoutAnalysis = response.data;
      setBurnoutRisk(analysis.riskScore || analysis.riskLevel);
      
      // Update recommendations
      setRecommendations(analysis.recommendations.map((rec: string) => ({
        icon: Brain,
        title: rec.split(':')[0],
        description: rec.split(':')[1] || rec,
        priority: 'medium',
        action: 'Learn More'
      })));

      // Update streak
      const currentStreak = streak + 1;
      setStreak(currentStreak);
      localStorage.setItem('dailySurveyStreak', currentStreak.toString());

      // Mark as completed today and set latest check-in
      setHasCheckedInToday(true);
      setShowDailySurvey(false);
      setLatestCheckIn({
        mood: moodNumber,
        stress: data.stress,
        sleep: data.sleep,
        energy: data.energy,
        notes: data.notes,
        risk_score: analysis.riskScore || analysis.riskLevel,
        created_at: new Date().toISOString()
      });

      // Refresh historical data
      await fetchHistoricalData();
      
    } catch (error) {
      console.error('Error in daily survey submission:', error);
      setError('Failed to save survey data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailySurveyClose = () => {
    setShowDailySurvey(false);
  };

  const fetchHistoricalData = async () => {
    try {
      const [weeklyResponse, monthlyResponse] = await Promise.all([
        api.get('/api/mental-health/history/week'),
        api.get('/api/mental-health/history/month')
      ]);
      setWeeklyData(Array.isArray(weeklyResponse.data) ? weeklyResponse.data : []);
      setMonthlyTrend(Array.isArray(monthlyResponse.data) ? monthlyResponse.data : []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError('Failed to load historical data');
      setWeeklyData([]);
      setMonthlyTrend([]);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/api/mental-health/recommendations');
      const recs = response.data && Array.isArray(response.data.recommendations)
        ? response.data.recommendations
        : [];
      setRecommendations(recs.map((rec: string) => ({
        icon: Brain,
        title: rec.split(':')[0],
        description: rec.split(':')[1] || rec,
        priority: 'medium',
        action: 'Learn More'
      })));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
      setRecommendations([]);
    }
  };

  const fetchPredict = async () => {
    try {
      const res = await api.get('/api/burnout/predict');
      setPredictSummary(res.data.summary);
      setPredictRecs(res.data.recommendations);
      setPredictDays(res.data.days);
    } catch (e) {
      setPredictSummary('Could not load predictive insights.');
    }
  };

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

  const getMoodEmoji = (mood: number) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '��';
    if (mood >= 4) return '😐';
    return '😔';
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

  const filteredWeeklyData = Array.isArray(weeklyData) ? weeklyData.filter((d) => {
    if (!weeklyStart || !weeklyEnd) return true;
    const day = new Date(d.date || d.day);
    return day >= weeklyStart && day <= weeklyEnd;
  }) : [];

  return (
    <>
      {showDailySurvey && (
        <DailySurvey
          isOpen={showDailySurvey}
          onSubmit={handleDailySurveySubmit}
          onClose={handleDailySurveyClose}
        />
      )}
      {/* Motivational Quote */}
      <div className="flex justify-center mt-4 mb-2">
        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-xl shadow text-lg font-semibold">
          “{quote}”
        </div>
      </div>
      {/* Streak Badge */}
      {streak > 1 && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-4 py-2 rounded-xl shadow font-bold animate-bounce">
            <span className="text-2xl">🔥</span>
            <span>{streak}-day wellness streak!</span>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative min-h-[220px] flex flex-col items-center justify-center text-center mb-10 py-10 bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-slate-100/0 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl shadow-lg overflow-hidden">
        <div className="z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 animate-fade-in">
            {user?.name ? `Welcome, ${user.name}!` : 'Welcome to Your Burnout Tracker'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-4 animate-fade-in-slow">Track your well-being and stay ahead of burnout.</p>
          <div className="italic text-blue-600 dark:text-blue-300 text-base font-medium animate-fade-in-slower">"{quote}"</div>
        </div>
        {/* Decorative SVG or gradient */}
        <svg className="absolute bottom-0 left-0 w-full h-24 opacity-20" viewBox="0 0 1440 320"><path fill="#6366f1" fillOpacity="0.2" d="M0,224L48,197.3C96,171,192,117,288,117.3C384,117,480,171,576,197.3C672,224,768,224,864,197.3C960,171,1056,117,1152,128C1248,139,1344,213,1392,250.7L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
      </div>

      {/* Latest Check-In Metrics Section */}
      {latestCheckIn && (
        <div className="mb-8">
          <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Today's Wellness Check-In</h2>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  latestCheckIn.risk_score >= 7 
                    ? 'bg-red-500/20 text-red-400' 
                    : latestCheckIn.risk_score >= 5 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  Risk Score: {latestCheckIn.risk_score}/10
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {latestCheckIn.mood}/6
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Mood</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {latestCheckIn.mood >= 5 ? '😊 Great' : latestCheckIn.mood >= 4 ? '😐 Neutral' : '😔 Low'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {latestCheckIn.stress}/10
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Stress</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {latestCheckIn.stress >= 7 ? '😰 High' : latestCheckIn.stress >= 4 ? '😐 Moderate' : '😌 Low'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {latestCheckIn.sleep}/10
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Sleep</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {latestCheckIn.sleep >= 7 ? '😴 Great' : latestCheckIn.sleep >= 5 ? '😐 Fair' : '😫 Poor'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {latestCheckIn.energy}/10
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Energy</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {latestCheckIn.energy >= 7 ? '⚡ High' : latestCheckIn.energy >= 4 ? '😐 Moderate' : '😫 Low'}
                </div>
              </div>
            </div>
            
            {latestCheckIn.notes && (
              <div className="mt-6 p-4 bg-slate-100/50 dark:bg-slate-700/30 rounded-xl">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes:</div>
                <div className="text-slate-600 dark:text-slate-400 text-sm italic">"{latestCheckIn.notes}"</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trends Section */}
      <div className="flex justify-center gap-6 mb-6">
        {trendMetrics.map((metric) => (
          <div key={metric} className="flex flex-col items-center">
            <span className="capitalize text-slate-700 dark:text-slate-200 font-semibold">{metric}</span>
            <span className={`text-2xl ${trend[metric] === 'up' ? 'text-red-500' : trend[metric] === 'down' ? 'text-green-500' : 'text-yellow-500'}`}>
              {trend[metric] === 'up' ? '▲' : trend[metric] === 'down' ? '▼' : '►'}
            </span>
            <span className="text-xs text-slate-400">vs last week</span>
          </div>
        ))}
      </div>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Burnout Tracker</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor your stress levels and burnout risk.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8 min-w-0">
              {/* Analytics Cards - Similar to Dashboard */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 w-full max-w-full overflow-x-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 w-full">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-slate-100">Wellness Analytics</h2>
                    <p className="text-slate-400 mt-1">
                      Comprehensive insights into your mental health patterns
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-400 flex-shrink-0" />
                </div>
                {/* Example chart with fallback */}
                <div className="w-full max-w-full overflow-x-auto">
                  {weeklyData.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">No weekly data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="mood" fill="#6366f1" name="Mood" />
                        <Bar dataKey="stress" fill="#f59e42" name="Stress" />
                        <Bar dataKey="sleep" fill="#10b981" name="Sleep" />
                        <Bar dataKey="energy" fill="#f43f5e" name="Energy" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              {/* Add similar overflow-x-auto and fallback for other cards/charts */}
            </div>
            {/* Right Column */}
            <div className="space-y-8 min-w-0 w-full max-w-full">
              {/* Example: Monthly Trend Card */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 w-full max-w-full overflow-x-auto">
                <h2 className="text-xl font-bold text-slate-100 mb-4">Monthly Trend</h2>
                <div className="w-full max-w-full overflow-x-auto">
                  {monthlyTrend.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">No monthly trend data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="mood" stroke="#6366f1" name="Mood" />
                        <Line type="monotone" dataKey="stress" stroke="#f59e42" name="Stress" />
                        <Line type="monotone" dataKey="sleep" stroke="#10b981" name="Sleep" />
                        <Line type="monotone" dataKey="energy" stroke="#f43f5e" name="Energy" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              {/* Add similar overflow-x-auto and fallback for other cards/charts */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BurnoutTracker;