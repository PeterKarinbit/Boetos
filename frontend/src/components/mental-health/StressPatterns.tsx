import React from 'react';
import { AlertTriangle, Clock, Calendar, TrendingUp } from 'lucide-react';
import { StressPattern } from '../../services/mentalHealthService';

interface StressPatternsProps {
  patterns: StressPattern[];
}

export const StressPatterns: React.FC<StressPatternsProps> = ({ patterns }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'high-meeting-day':
        return <Calendar className="text-blue-500" size={20} />;
      case 'back-to-back-meetings':
        return <Clock className="text-purple-500" size={20} />;
      case 'long-work-day':
        return <TrendingUp className="text-orange-500" size={20} />;
      case 'insufficient-breaks':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <AlertTriangle className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="text-orange-500" size={20} />
          Stress Patterns
        </h3>

        <div className="space-y-4">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className={`p-4 rounded-lg ${
                pattern.severity === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : pattern.severity === 'medium'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20'
                  : 'bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {getPatternIcon(pattern.patternType)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      {pattern.patternType.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h4>
                    <span className={`text-sm font-medium ${getSeverityColor(pattern.severity)}`}>
                      {pattern.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {pattern.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Frequency: {pattern.frequency}</span>
                    <span>Detected: {new Date(pattern.detectedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 