import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { useUser } from '../contexts/UserContext';
import { Spinner } from '../components/Spinner';
import api, { createBoetosTask } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Briefcase, CheckSquare, Brain, PlusCircle, Rocket, X } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id?: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  colorId?: string;
  calendarId?: string;
  calendarSummary?: string;
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: string;
  htmlLink?: string;
  resource?: any;
  event_type?: string;
  category?: string;
  calendar_source?: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

const vibrantColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
  '#A3E4D7', '#F9E79F', '#FADBD8', '#D5DBDB', '#AED6F1'
];

const CalendarSummary: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
  const summary = useMemo(() => {
    const counts = { meetings: 0, tasks: 0, reminders: 0, other: 0 };
    events.forEach(event => {
      const type = event.resource?.type || event.calendarSummary?.toLowerCase();
      if (type === 'memory') {
        counts.reminders++;
      } else if (type?.includes('meeting')) {
        counts.meetings++;
      } else if (type?.includes('task')) {
        counts.tasks++;
      } else {
        counts.other++;
      }
    });
    return counts;
  }, [events]);

  return (
    <div className="p-6 mb-6 bg-white/50 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-around text-slate-700 dark:text-slate-200">
        <div className="text-center">
          <Briefcase className="mx-auto mb-2 text-blue-400 h-6 w-6" />
          <p className="font-bold text-2xl text-slate-900 dark:text-slate-100">{summary.meetings}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Meetings</p>
        </div>
        <div className="text-center">
          <CheckSquare className="mx-auto mb-2 text-green-400 h-6 w-6" />
          <p className="font-bold text-2xl text-slate-900 dark:text-slate-100">{summary.tasks}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Tasks</p>
        </div>
        <div className="text-center">
          <Brain className="mx-auto mb-2 text-purple-400 h-6 w-6" />
          <p className="font-bold text-2xl text-slate-900 dark:text-slate-100">{summary.reminders}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Memories</p>
        </div>
      </div>
    </div>
  );
};

// TasksList component
function TasksList({ tasks }: { tasks: CalendarEvent[] }) {
  if (!tasks.length) return (
    <div className="mt-8 p-6 bg-slate-800/30 rounded-2xl text-slate-400 text-center">No Boetos Tasks yet.</div>
  );
  return (
    <div className="mt-8 p-6 bg-slate-800/30 rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Boetos Tasks</h3>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-700/40 rounded-xl p-4 border border-slate-600/30">
            <div className="flex-1">
              <div className="font-semibold text-slate-200 mb-1">{task.title}</div>
              <div className="text-xs text-slate-400 mb-1">{task.event_type || 'Task'} | {new Date(task.start).toLocaleDateString()} {new Date(task.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(task.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-600/50 rounded-full text-xs text-slate-300">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                {task.category || task.event_type || 'Task'}
              </div>
            </div>
            {/* Timer/Status placeholder for future integration */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status: <span className="text-green-400">Scheduled</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarView() {
  const { user, login } = useUser();
  const { theme } = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [eventDetails, setEventDetails] = useState<CalendarEvent | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showBoetosTaskModal, setShowBoetosTaskModal] = useState(false);
  const [boetosTask, setBoetosTask] = useState({
    title: '',
    description: '',
    duration: '00:25', // store as HH:mm for duration
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    time: new Date().toTimeString().slice(0, 5), // HH:mm
    category: 'Deep Work',
  });
  const [isCreatingBoetosTask, setIsCreatingBoetosTask] = useState(false);
  const boetosCategories = [
    'Deep Work',
    'Chill Task',
    'Quick Fix',
    'Focus Sprint',
    'Breakthrough',
  ];
  const { startTimer } = useTimer();
  const [aiSuggestedDate, setAiSuggestedDate] = useState('');
  const [aiSuggestedTime, setAiSuggestedTime] = useState('');
  const [aiSuggestionMsg, setAiSuggestionMsg] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (viewStartDate: Date, viewEndDate: Date) => {
    if (!user) return;
    try {
      setLoading(true);
      const momentView = view === 'agenda' || view === 'work_week' ? 'week' : view;
      const startDate = moment(viewStartDate).startOf(momentView).toISOString();
      const endDate = moment(viewEndDate).endOf(momentView).toISOString();

      const response = await api.get<CalendarEvent[]>('/api/calendar/events', {
        params: { startDate, endDate },
      });

      const formattedEvents = response.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      setEvents(formattedEvents);
      setError(null);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, view]);

  const handleEventCreate = useCallback(async (event: CalendarEvent) => {
    try {
      setIsCreatingEvent(true);
      const response = await api.post<CalendarEvent>('/api/calendar/events', event);
      setEvents(prev => [...prev, response.data]);
      setError(null);
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsCreatingEvent(false);
    }
  }, []);

  const handleEventSelect = useCallback(async (event: CalendarEvent) => {
    setSelectedEvent(event);
    try {
      const response = await api.get<CalendarEvent>(`/api/calendar/events/${event.id}`);
      setEventDetails(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to fetch event details. Please try again.');
    }
  }, []);

  const handleEventUpdate = useCallback(async (event: CalendarEvent) => {
    try {
      const response = await api.put<CalendarEvent>(`/api/calendar/events/${event.id}`, event);
      setEvents(prev => prev.map(e => e.id === event.id ? response.data : e));
      setSelectedEvent(null);
      setShowDetailModal(false);
      setError(null);
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event. Please try again.');
    }
  }, []);

  const handleEventDelete = useCallback(async (eventId: string) => {
    try {
      await api.delete(`/api/calendar/events/${eventId}`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      setShowDetailModal(false);
      setError(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
    }
  }, []);

  const handleEditEvent = useCallback(async () => {
    if (!editingEvent || !editTitle) return;

    try {
      const updatedEvent: CalendarEvent = {
        ...editingEvent,
        title: editTitle,
        description: editDescription,
      };

      await handleEventUpdate(updatedEvent);
      setShowEditModal(false);
      setEditingEvent(null);
      setEditTitle('');
      setEditDescription('');
    } catch (error) {
      const apiError = error as ApiError;
      setError(`Failed to update event: ${apiError.response?.data?.error || apiError.message || 'Unknown error'}`);
    }
  }, [editingEvent, editTitle, editDescription, handleEventUpdate]);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const errorFromUrl = params.get('error');
    if (errorFromUrl) {
      setUrlError(decodeURIComponent(errorFromUrl));
      // Optionally, remove error from URL after showing
      window.history.replaceState({}, '', window.location.pathname);
    }

    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (!user && token) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.data && res.data.email) {
            login(res.data, token);
          } else {
            throw new Error('Invalid user data');
          }
        } catch (error) {
          localStorage.removeItem('token');
          setError('Your session has expired. Please log in again.');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [login, user]);

  useEffect(() => {
    const momentView = view === 'agenda' || view === 'work_week' ? 'week' : view;
    const startOfMonth = moment(date).startOf(momentView).toDate();
    const endOfMonth = moment(date).endOf(momentView).toDate();
    fetchEvents(startOfMonth, endOfMonth);
  }, [date, view, fetchEvents]);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setNewEventTitle('');
    setNewEventDescription('');
    setShowCreateModal(true);
  }, []);

  const handleCreateEvent = async () => {
    if (!selectedSlot || !newEventTitle) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to create events.');
      return;
    }

    const newEvent: CalendarEvent = {
      title: newEventTitle,
      description: newEventDescription,
      start: selectedSlot.start,
      end: selectedSlot.end,
    };

    try {
      setIsCreatingEvent(true);
      await handleEventCreate(newEvent);
      setShowCreateModal(false);
      setNewEventTitle('');
      setNewEventDescription('');
    } catch (error) {
      const apiError = error as ApiError;
      setError(`Failed to create event: ${apiError.response?.data?.error || apiError.message || 'Unknown error'}`);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const eventPropGetter = useCallback((event: CalendarEvent, start: Date, end: Date, isSelected: boolean) => {
    const eventHash = event.title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colorIndex = Math.abs(eventHash) % vibrantColors.length;
    const backgroundColor = vibrantColors[colorIndex];
    
    return {
      style: {
        backgroundColor,
        border: 'none',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (view === 'agenda') {
      return events.filter(event => 
        !event.calendarSummary?.toLowerCase().includes('holiday') && 
        !event.calendarSummary?.toLowerCase().includes('birthday')
      );
    }
    return events;
  }, [events, view]);

  const calendarStyle = {
    height: 600,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const handleBoetosTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBoetosTask({ ...boetosTask, [e.target.name]: e.target.value });
  };

  const handleBoetosTaskDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBoetosTask({ ...boetosTask, date: e.target.value });
  };

  const handleBoetosTaskDurationChange = (value: string | null) => {
    setBoetosTask({ ...boetosTask, duration: value || '' });
  };

  const handleBoetosTaskTimeChange = (value: string | null) => {
    setBoetosTask({ ...boetosTask, time: value || '' });
  };

  const handleUseAiSuggestion = () => {
    setBoetosTask((prev) => ({ ...prev, date: aiSuggestedDate, time: aiSuggestedTime }));
  };

  const handleCreateBoetosTask = async () => {
    if (!boetosTask.title) return;
    setIsCreatingBoetosTask(true);
    try {
      // Combine date and time into ISO string
      const start = new Date(`${boetosTask.date}T${boetosTask.time}`);
      // Convert duration (HH:mm) to minutes
      const [h, m] = boetosTask.duration.split(':').map(Number);
      const duration = h * 60 + m;
      const payload = {
        ...boetosTask,
        start,
        duration,
      };
      const created = await createBoetosTask(payload);
      setEvents(prev => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          description: created.description,
          start: new Date(created.start_time),
          end: new Date(created.end_time),
          event_type: created.event_type,
          calendar_source: created.calendar_source,
        }
      ]);
      setShowBoetosTaskModal(false);
      setBoetosTask({ title: '', description: '', duration: '00:25', date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), category: 'Deep Work' });
      startTimer({
        id: created.id,
        title: created.title,
        duration,
        start: new Date(created.start_time),
        category: created.event_type || boetosTask.category,
      });
    } catch (err) {
      alert('Failed to create Boetos Task.');
    } finally {
      setIsCreatingBoetosTask(false);
    }
  };

  // Smarter AI suggestion logic based on category and randomness
  function getRandomTimeInRange(startHour: number, endHour: number) {
    const date = new Date();
    const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
    const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  React.useEffect(() => {
    if (showBoetosTaskModal) {
      setAiSuggesting(true);
      setAiSuggestionMsg('');
      setTimeout(() => {
        let suggested;
        switch (boetosTask.category) {
          case 'Deep Work':
            suggested = getRandomTimeInRange(8, 12); // 8am-11:45am
            break;
          case 'Chill Task':
            suggested = getRandomTimeInRange(18, 22); // 6pm-9:45pm
            break;
          case 'Quick Fix':
            suggested = getRandomTimeInRange(13, 17); // 1pm-4:45pm
            break;
          case 'Focus Sprint':
            suggested = getRandomTimeInRange(10, 16); // 10am-3:45pm
            break;
          case 'Breakthrough':
            suggested = getRandomTimeInRange(9, 12); // 9am-11:45am
            break;
          default:
            suggested = getRandomTimeInRange(9, 18); // 9am-5:45pm
        }
        setAiSuggestedDate(suggested.toISOString().slice(0, 10));
        setAiSuggestedTime(suggested.toTimeString().slice(0, 5));
        setAiSuggestionMsg(`AI suggests: ${suggested.toLocaleDateString()} at ${suggested.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        setAiSuggesting(false);
      }, 1200);
    }
  }, [showBoetosTaskModal, boetosTask.category]);

  // Filter Boetos Tasks from events (manual or created by user)
  const boetosTasks = events.filter(e => e.calendar_source === 'manual' || e.calendar_source === 'google' || e.event_type);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Error Alert for URL error */}
      {urlError && (
        <div className="mb-6 max-w-2xl mx-auto bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-xl flex items-center justify-between shadow animate-fade-in">
          <span>{urlError}</span>
          <button onClick={() => setUrlError(null)} className="ml-4 p-1 rounded hover:bg-red-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <style>{`
        /* Custom Calendar Styles - Unified Design System */
        .rbc-calendar {
          background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
          border: none;
        }
        .rbc-header {
          background: linear-gradient(135deg, ${theme === 'dark' ? '#334155 0%, #1e293b 100%' : '#f8fafc 0%, #e2e8f0 100%'});
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
          font-weight: 700;
          padding: 16px 12px;
          text-align: center;
          font-size: 14px;
          border: none;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .rbc-month-view {
          border: none;
        }
        .rbc-date-cell {
          padding: 8px;
          border-right: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
          background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
        }
        .rbc-date-cell:last-child {
          border-right: none;
        }
        .rbc-day-bg {
          background: ${theme === 'dark' ? '#0f172a' : '#f8fafc'};
          border-right: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
          border-bottom: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        .rbc-day-bg:hover {
          background: ${theme === 'dark' ? '#1e293b' : '#f1f5f9'};
          cursor: pointer;
        }
        .rbc-off-range-bg {
          background: ${theme === 'dark' ? '#0f172a' : '#f8fafc'};
        }
        .rbc-today {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 8px;
          margin: 2px;
        }
        .rbc-event {
          border: none !important;
          border-radius: 8px !important;
          margin: 2px !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: white !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          transition: all 0.2s ease !important;
        }
        .rbc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
        .rbc-event-content {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rbc-toolbar {
          padding: 20px;
          background: linear-gradient(135deg, ${theme === 'dark' ? '#334155 0%, #1e293b 100%' : '#f8fafc 0%, #e2e8f0 100%'});
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
          border: none;
          margin-bottom: 0;
        }
        .rbc-toolbar button {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }
        .rbc-toolbar button:hover {
          background: rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .rbc-toolbar button:active,
        .rbc-toolbar button.rbc-active {
          background: rgba(59, 130, 246, 0.4);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .rbc-toolbar-label {
          font-size: 24px;
          font-weight: 700;
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .rbc-month-row {
          border: none;
        }
        .rbc-date-cell > a {
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
          font-weight: 600;
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .rbc-date-cell > a:hover {
          background: #3b82f6;
          color: #ffffff;
        }
        .rbc-off-range {
          color: ${theme === 'dark' ? '#64748b' : '#94a3b8'};
        }
        .rbc-current-time-indicator {
          background: #ef4444;
          height: 2px;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
        }
        .rbc-time-view {
          border: none;
        }
        .rbc-time-header {
          border-bottom: 2px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        .rbc-time-content {
          border: none;
        }
        .rbc-time-slot {
          border-top: 1px solid ${theme === 'dark' ? '#1e293b' : '#f1f5f9'};
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        .rbc-time-gutter {
          background: ${theme === 'dark' ? '#0f172a' : '#f8fafc'};
          border-right: 2px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
        }
        .rbc-time-header-gutter {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }
        .rbc-agenda-view {
          border: none;
        }
        .rbc-agenda-table {
          border: none;
        }
        .rbc-agenda-table tbody > tr > td {
          border-top: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
          padding: 12px;
          color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
        }
        .rbc-agenda-table .rbc-agenda-time-cell {
          background: ${theme === 'dark' ? '#0f172a' : '#f8fafc'};
          font-weight: 600;
          color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
        }
        .rbc-agenda-event-cell {
          padding: 12px;
        }
        @media (max-width: 768px) {
          .rbc-toolbar {
            flex-direction: column;
            gap: 12px;
            padding: 16px;
          }
          .rbc-toolbar-label {
            font-size: 20px;
            order: -1;
          }
          .rbc-btn-group {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .rbc-toolbar button {
            padding: 6px 12px;
            font-size: 12px;
          }
          .rbc-event {
            font-size: 10px !important;
            padding: 2px 6px !important;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">My Google Calendar</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage your events and schedule</p>
              </div>
              <button
                className="bg-blue-600/20 backdrop-blur-sm text-blue-600 dark:text-blue-400 px-6 py-3 rounded-2xl hover:bg-blue-600/30 transition-all duration-300 font-semibold border border-blue-600/30 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/oauth/google`}
                disabled={loading}
              >
                {loading ? 'Connecting...' : '🔗 Connect Google Calendar'}
              </button>
            </div>
          </div>

          {!user?.email && (
            <div className="mx-6 mt-6 bg-amber-100/50 dark:bg-amber-900/20 border border-amber-300/50 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <span className="font-semibold">Please log in to view your Google Calendar</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-6 bg-red-100/50 dark:bg-red-900/20 border border-red-300/50 dark:border-red-800/50 text-red-700 dark:text-red-400 p-6 rounded-2xl shadow-lg relative">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <span className="font-semibold">{error}</span>
              </div>
              <button
                className="absolute top-4 right-4 text-red-600/80 dark:text-red-400/80 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                onClick={() => setError(null)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 bg-slate-100/50 dark:bg-slate-800/60">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-300 dark:border-slate-600 border-t-blue-500"></div>
                <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-blue-500/20 opacity-20"></div>
              </div>
              <p className="mt-6 text-lg text-slate-700 dark:text-slate-300 font-medium">Loading your calendar...</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Please wait while we sync your events</p>
            </div>
          ) : (
            <div className="p-6">
              <CalendarSummary events={events} />
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                views={['month', 'week', 'day', 'agenda']}
                view={view}
                onView={handleViewChange}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleEventSelect}
                eventPropGetter={eventPropGetter}
                style={calendarStyle}
                popup
                showMultiDayTimes
                step={60}
                timeslots={1}
                date={date}
                onNavigate={handleNavigate}
              />
            </div>
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && selectedSlot && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-slate-700/50">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                <h3 className="text-xl font-bold">✨ Create New Event</h3>
                <p className="text-white/80 text-sm mt-1">
                  {moment(selectedSlot.start).format('MMMM Do, YYYY')}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-700/60 text-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400"
                    placeholder="Enter event title..."
                    disabled={isCreatingEvent}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-700/60 text-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder-slate-400"
                    placeholder="Add event description..."
                    rows={3}
                    disabled={isCreatingEvent}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 px-4 py-3 bg-slate-700/60 hover:bg-slate-700/80 text-slate-300 rounded-2xl font-semibold transition-all border border-slate-600/50"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreatingEvent}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={handleCreateEvent}
                    disabled={!newEventTitle || isCreatingEvent}
                  >
                    {isCreatingEvent ? '✨ Creating...' : '🎉 Create Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Detail Modal */}
        {showDetailModal && eventDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md transform transition-all max-h-[90vh] overflow-y-auto border border-slate-700/50">
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{eventDetails.title}</h3>
                    <p className="text-white/80 text-sm mt-1">
                      {moment(eventDetails.start).format('MMMM Do, YYYY')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setEventDetails(null);
                      setSelectedEvent(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {eventDetails.description && (
                  <div className="bg-slate-700/60 p-4 rounded-2xl border border-slate-600/50">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">📝 Description</h4>
                    <p className="text-slate-400">{eventDetails.description}</p>
                  </div>
                )}
                
                <div className="bg-blue-900/20 p-4 rounded-2xl border border-blue-800/50">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">⏰ Time</h4>
                  <p className="text-blue-300">
                    {moment(eventDetails.start).format('h:mm A')} - {moment(eventDetails.end).format('h:mm A')}
                  </p>
                </div>
                
                {eventDetails.location && (
                  <div className="bg-green-900/20 p-4 rounded-2xl border border-green-800/50">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">📍 Location</h4>
                    <p className="text-green-300">{eventDetails.location}</p>
                  </div>
                )}
                
                {eventDetails.attendees && eventDetails.attendees.length > 0 && (
                  <div className="bg-purple-900/20 p-4 rounded-2xl border border-purple-800/50">
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">👥 Attendees</h4>
                    <div className="space-y-2">
                      {eventDetails.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-purple-300 text-sm">
                            {attendee.displayName || attendee.email}
                          </span>
                          {attendee.responseStatus && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              attendee.responseStatus === 'accepted' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                              attendee.responseStatus === 'declined' ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                              'bg-amber-900/30 text-amber-400 border border-amber-800/50'
                            }`}>
                              {attendee.responseStatus}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={() => {
                      setEditingEvent(eventDetails);
                      setEditTitle(eventDetails.title);
                      setEditDescription(eventDetails.description || '');
                      setShowEditModal(true);
                      setShowDetailModal(false);
                    }}
                  >
                    ✏️ Edit Event
                  </button>
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={() => {
                      if (eventDetails.id) {
                        handleEventDelete(eventDetails.id);
                      }
                    }}
                  >
                    🗑️ Delete Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditModal && editingEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-slate-700/50">
              <div className="p-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-2xl">
                <h3 className="text-xl font-bold">✏️ Edit Event</h3>
                <p className="text-white/80 text-sm mt-1">
                  {moment(editingEvent.start).format('MMMM Do, YYYY')}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-700/60 text-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-slate-400"
                    placeholder="Enter event title..."
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-700/60 text-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none placeholder-slate-400"
                    placeholder="Add event description..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 px-4 py-3 bg-slate-700/60 hover:bg-slate-700/80 text-slate-300 rounded-2xl font-semibold transition-all border border-slate-600/50"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEvent(null);
                      setEditTitle('');
                      setEditDescription('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={handleEditEvent}
                    disabled={!editTitle}
                  >
                    💾 Update Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Boetos Task Button */}
        <button
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full p-5 shadow-xl flex items-center gap-2 text-lg font-bold transition-all duration-300 hover:scale-110"
          onClick={() => setShowBoetosTaskModal(true)}
          title="Create Boetos Task"
        >
          <PlusCircle className="h-7 w-7 mr-1" />
          <span className="hidden md:inline">Create Boetos Task</span>
        </button>

        {/* Boetos Task Modal */}
        {showBoetosTaskModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700/50">
              <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl flex items-center gap-3">
                <Rocket className="h-7 w-7 animate-bounce" />
                <h3 className="text-xl font-bold">Create Boetos Task</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center mb-2">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold text-sm shadow-lg">
                    🚀 Boetos Focus Mode for {boetosTask.duration} minutes
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Task Title</label>
                  <input
                    name="title"
                    value={boetosTask.title}
                    onChange={handleBoetosTaskChange}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400"
                    placeholder="Enter task title..."
                    required
                    disabled={isCreatingBoetosTask}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={boetosTask.description}
                    onChange={handleBoetosTaskChange}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder-slate-400"
                    placeholder="Describe your task..."
                    rows={2}
                    disabled={isCreatingBoetosTask}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Duration</label>
                    <TimePicker
                      onChange={handleBoetosTaskDurationChange}
                      value={boetosTask.duration}
                      disableClock={false}
                      format="HH:mm"
                      clearIcon={null}
                      clockIcon={null}
                      className="w-full"
                      required
                      disabled={isCreatingBoetosTask}
                    />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Date</label>
                      <input
                        name="date"
                        type="date"
                        value={boetosTask.date}
                        onChange={handleBoetosTaskDateChange}
                        className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400"
                        required
                        disabled={isCreatingBoetosTask}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Time</label>
                      <TimePicker
                        onChange={handleBoetosTaskTimeChange}
                        value={boetosTask.time}
                        disableClock={false}
                        format="HH:mm"
                        clearIcon={null}
                        clockIcon={null}
                        className="w-full"
                        required
                        disabled={isCreatingBoetosTask}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Category</label>
                  <select
                    name="category"
                    value={boetosTask.category}
                    onChange={handleBoetosTaskChange}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isCreatingBoetosTask}
                  >
                    {boetosCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-semibold transition-all border border-slate-300 dark:border-slate-600"
                    onClick={() => setShowBoetosTaskModal(false)}
                    disabled={isCreatingBoetosTask}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={handleCreateBoetosTask}
                    disabled={!boetosTask.title || isCreatingBoetosTask}
                    type="button"
                  >
                    {isCreatingBoetosTask ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
                {aiSuggestionMsg && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-blue-600 dark:text-blue-300 font-medium">{aiSuggestionMsg}</span>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                      onClick={handleUseAiSuggestion}
                      disabled={aiSuggesting || isCreatingBoetosTask}
                    >
                      Use AI Suggestion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Boetos Tasks List */}
        <TasksList tasks={boetosTasks} />
      </div>
    </div>
  );
}