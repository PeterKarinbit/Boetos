import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, MapPin, Zap, X, Clock as ClockIcon } from 'lucide-react';
import { getMeetingReminders, snoozeReminder, dismissReminder } from '../../services/meetingService';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { useNotificationContext } from '../../contexts/NotificationContext';

type MeetingReminder = {
  eventId: string;
  title: string;
  startTime: string;
  location?: string;
  reminder?: string;
  travelTimeMinutes: number;
  stressScore: number;
};

type SnoozeOption = {
  label: string;
  minutes: number;
};

const SNOOZE_OPTIONS: SnoozeOption[] = [
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: '1 hour', minutes: 60 },
];

const MeetingReminders: React.FC = () => {
  const [reminders, setReminders] = useState<MeetingReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const { user } = useUser();
  const { theme } = useTheme();
  const { showError } = useNotificationContext();

  const fetchReminders = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await getMeetingReminders();
      setReminders(data);
      setError(null);
    } catch (err) {
      setError('Failed to load meeting reminders. Please try again later.');
      showError('Failed to load meeting reminders');
      console.error('Failed to load meeting reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSnooze = async (eventId: string, minutes: number) => {
    try {
      await snoozeReminder(eventId, minutes);
      await fetchReminders();
      toast.success(`Reminder snoozed for ${minutes} minutes`);
    } catch {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleDismiss = async (eventId: string) => {
    try {
      await dismissReminder(eventId);
      setReminders(reminders.filter(r => r.eventId !== eventId));
      showNotification({
        type: 'success',
        message: 'Reminder dismissed',
      });
    } catch {
      showNotification({
        type: 'error',
        message: 'Failed to dismiss reminder',
      });
    }
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const formatTimeUntil = (startTime: string): string => {
    const now = new Date();
    const meetingTime = new Date(startTime);
    const diffMs = meetingTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins <= 0) return 'Now';
    if (diffMins < 60) return `in ${diffMins} min`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `in ${hours}h${mins > 0 ? ` ${mins}m` : ''}`.trim();
  };

  const getStressLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score >= 7) {
      return {
        level: 'High',
        color: 'text-red-800 dark:text-red-300',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      };
    }
    if (score >= 4) {
      return {
        level: 'Medium',
        color: 'text-yellow-800 dark:text-yellow-300',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      };
    }
    return {
      level: 'Low',
      color: 'text-green-800 dark:text-green-300',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    };
  };

  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200 dark:border-red-800`}>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-500" />
          Upcoming Meetings
        </h3>
        <p className="text-gray-500 dark:text-gray-400">No upcoming meetings. Enjoy your free time! 😊</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-blue-500" />
        Upcoming Meetings
      </h3>
      <div className="space-y-3">
        {reminders.map((meeting) => {
          const stress = getStressLevel(meeting.stressScore);
          const isExpanded = expandedEventId === meeting.eventId;
          return (
            <div
              key={meeting.eventId}
              className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              } ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div
                className="p-3 cursor-pointer"
                onClick={() => toggleExpand(meeting.eventId)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h4 className="font-medium truncate">{meeting.title}</h4>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {formatTimeUntil(meeting.startTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(meeting.startTime).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {meeting.location && (
                      <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{meeting.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stress.bgColor} ${stress.color}`}>
                      {stress.level} Stress
                    </span>
                    <button
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(meeting.eventId);
                      }}
                      aria-label="Dismiss reminder"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-gray-200 dark:border-gray-600">
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-300">{meeting.reminder}</p>
                    {meeting.travelTimeMinutes > 0 && (
                      <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
                        <Zap className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>Leave in {meeting.travelTimeMinutes} min to arrive on time</span>
                      </div>
                    )}
                    {meeting.stressScore >= 7 && (
                      <div className="mt-2 flex items-start text-sm text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Consider preparing talking points or delegating tasks to reduce stress.</span>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Snooze:</span>
                        <div className="flex space-x-2">
                          {SNOOZE_OPTIONS.map((option) => (
                            <button
                              key={option.minutes}
                              onClick={() => handleSnooze(meeting.eventId, option.minutes)}
                              className={`px-2 py-1 text-xs rounded-full flex items-center ${
                                theme === 'dark'
                                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                              }`}
                            >
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingReminders;