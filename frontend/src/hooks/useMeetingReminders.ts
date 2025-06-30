import { useState, useEffect, useCallback } from 'react';
import { getMeetingReminders, snoozeReminder, dismissReminder } from '../services/meetingService';
import { MeetingReminder } from '../types/meeting';
import { useNotification } from '../contexts/NotificationContext';

interface UseMeetingRemindersReturn {
  reminders: MeetingReminder[];
  isLoading: boolean;
  error: string | null;
  refreshReminders: () => Promise<void>;
  handleSnooze: (eventId: string, minutes: number) => Promise<void>;
  handleDismiss: (eventId: string) => Promise<void>;
}

/**
 * Custom hook to manage meeting reminders
 * Handles fetching, refreshing, snoozing, and dismissing reminders
 */
const useMeetingReminders = (): UseMeetingRemindersReturn => {
  const [reminders, setReminders] = useState<MeetingReminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  // Fetch reminders from the API
  const fetchReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMeetingReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to fetch meeting reminders:', err);
      setError('Failed to load meeting reminders. Please try again later.');
      showNotification({
        type: 'error',
        message: 'Failed to load meeting reminders',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Initial fetch on mount
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Set up polling to refresh reminders
  useEffect(() => {
    const interval = setInterval(fetchReminders, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchReminders]);

  // Handle snoozing a reminder
  const handleSnooze = useCallback(async (eventId: string, minutes: number) => {
    try {
      await snoozeReminder(eventId, minutes);
      await fetchReminders();
      showNotification({
        type: 'success',
        message: `Reminder snoozed for ${minutes} minutes`,
      });
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      showNotification({
        type: 'error',
        message: 'Failed to snooze reminder',
      });
      throw error;
    }
  }, [fetchReminders, showNotification]);

  // Handle dismissing a reminder
  const handleDismiss = useCallback(async (eventId: string) => {
    try {
      await dismissReminder(eventId);
      setReminders(prev => prev.filter(r => r.eventId !== eventId));
      showNotification({
        type: 'success',
        message: 'Reminder dismissed',
      });
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      showNotification({
        type: 'error',
        message: 'Failed to dismiss reminder',
      });
      throw error;
    }
  }, [showNotification]);

  return {
    reminders,
    isLoading,
    error,
    refreshReminders: fetchReminders,
    handleSnooze,
    handleDismiss,
  };
};

export default useMeetingReminders;
