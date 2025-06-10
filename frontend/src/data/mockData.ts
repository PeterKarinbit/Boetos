import { User } from '../contexts/UserContext';
import { CalendarEvent } from '../types/calendar';

export const mockUserData: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@startup.co',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  preferences: {
    notificationsEnabled: true,
    voiceCommandsEnabled: true,
    burnoutPreventionEnabled: true,
    focusHours: { start: 9, end: 12 }
  }
};

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    type: 'meeting',
    location: 'Conference Room A',
    preparationNeeded: true,
    preparationTime: 30,
    attendees: 5
  },
  {
    id: 'event-2',
    title: 'Investor Pitch',
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
    type: 'meeting',
    location: 'Conference Room A',
    preparationNeeded: true,
    preparationTime: 60,
  },
  {
    id: 'event-3',
    title: 'Product Review',
    start: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(11, 0, 0, 0),
    end: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(12, 0, 0, 0),
    type: 'meeting',
    location: 'Office',
    preparationNeeded: true,
    preparationTime: 30,
  },
  {
    id: 'event-4',
    title: 'Focus Time: Development',
    start: new Date(new Date().setHours(16, 0, 0, 0)),
    end: new Date(new Date().setHours(18, 0, 0, 0)),
    type: 'focus',
    location: 'Home Office',
    preparationNeeded: false,
    preparationTime: 0
  },
  {
    id: 'event-5',
    title: 'Customer Call',
    start: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(15, 30, 0, 0),
    end: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(16, 0, 0, 0),
    type: 'meeting',
    location: 'Phone',
    preparationNeeded: true,
    preparationTime: 15,
  },
];

export const mockWorkloadData = [
  { day: 'Monday', meetings: 4, focusHours: 3, stressLevel: 6 },
  { day: 'Tuesday', meetings: 6, focusHours: 2, stressLevel: 8 },
  { day: 'Wednesday', meetings: 3, focusHours: 4, stressLevel: 5 },
  { day: 'Thursday', meetings: 5, focusHours: 2, stressLevel: 7 },
  { day: 'Friday', meetings: 2, focusHours: 5, stressLevel: 4 },
];

export const mockNotifications = [
  {
    id: 'notif-1',
    type: 'warning',
    title: 'Investor Pitch',
    message: 'Preparation time needed: 60 minutes before 2:00 PM',
    time: new Date(new Date().setHours(new Date().getHours() - 2)),
    isRead: false,
  },
  {
    id: 'notif-2',
    type: 'info',
    title: 'Break Time',
    message: "You've been working for 2 hours straight. Time for a short break?",
    time: new Date(new Date().setHours(new Date().getHours() - 1)),
    isRead: true,
  },
  {
    id: 'notif-3',
    type: 'success',
    title: 'Focus Time',
    message: 'Your Focus Time block starts in 15 minutes',
    time: new Date(),
    isRead: false,
  },
];