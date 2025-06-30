import React from 'react';
import { AlertTriangle, TrendingUp, Clock, Calendar, Heart } from 'lucide-react';
import { BurnoutAnalysis as BurnoutAnalysisType } from '../../services/mentalHealthService';

interface BurnoutAnalysisProps {
  analysis: BurnoutAnalysisType;
}

export const BurnoutAnalysis: React.FC<BurnoutAnalysisProps> = ({ analysis }) => {
  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'text-red-500';
    if (score >= 5) return 'text-yellow-500';
    if (score >= 2.5) return 'text-blue-500';
    return 'text-green-500';
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-red-500';
    if (value >= 60) return 'text-yellow-500';
    if (value >= 40) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Burnout Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            Burnout Risk Analysis
          </h3>
          <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score.toFixed(1)}/10
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{analysis.insights}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-blue-500" size={20} />
            <h4 className="font-semibold text-gray-800 dark:text-white">Meeting Density</h4>
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(analysis.metrics.meetingDensity)}`}>
            {analysis.metrics.meetingDensity.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-purple-500" size={20} />
            <h4 className="font-semibold text-gray-800 dark:text-white">Work Hours</h4>
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(analysis.metrics.workHours)}`}>
            {analysis.metrics.workHours.toFixed(1)}h
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="text-red-500" size={20} />
            <h4 className="font-semibold text-gray-800 dark:text-white">Break Score</h4>
          </div>
          <div className={`text-2xl font-bold ${getMetricColor(analysis.metrics.breakScore)}`}>
            {analysis.metrics.breakScore.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Patterns and Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Detected Patterns</h3>
        <div className="space-y-4">
          {analysis.patterns.map((pattern, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                pattern.severity === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                  : pattern.severity === 'medium'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
              }`}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">{pattern.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Recommendations</h3>
        <ul className="space-y-3">
          {analysis.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <p className="text-gray-600 dark:text-gray-300">{recommendation}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 