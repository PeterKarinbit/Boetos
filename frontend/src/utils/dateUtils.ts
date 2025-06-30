/**
 * Formats a date into a human-readable string
 * @param date - The date to format (string, number, or Date object)
 * @param options - Intl.DateTimeFormatOptions to customize the output
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid date';
  }
};

/**
 * Calculates the time difference between now and a future date
 * @param futureDate - The future date to compare against
 * @returns Object containing days, hours, and minutes until the future date
 */
export const getTimeUntil = (futureDate: string | number | Date): { 
  days: number; 
  hours: number; 
  minutes: number;
  seconds: number;
  isPast: boolean;
  toString: () => string;
} => {
  const now = new Date();
  const future = typeof futureDate === 'string' || typeof futureDate === 'number'
    ? new Date(futureDate)
    : futureDate;

  let diff = future.getTime() - now.getTime();
  const isPast = diff < 0;
  
  // If the date is in the past, return zeros
  if (isPast) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast,
      toString: () => 'Now',
    };
  }

  // Convert to seconds, minutes, hours, days
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
    isPast,
    toString: () => {
      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      if (minutes > 0) return `${minutes}m`;
      return 'Less than a minute';
    },
  };
};

/**
 * Checks if two dates are on the same day
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns boolean indicating if the dates are on the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Gets the start of the day for a given date
 * @param date - The date to get the start of
 * @returns A new Date object set to the start of the day (00:00:00)
 */
export const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Gets the end of the day for a given date
 * @param date - The date to get the end of
 * @returns A new Date object set to the end of the day (23:59:59.999)
 */
export const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Adds a specified number of days to a date
 * @param date - The starting date
 * @param days - Number of days to add (can be negative to subtract)
 * @returns A new Date with the days added
 */
export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Formats a duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

/**
 * Checks if a date is today
 * @param date - The date to check
 * @returns boolean indicating if the date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

/**
 * Checks if a date is tomorrow
 * @param date - The date to check
 * @returns boolean indicating if the date is tomorrow
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
};
