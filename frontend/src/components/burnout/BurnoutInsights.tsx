import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Heart, Brain, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { mockWorkloadData } from '../../data/mockData';

interface BurnoutInsightsProps {
  weeklyData: any[];
  monthlyTrend: any[];
  recommendations: any[];
  burnoutRisk: number;
}

const BurnoutInsights: React.FC<BurnoutInsightsProps> = ({
  weeklyData,
  monthlyTrend,
  recommendations,
  burnoutRisk
}) => {
  const { theme } = useTheme();
  
  // Calculate average stress level
  const avgStressLevel = Math.round(
    mockWorkloadData.reduce((sum, day) => sum + day.stressLevel, 0) / mockWorkloadData.length
  );
  
  // Get color based on stress level
  const getStressColor = (level: number) => {
    if (level <= 3) return 'text-green-500';
    if (level <= 6) return 'text-amber-500';
    return 'text-red-500';
  };
  
  // Get stress level label
  const getStressLabel = (level: number) => {
    if (level <= 3) return 'Low';
    if (level <= 6) return 'Moderate';
    return 'High';
  };

  // Prepare data for radar chart
  const radarData = [
    { metric: 'Mood', value: weeklyData[weeklyData.length - 1]?.mood || 0 },
    { metric: 'Stress', value: weeklyData[weeklyData.length - 1]?.stress || 0 },
    { metric: 'Sleep', value: weeklyData[weeklyData.length - 1]?.sleep || 0 },
    { metric: 'Energy', value: weeklyData[weeklyData.length - 1]?.energy || 0 },
  ];

  const getBurnoutRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-400 bg-green-900/20 border-green-800/50';
    if (risk < 60) return 'text-amber-400 bg-amber-900/20 border-amber-800/50';
    return 'text-red-400 bg-red-900/20 border-red-800/50';
  };

  const getBurnoutRiskText = (risk: number) => {
    if (risk < 30) return 'Low Risk';
    if (risk < 60) return 'Moderate Risk';
    return 'High Risk';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Burnout Insights</h2>
        <p className="text-slate-400 mt-1">Monitor your mental health and productivity patterns</p>
      </div>

      {/* Current State Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Burnout Risk Meter */}
        <div className="bg-slate-700/60 rounded-2xl p-6 hover:bg-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Current Burnout Risk</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getBurnoutRiskColor(burnoutRisk)}`}>
              {getBurnoutRiskText(burnoutRisk)}
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-slate-600 rounded-full h-4 mb-3">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  burnoutRisk < 30 ? 'bg-green-500' :
                  burnoutRisk < 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${burnoutRisk}%` }}
              ></div>
            </div>
            <div className="text-sm text-slate-400">
              Risk level: {burnoutRisk}% - {burnoutRisk < 30 ? 'You\'re doing great!' : 
                burnoutRisk < 60 ? 'Consider taking breaks' : 'Time to prioritize self-care'}
            </div>
          </div>
        </div>

        {/* Current Metrics Radar Chart */}
        <div className="bg-slate-700/60 rounded-2xl p-6 hover:bg-slate-700/80 transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Current Metrics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8' }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#94a3b8' }} />
                <Radar
                  name="Metrics"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      <div className="bg-slate-700/60 rounded-2xl p-6 hover:bg-slate-700/80 transition-all duration-300">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Weekly Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Line type="monotone" dataKey="mood" stroke="#3b82f6" name="Mood" strokeWidth={2} />
              <Line type="monotone" dataKey="stress" stroke="#ef4444" name="Stress" strokeWidth={2} />
              <Line type="monotone" dataKey="sleep" stroke="#10b981" name="Sleep" strokeWidth={2} />
              <Line type="monotone" dataKey="energy" stroke="#f59e0b" name="Energy" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Burnout Trend */}
      <div className="bg-slate-700/60 rounded-2xl p-6 hover:bg-slate-700/80 transition-all duration-300">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Monthly Burnout Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="week" tick={{ fill: '#94a3b8' }} />
              <YAxis tick={{ fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Area type="monotone" dataKey="burnout" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Burnout Risk" />
              <Area type="monotone" dataKey="mood" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Mood" />
              <Area type="monotone" dataKey="stress" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="Stress" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="bg-slate-700/60 rounded-2xl p-6 hover:bg-slate-700/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <rec.icon className="h-5 w-5 text-blue-400" />
              <h4 className="font-semibold text-slate-200">{rec.title}</h4>
            </div>
            <p className="text-slate-400 text-sm mb-4">{rec.description}</p>
            <button className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 text-sm font-medium transition-all duration-300 border border-blue-600/30 hover:border-blue-600/50">
              {rec.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BurnoutInsights;