import React from 'react';
import { Battery, Calendar, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { mockWorkloadData } from '../../data/mockData';

const BurnoutInsights: React.FC = () => {
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
  
  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Burnout Insights</h2>
      </div>
      
      <div className="p-6">
        {/* Current Stress Level */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Current Stress Level</h3>
            <span className={`font-semibold ${getStressColor(avgStressLevel)}`}>
              {getStressLabel(avgStressLevel)}
            </span>
          </div>
          
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                avgStressLevel <= 3 ? 'bg-green-500' : 
                avgStressLevel <= 6 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${(avgStressLevel / 10) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Weekly Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-3 rounded-lg text-center ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <span className="block text-lg font-semibold">
              {mockWorkloadData.reduce((sum, day) => sum + day.meetings, 0)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Meetings
            </span>
          </div>
          
          <div className={`p-3 rounded-lg text-center ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <span className="block text-lg font-semibold">
              {mockWorkloadData.reduce((sum, day) => sum + day.focusHours, 0)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Focus Hours
            </span>
          </div>
          
          <div className={`p-3 rounded-lg text-center ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Battery className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <span className="block text-lg font-semibold">
              {Math.round(100 - (avgStressLevel * 10))}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Energy
            </span>
          </div>
        </div>
        
        {/* Weekly Workload Visualization */}
        <div className="mb-4">
          <h3 className="font-medium mb-3">Weekly Workload</h3>
          <div className="flex items-end h-32 space-x-2">
            {mockWorkloadData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full flex flex-col-reverse">
                  <div 
                    className="w-full bg-red-500 opacity-60 rounded-t-sm"
                    style={{ height: `${day.stressLevel * 10}%` }}
                  ></div>
                  <div 
                    className="w-full bg-blue-500 opacity-60"
                    style={{ height: `${day.meetings * 10}%` }}
                  ></div>
                  <div 
                    className="w-full bg-green-500 opacity-60 rounded-t-sm"
                    style={{ height: `${day.focusHours * 10}%` }}
                  ></div>
                </div>
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  {day.day.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4 mt-2">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-500 opacity-60 rounded-sm mr-1"></span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Meetings</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 opacity-60 rounded-sm mr-1"></span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Focus</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-red-500 opacity-60 rounded-sm mr-1"></span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Stress</span>
            </div>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className={`mt-4 p-3 rounded-lg ${
          theme === 'dark' ? 'bg-blue-900/30 text-blue-100' : 'bg-blue-50 text-blue-800'
        }`}>
          <h4 className="font-medium mb-1">Suggestion</h4>
          <p className="text-sm">
            Consider scheduling a 30-minute break this afternoon. Your calendar shows 3+ hours of consecutive meetings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BurnoutInsights;