import { MeetingReminder } from '../types/meeting';
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns';

/**
 * Formats a date range into a readable string
 * @param start - Start date string (ISO format)
 * @param end - End date string (ISO format)
 * @returns Formatted time range string (e.g., "2:00 PM - 3:30 PM")
 */
export const formatTimeRange = (start: string, end: string): string => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  
  const timeFormat = 'h:mm a';
  return `${format(startDate, timeFormat)} - ${format(endDate, timeFormat)}`;
};

/**
 * Gets a friendly date string (Today, Tomorrow, or formatted date)
 * @param date - Date string (ISO format)
 * @returns Friendly date string
 */
export const getFriendlyDate = (date: string): string => {
  const dateObj = parseISO(date);
  
  if (isToday(dateObj)) return 'Today';
  if (isTomorrow(dateObj)) return 'Tomorrow';
  
  return format(dateObj, 'EEEE, MMM d');
};

/**
 * Gets the time until a meeting starts in a human-readable format
 * @param startTime - Start time string (ISO format)
 * @returns Time until meeting starts (e.g., "in 30 min", "in 2h 15m")
 */
export const getTimeUntilMeeting = (startTime: string): string => {
  const now = new Date();
  const meetingTime = parseISO(startTime);
  const diffInMinutes = differenceInMinutes(meetingTime, now);
  
  if (diffInMinutes <= 0) return 'Now';
  
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;
  
  if (hours > 0) {
    return `in ${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  }
  
  return `in ${minutes}m`;
};

/**
 * Groups meetings by date
 * @param meetings - Array of meeting reminders
 * @returns Object with dates as keys and arrays of meetings as values
 */
export const groupMeetingsByDate = (meetings: MeetingReminder[]) => {
  const groups: { [key: string]: MeetingReminder[] } = {
    'Today': [],
    'Tomorrow': [],
    'Upcoming': [],
  };
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  meetings.forEach(meeting => {
    const meetingDate = parseISO(meeting.startTime);
    
    if (isToday(meetingDate)) {
      groups['Today'].push(meeting);
    } else if (isTomorrow(meetingDate)) {
      groups['Tomorrow'].push(meeting);
    } else {
      groups['Upcoming'].push(meeting);
    }
  });
  
  // Sort meetings within each group by start time
  Object.values(groups).forEach(group => {
    group.sort((a, b) => 
      parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
    );
  });
  
  return groups;
};

/**
 * Gets the next upcoming meeting
 * @param meetings - Array of meeting reminders
 * @returns The next upcoming meeting or null if none found
 */
export const getNextMeeting = (meetings: MeetingReminder[]): MeetingReminder | null => {
  const now = new Date();
  const upcoming = meetings
    .filter(meeting => parseISO(meeting.startTime) > now)
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
  
  return upcoming.length > 0 ? upcoming[0] : null;
};

/**
 * Gets meetings happening now
 * @param meetings - Array of meeting reminders
 * @returns Array of meetings happening now
 */
export const getCurrentMeetings = (meetings: MeetingReminder[]): MeetingReminder[] => {
  const now = new Date();
  
  return meetings.filter(meeting => {
    const start = parseISO(meeting.startTime);
    const end = meeting.endTime ? parseISO(meeting.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
    
    return now >= start && now <= end;
  });
};

/**
 * Gets meetings starting soon (within the next 30 minutes)
 * @param meetings - Array of meeting reminders
 * @returns Array of meetings starting soon
 */
export const getUpcomingSoonMeetings = (meetings: MeetingReminder[]): MeetingReminder[] => {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
  
  return meetings
    .filter(meeting => {
      const start = parseISO(meeting.startTime);
      return start > now && start <= soon;
    })
    .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime());
};

/**
 * Gets the stress level as a human-readable string
 * @param score - Stress score (0-10)
 * @returns Object containing level name and color classes
 */
export const getStressLevel = (score: number) => {
  if (score >= 7) {
    return {
      level: 'High',
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    };
  }
  if (score >= 4) {
    return {
      level: 'Medium',
      color: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    };
  }
  return {
    level: 'Low',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  };
};
