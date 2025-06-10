import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { useUser } from '../contexts/UserContext';
import '../styles/calendar.css'; // Import the new custom styles

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id?: string; // Google Calendar Event ID
  start: Date;
  end: Date;
  title: string;
  description?: string;
  colorId?: string; // Google Calendar colorId
  calendarId?: string; // ID of the calendar this event belongs to
  calendarSummary?: string; // Summary (name) of the calendar this event belongs to
}

type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

export default function CalendarView() {
  const { user, login } = useUser();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CalendarViewType>('month'); // Changed default to month view
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  const fetchEvents = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token'); // Get token from localStorage
    if (!token) {
      setError('You must be logged in to view your Google Calendar.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/calendar/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === 'Not connected to Google') {
          setError('You have not connected your Google Calendar. Please click Connect Google Calendar.');
        } else if (data?.error) {
          setError(`Error: ${data.error}`);
        } else {
          setError('An unknown error occurred while fetching events.');
        }
        setEvents([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const googleEvents = data.map((event: any) => ({
          id: event.id,
          title: event.summary || 'No Title',
          start: event.start?.dateTime ? new Date(event.start.dateTime) : new Date(event.start?.date),
          end: event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end?.date),
          description: event.description || '',
          colorId: event.colorId, // Capture colorId
          calendarId: event.calendarId, // Capture calendarId
          calendarSummary: event.calendarSummary, // Capture calendarSummary
        }));
        setEvents(googleEvents);
        if (googleEvents.length === 0) {
          setError('No events found in your Google Calendar.');
        }
      } else {
        setError('Failed to load events.');
      }
    } catch (err) {
      setError('Failed to load events. Please check your connection.');
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial check for authentication status on component mount
    const token = localStorage.getItem('token');
    if (!user && token) {
      fetch('http://localhost:4000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.email) {
            login(data, token); // Pass the token to login as well
          }
        })
        .catch(err => {
          console.error('Failed to fetch /api/auth/me:', err);
          // If /me fails, it means the token is invalid or expired, so log out
          // logout(); // Uncomment if you want to force logout on /me failure
        });
    } else if (!user && !token) {
      // Optionally set an error or redirect to login page if no token
      setError('You must be logged in to view your Google Calendar.');
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (user?.email) { // Only fetch events if user is logged in
      fetchEvents();
    }
  }, [user?.email]);

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setSelectedSlot({ start, end });
    setNewEventTitle(''); // Clear previous title
    setNewEventDescription(''); // Clear previous description
    setShowCreateModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleCreateEvent = async () => {
    if (!selectedSlot || !newEventTitle) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to create events.');
      return;
    }

    const newEvent = {
      summary: newEventTitle,
      description: newEventDescription,
      start: selectedSlot.start.toISOString(),
      end: selectedSlot.end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use client's timezone
    };

    try {
      const res = await fetch('http://localhost:4000/api/calendar/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create event on server');
      }
      // Refresh events after creation
      fetchEvents();
      setShowCreateModal(false);
      setNewEventTitle('');
      setNewEventDescription('');
    } catch (err: any) {
      setError(`Failed to create event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to delete events.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/calendar/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete event on server');
      }
      // Refresh events after deletion
      fetchEvents();
      setShowDetailModal(false);
      setSelectedEvent(null);
    } catch (err: any) {
      setError(`Failed to delete event: ${err.message}`);
    }
  };

  const eventPropGetter = (event: CalendarEvent) => {
    let backgroundColor = 'var(--google-event-blue)'; // Default blue
    // Map Google Calendar colorId to your defined CSS variables
    switch (event.colorId) {
      case '2': // Green
        backgroundColor = 'var(--google-event-green)';
        break;
      case '3': // Purple
        backgroundColor = 'var(--google-event-purple)';
        break;
      case '4': // Red
        backgroundColor = 'var(--google-event-red)';
        break;
      case '5': // Yellow/Orange
        backgroundColor = 'var(--google-event-orange)';
        break;
      case '6': // Teal
        backgroundColor = 'var(--google-event-teal)';
        break;
      // Add more cases for other Google Calendar color IDs if needed
      default:
        // You can cycle through colors here or use a default if no colorId
        // For now, it will use the default blue
        break;
    }
    return {
      style: { backgroundColor }
    };
  };

  const filteredEvents = view === 'agenda'
    ? events.filter(event => 
        !event.calendarSummary?.toLowerCase().includes('holiday') && 
        !event.calendarSummary?.toLowerCase().includes('birthday')
      )
    : events;

  return (
    <div className="p-2 sm:p-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0 w-full">
        <h2 className="text-xl sm:text-2xl font-semibold">My Google Calendar</h2>
        <button
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          onClick={() => window.location.href = 'http://localhost:4000/api/auth/google'}
        >
          Connect Google Calendar
        </button>
      </div>
      {!user?.email && <div className="text-yellow-600 font-semibold mb-4">You must be logged in to view your Google Calendar.</div>}
      {loading && <div>Loading events...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!loading && !error && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[320px] sm:min-w-0">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day', 'agenda']}
              defaultView={view}
              onView={(newView) => setView(newView as CalendarViewType)}
              selectable // Enable selection of time slots
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter} // Apply custom event styles
              style={{ height: 500 }}
            />
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-white">Create New Event</h3>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="eventTitle">Title:</label>
              <input
                type="text"
                id="eventTitle"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="eventDescription">Description (Optional):</label>
              <textarea
                id="eventDescription"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
              />
            </div>
            <div className="mb-4 text-gray-300">
              <p>Start: {moment(selectedSlot.start).format('MMMM D, YYYY h:mm A')}</p>
              <p>End: {moment(selectedSlot.end).format('MMMM D, YYYY h:mm A')}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleCreateEvent}
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail/Delete Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-white">Event Details</h3>
            <p className="text-gray-300 mb-2"><strong className="text-white">Title:</strong> {selectedEvent.title}</p>
            {selectedEvent.description && <p className="text-gray-300 mb-2"><strong className="text-white">Description:</strong> {selectedEvent.description}</p>}
            <p className="text-gray-300 mb-2"><strong className="text-white">Start:</strong> {moment(selectedEvent.start).format('MMMM D, YYYY h:mm A')}</p>
            <p className="text-gray-300 mb-4"><strong className="text-white">End:</strong> {moment(selectedEvent.end).format('MMMM D, YYYY h:mm A')}</p>
            
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={handleDeleteEvent}
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
