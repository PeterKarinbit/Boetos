import React, { useState } from 'react';
import { 
  ZapOff, 
  Brain, 
  CalendarPlus, 
  AlarmClock,
  MessageCircle,
  Timer,
  Clock
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { askAiOverwhelmed } from '../../services/api';
import { useFocusMode } from '../../contexts/FocusModeContext';

const QuickActions: React.FC = () => {
  const { theme } = useTheme();
  const { /* addNotification */ } = useNotificationContext(); // TODO: update to use correct notification method or remove if not available
  const navigate = useNavigate();
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showOverwhelmedModal, setShowOverwhelmedModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [focusHour, setFocusHour] = useState(1);
  const [focusMinute, setFocusMinute] = useState(0);
  const [focusAmPm, setFocusAmPm] = useState<'AM' | 'PM'>('AM');
  const { start: startFocusMode, active: focusModeActive, remaining: focusRemaining, cancel: cancelFocusMode } = useFocusMode();
  
  const toggleFocusMode = () => {
    if (!focusModeActive) {
      setShowFocusModal(true);
    } else {
      cancelFocusMode();
      // TODO: Implement notification logic using useNotificationContext if needed
    }
  };
  
  const activateSOSMode = () => {
    // TODO: Implement notification logic using useNotificationContext if needed
  };
  
  const quickVoiceMemo = () => {
    // TODO: Implement notification logic using useNotificationContext if needed
  };
  
  const scheduleBreak = () => {
    // TODO: Implement notification logic using useNotificationContext if needed
  };

  // Overwhelmed button handler - now shows coming soon
  const handleOverwhelmed = () => {
    setShowComingSoonModal(true);
  };

  const handleAskAi = async () => {
    setAiLoading(true);
    setAiResponse('');
    try {
      const data = await askAiOverwhelmed();
      setAiResponse(data?.output || 'No response from AI.');
    } catch (err) {
      setAiResponse('Failed to get help from AI.');
    } finally {
      setAiLoading(false);
    }
  };

  // Quick Meeting handler
  const handleQuickMeeting = () => {
    navigate('/calendar');
  };

  // Set Reminder handler
  const handleSetReminder = () => {
    setShowReminderModal(true);
  };

  // Memory Assistant
  const goToMemory = () => {
    setShowReminderModal(false);
    navigate('/memory');
  };

  // Create Boetos Task
  const goToBoetosTask = () => {
    setShowReminderModal(false);
    navigate('/calendar?boetosTask=1');
  };

  // Go to Burnout Page
  const goToBurnout = () => {
    setShowOverwhelmedModal(false);
    navigate('/burnout');
  };

  // Custom time picker OK handler
  const handleFocusTimeOk = () => {
    let hour = focusHour % 12;
    if (focusAmPm === 'PM') hour += 12;
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, focusMinute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const duration = Math.round((target.getTime() - now.getTime()) / 60000); // in minutes
    startFocusMode(duration, 'Focus Mode: Stay on task!');
    setShowFocusModal(false);
    // TODO: Implement notification logic using useNotificationContext if needed
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Quick Actions</h2>
        <p className="text-slate-400 mt-1">Essential tools for your productivity</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Focus Mode Toggle */}
        <button
          onClick={toggleFocusMode}
          className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 ${
            focusModeActive
              ? 'bg-blue-500/80 text-white shadow-lg hover:bg-blue-500'
              : 'bg-slate-700/60 hover:bg-slate-700/80 text-slate-200 hover:shadow-lg'
          }`}
          disabled={focusModeActive && focusRemaining > 0}
        >
          <ZapOff className={`h-6 w-6 mb-2 ${focusModeActive ? 'text-white' : 'text-blue-400'}`} />
          <span className="font-medium">
            {focusModeActive ? 'End Focus' : 'Focus Mode'}
          </span>
          {focusModeActive && (
            <span className="text-xs mt-1 text-blue-100">
              {Math.floor(focusRemaining / 60)}:{(focusRemaining % 60).toString().padStart(2, '0')} min remaining
            </span>
          )}
        </button>
        
        {/* SOS Button - Now shows coming soon */}
        <button
          onClick={handleOverwhelmed}
          className="p-4 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-700/60 hover:bg-slate-700/80 text-slate-200 transition-all duration-300 hover:shadow-lg relative group"
        >
          <Brain className="h-6 w-6 mb-2 text-red-400" />
          <span className="font-medium">I'm Overwhelmed</span>
          <span className="text-xs mt-1 text-slate-400">Get immediate help</span>
          {/* Coming Soon Badge */}
          <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
            SOON
          </div>
        </button>
        
        {/* Quick Meeting */}
        <button
          onClick={handleQuickMeeting}
          className="p-4 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-700/60 hover:bg-slate-700/80 text-slate-200 transition-all duration-300 hover:shadow-lg"
        >
          <CalendarPlus className="h-6 w-6 mb-2 text-purple-400" />
          <span className="font-medium">Quick Meeting</span>
          <span className="text-xs mt-1 text-slate-400">Find available time</span>
        </button>
        
        {/* Set Reminder */}
        <button
          onClick={handleSetReminder}
          className="p-4 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-700/60 hover:bg-slate-700/80 text-slate-200 transition-all duration-300 hover:shadow-lg"
        >
          <AlarmClock className="h-6 w-6 mb-2 text-blue-400" />
          <span className="font-medium">Set Reminder</span>
          <span className="text-xs mt-1 text-slate-400">Don't forget important tasks</span>
        </button>
      </div>
      
      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl w-96 max-w-sm mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                Coming Soon!
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Our advanced AI assistant powered by LangChain is currently in development. 
                This feature will provide intelligent help when you're feeling overwhelmed.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  🚀 Expected Release: Q1 2025
                </p>
              </div>
              <button
                className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors duration-200"
                onClick={() => setShowComingSoonModal(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Focus Mode Modal */}
      {showFocusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-80">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Enter Time</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <input
                type="number"
                min={1}
                max={12}
                value={focusHour}
                onChange={e => setFocusHour(Math.max(1, Math.min(12, Number(e.target.value))))}
                className="w-16 text-2xl text-center border-2 border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-2xl font-bold text-slate-700">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={focusMinute}
                onChange={e => setFocusMinute(Math.max(0, Math.min(59, Number(e.target.value))))}
                className="w-16 text-2xl text-center border-2 border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex flex-col ml-2">
                <button
                  className={`px-2 py-1 rounded ${focusAmPm === 'AM' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-white text-slate-700'}`}
                  onClick={() => setFocusAmPm('AM')}
                  type="button"
                >AM</button>
                <button
                  className={`px-2 py-1 rounded mt-1 ${focusAmPm === 'PM' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-white text-slate-700'}`}
                  onClick={() => setFocusAmPm('PM')}
                  type="button"
                >PM</button>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                className="text-purple-600 font-semibold hover:underline"
                onClick={() => setShowFocusModal(false)}
                type="button"
              >CANCEL</button>
              <button
                className="text-purple-600 font-semibold hover:underline"
                onClick={handleFocusTimeOk}
                type="button"
              >OK</button>
            </div>
          </div>
        </div>
      )}
      {/* Overwhelmed Modal */}
      {showOverwhelmedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Feeling Overwhelmed?</h3>
            <p className="mb-4 text-slate-700">Would you like to ask the AI for help or go to the Burnout page for recommendations?</p>
            <div className="flex flex-col gap-3 mb-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={handleAskAi}
                disabled={aiLoading}
              >{aiLoading ? 'Asking AI...' : 'Ask AI for Help'}</button>
              <button
                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
                onClick={goToBurnout}
              >Go to Burnout Page</button>
            </div>
            {aiResponse && (
              <div className="bg-slate-100 rounded p-3 text-slate-800 border border-slate-200 mb-2 max-h-40 overflow-y-auto">
                {aiResponse}
              </div>
            )}
            <div className="flex justify-end">
              <button
                className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                onClick={() => setShowOverwhelmedModal(false)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Set Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Set a Reminder</h3>
            <p className="mb-4 text-slate-700">Choose how you want to set your reminder:</p>
            <div className="flex flex-col gap-3 mb-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={goToMemory}
              >Memory Assistant</button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={goToBoetosTask}
              >Create Boetos Task</button>
            </div>
            <div className="flex justify-end">
              <button
                className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
                onClick={() => setShowReminderModal(false)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;