import { useState} from 'react';
import { Heart, Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, Plus, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const BurnoutTracker = () => {
  const [currentMood, setCurrentMood] = useState(7);
  const [currentStress, setCurrentStress] = useState(4);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [burnoutRisk, setBurnoutRisk] = useState(35); // 0-100 scale

  // Mock data for charts
  const weeklyData = [
    { day: 'Mon', mood: 8, stress: 3, energy: 7, sleep: 7 },
    { day: 'Tue', mood: 6, stress: 6, energy: 5, sleep: 6 },
    { day: 'Wed', mood: 7, stress: 5, energy: 6, sleep: 5 },
    { day: 'Thu', mood: 5, stress: 7, energy: 4, sleep: 4 },
    { day: 'Fri', mood: 8, stress: 4, energy: 8, sleep: 7 },
    { day: 'Sat', mood: 9, stress: 2, energy: 9, sleep: 8 },
    { day: 'Sun', mood: 8, stress: 3, energy: 7, sleep: 7 },
  ];

  const monthlyTrend = [
    { week: 'Week 1', burnout: 25, mood: 7.5, stress: 4.2 },
    { week: 'Week 2', burnout: 32, mood: 6.8, stress: 5.1 },
    { week: 'Week 3', burnout: 40, mood: 6.2, stress: 6.3 },
    { week: 'Week 4', burnout: 35, mood: 7.1, stress: 4.8 },
  ];

  const recommendations = [
    {
      icon: Heart,
      title: "Take Regular Breaks",
      description: "You've been working for 3+ hours straight. Consider a 15-minute break.",
      priority: "high",
      action: "Schedule Break"
    },
    {
      icon: Brain,
      title: "Mindfulness Practice",
      description: "Your stress levels are elevated. Try a 5-minute meditation.",
      priority: "medium",
      action: "Start Meditation"
    },
    {
      icon: Zap,
      title: "Energy Boost",
      description: "Your energy is low. Consider a healthy snack or short walk.",
      priority: "low",
      action: "Set Reminder"
    }
  ];

  const getBurnoutRiskColor = (risk: number ) => {
    if (risk < 30) return 'text-green-600 bg-green-100';
    if (risk < 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getBurnoutRiskText = (risk: number) => {
    if (risk < 30) return 'Low Risk';
    if (risk < 60) return 'Moderate Risk';
    return 'High Risk';
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    return '😔';
  };

  const handleQuickCheckIn = () => {
    setShowCheckIn(false);
    // Simulate updating data
    const newBurnoutRisk = Math.max(0, burnoutRisk - Math.random() * 10);
    setBurnoutRisk(newBurnoutRisk);
  };

  const CheckInModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-6 text-center">Quick Wellness Check-In</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How are you feeling right now? ({currentMood}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={currentMood}
              onChange={(e) => setCurrentMood(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>😔 Poor</span>
              <span className="text-lg">{getMoodEmoji(currentMood)}</span>
              <span>😊 Great</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Current stress level ({currentStress}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={currentStress}
              onChange={(e) => setCurrentStress(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>😌 Relaxed</span>
              <span>😰 Stressed</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How did you sleep last night?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Poor', 'Fair', 'Good', 'Excellent'].map((quality) => (
                <button
                  key={quality}
                  className="p-2 border rounded-lg hover:bg-blue-50 hover:border-blue-300 text-sm"
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={() => setShowCheckIn(false)}
            className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleQuickCheckIn}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Complete Check-In
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 mr-2 sm:mr-3" />
                Burnout Tracker
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Monitor your mental health and prevent burnout</p>
            </div>
            <button
              onClick={() => setShowCheckIn(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-600 text-sm sm:text-base"
            >
              <Plus className="h-5 w-5" />
              <span>Quick Check-In</span>
            </button>
          </div>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Burnout Risk Meter */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 col-span-1 md:col-span-2 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Burnout Risk Assessment</h2>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getBurnoutRiskColor(burnoutRisk)}`}>{getBurnoutRiskText(burnoutRisk)}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-3 sm:mb-4">
                <div
                  className={`h-3 sm:h-4 rounded-full transition-all duration-500 ${
                    burnoutRisk < 30 ? 'bg-green-500' :
                    burnoutRisk < 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${burnoutRisk}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Mood & Stress Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full overflow-x-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Mood & Stress (Weekly)</h2>
            <div className="w-full min-w-[320px] sm:min-w-0">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-start w-full">
              <div className="flex items-center gap-2 mb-2">
                <rec.icon className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-sm sm:text-base">{rec.title}</span>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">{rec.description}</p>
              <button className="mt-auto px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs sm:text-sm hover:bg-blue-200">{rec.action}</button>
            </div>
          ))}
          </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full overflow-x-auto mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Monthly Burnout Trend</h2>
          <div className="w-full min-w-[320px] sm:min-w-0">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="burnout" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
                <Area type="monotone" dataKey="mood" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
                <Area type="monotone" dataKey="stress" stroke="#f59e42" fill="#fef3c7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Check-In Modal */}
        {showCheckIn && <CheckInModal />}
      </div>
    </div>
  );
};

export default BurnoutTracker;