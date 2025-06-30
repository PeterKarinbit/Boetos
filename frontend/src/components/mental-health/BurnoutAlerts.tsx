import React from 'react';
import { AlertTriangle, Bell, Info } from 'lucide-react';
import { Alert } from '../../services/mentalHealthService';

interface BurnoutAlertsProps {
  alerts: Alert[];
}

export const BurnoutAlerts: React.FC<BurnoutAlertsProps> = ({ alerts }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'high-risk':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'pattern-alert':
        return <Bell className="text-yellow-500" size={20} />;
      case 'weekend-work':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
      case 'low':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-500';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
        <p className="text-green-700 dark:text-green-300">
          No concerning patterns detected. Your schedule looks healthy!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <div key={index} className={`p-4 rounded-lg ${getAlertColor(alert.severity)}`}>
          <div className="flex items-start gap-3">
            {getAlertIcon(alert.type)}
            <div className="flex-1">
              <p className="text-gray-700 dark:text-gray-300">{alert.message}</p>
              {alert.pattern && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Pattern Details: {alert.pattern.description}</p>
                  <p className="text-xs mt-1">
                    Frequency: {alert.pattern.frequency} | Detected: {new Date(alert.pattern.detectedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 