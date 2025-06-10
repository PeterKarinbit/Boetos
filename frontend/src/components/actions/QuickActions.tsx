import React, { useState } from 'react';
import { 
  ZapOff, 
  Brain, 
  CalendarPlus, 
  AlarmClock,
  MessageCircle,
  Timer
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';

const QuickActions: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotifications();
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [focusTimer, setFocusTimer] = useState<number | null>(null);
  
  const toggleFocusMode = () => {
    const newStatus = !focusModeActive;
    setFocusModeActive(newStatus);
    
    if (newStatus) {
      addNotification({
        type: 'success',
        title: 'Focus Mode Activated',
        message: 'Notifications paused for 25 minutes'
      });
      
      // Set a timer for 25 minutes
      const timerId = window.setTimeout(() => {
        setFocusModeActive(false);
        addNotification({
          type: 'info',
          title: 'Focus Mode Ended',
          message: 'Your 25-minute focus session has ended'
        });
        setFocusTimer(null);
      }, 25 * 60 * 1000);
      
      setFocusTimer(timerId);
    } else {
      // Clear the timer if focus mode is manually deactivated
      if (focusTimer) {
        window.clearTimeout(focusTimer);
        setFocusTimer(null);
      }
      
      addNotification({
        type: 'info',
        title: 'Focus Mode Deactivated',
        message: 'Notifications have been restored'
      });
    }
  };
  
  const activateSOSMode = () => {
    addNotification({
      type: 'warning',
      title: 'SOS Mode Activated',
      message: 'Analyzing calendar to suggest tasks to reschedule or delegate'
    });
    
    // Simulate analysis delay
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'SOS Analysis Complete',
        message: 'We\'ve identified 3 meetings that can be rescheduled'
      });
    }, 1500);
  };
  
  const quickVoiceMemo = () => {
    addNotification({
      type: 'info',
      title: 'Voice Memo',
      message: 'Voice memo recording started...'
    });
  };
  
  const scheduleBreak = () => {
    addNotification({
      type: 'success',
      title: 'Break Scheduled',
      message: 'A 15-minute break has been added to your calendar at 3:30 PM'
    });
  };
  
  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Focus Mode Toggle */}
          <button
            onClick={toggleFocusMode}
            className={`p-4 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-300 ${
              focusModeActive
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <ZapOff className={`h-6 w-6 mb-2 ${focusModeActive ? 'text-white' : 'text-blue-500'}`} />
            <span className="font-medium">
              {focusModeActive ? 'End Focus' : 'Focus Mode'}
            </span>
            {focusModeActive && (
              <span className="text-xs mt-1">25 min remaining</span>
            )}
          </button>
          
          {/* SOS Button */}
          <button
            onClick={activateSOSMode}
            className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${
              theme === 'dark'
                ? 'bg-red-900/30 hover:bg-red-900/50 text-red-100'
                : 'bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            <Brain className="h-6 w-6 mb-2 text-red-500" />
            <span className="font-medium">I'm Overwhelmed</span>
            <span className="text-xs mt-1">Get immediate help</span>
          </button>
          
          {/* Voice Memo */}
          <button
            onClick={quickVoiceMemo}
            className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <MessageCircle className="h-6 w-6 mb-2 text-green-500" />
            <span className="font-medium">Voice Memo</span>
            <span className="text-xs mt-1">Record quick thoughts</span>
          </button>
          
          {/* Schedule Break */}
          <button
            onClick={scheduleBreak}
            className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Timer className="h-6 w-6 mb-2 text-amber-500" />
            <span className="font-medium">Schedule Break</span>
            <span className="text-xs mt-1">Find time to recharge</span>
          </button>
          
          {/* Quick Meeting */}
          <button
            className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <CalendarPlus className="h-6 w-6 mb-2 text-purple-500" />
            <span className="font-medium">Quick Meeting</span>
            <span className="text-xs mt-1">Find available time</span>
          </button>
          
          {/* Set Reminder */}
          <button
            className={`p-4 rounded-lg flex flex-col items-center justify-center text-center ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <AlarmClock className="h-6 w-6 mb-2 text-blue-500" />
            <span className="font-medium">Set Reminder</span>
            <span className="text-xs mt-1">Don't forget important tasks</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;