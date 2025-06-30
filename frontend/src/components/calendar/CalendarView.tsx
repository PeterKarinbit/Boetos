import React, { useState } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface CalendarViewProps {
  events: CalendarEvent[];
  readOnly?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, readOnly }) => {
  const { theme } = useTheme();
  const [localEvents, setLocalEvents] = React.useState(events);
  const [draggedEventId, setDraggedEventId] = React.useState<string | null>(null);
  const [isBinActive, setIsBinActive] = React.useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'meeting', date: '', time: '', location: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  // Sort events by start time, handling both Date and number types
  const sortedEvents = [...localEvents].sort((a, b) => {
    const aTime = a.start instanceof Date ? a.start.getTime() : a.start;
    const bTime = b.start instanceof Date ? b.start.getTime() : b.start;
    return aTime - bTime;
  });

  // Get next 3 upcoming events
  const upcomingEvents = sortedEvents.slice(0, 3);

  // Helper function to format time
  const formatTime = (time: Date | number) => {
    const date = time instanceof Date ? time : new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Enhanced event color logic
  const eventTypeColors: Record<string, string> = {
    meeting: '#3b82f6',
    review: '#10b981',
    presentation: '#8b5cf6',
    deadline: '#ef4444',
    task: '#f59e42',
    event: '#f472b6',
    // Add more types as needed
    default: '#64748b',
  };
  const getEventColor = (type: string) => eventTypeColors[type] || eventTypeColors.default;

  // Legend for event types
  const eventTypeLabels: Record<string, string> = {
    meeting: 'Meeting',
    review: 'Review',
    presentation: 'Presentation',
    deadline: 'Deadline',
    task: 'Task',
    event: 'Event',
    // Add more types as needed
  };

  // Helper function to delete event
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/api/calendar/events/${id}`);
        setLocalEvents(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        alert('Failed to delete event.');
      }
    }
  };

  // Drag handlers
  const handleDragStart = (id: string) => setDraggedEventId(id);
  const handleDragEnd = () => setDraggedEventId(null);
  const handleBinDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsBinActive(true);
  };
  const handleBinDragLeave = () => setIsBinActive(false);
  const handleBinDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsBinActive(false);
    if (draggedEventId) {
      handleDelete(draggedEventId);
      setDraggedEventId(null);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const start = new Date(`${form.date}T${form.time}`);
      await api.post('/api/calendar/events', {
        title: form.title,
        type: form.type,
        start,
        location: form.location || undefined,
        description: form.description || undefined,
      });
      setShowModal(false);
      setForm({ title: '', type: 'meeting', date: '', time: '', location: '', description: '' });
      window.location.reload();
    } catch (err) {
      alert('Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 relative">
      {/* Create Event Button */}
      {!readOnly && (
        <div className="flex justify-end mb-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow"
            onClick={() => setShowModal(true)}
          >
            + Create Event
          </button>
        </div>
      )}
      {/* Create Event Modal */}
      {!readOnly && showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Create Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 rounded border"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="meeting">Meeting</option>
                  <option value="review">Review</option>
                  <option value="presentation">Presentation</option>
                  <option value="deadline">Deadline</option>
                  <option value="task">Task</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded border"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded border"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location <span className="text-xs text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded border"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Zoom, Office, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description <span className="text-xs text-slate-400">(optional)</span></label>
                <textarea
                  className="w-full px-3 py-2 rounded border"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Details about the event..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Trash Bin (Drag target) */}
      {!readOnly && (
        <div
          className={`fixed top-8 right-8 z-50 flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${isBinActive ? 'bg-red-600/90 scale-110' : 'bg-slate-900/80'}`}
          onDragOver={handleBinDragOver}
          onDragLeave={handleBinDragLeave}
          onDrop={handleBinDrop}
          title="Drag here to delete event"
          style={{ cursor: 'pointer' }}
        >
          <Trash2 className={`h-8 w-8 ${isBinActive ? 'text-white animate-bounce' : 'text-red-400'}`} />
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Upcoming Events</h2>
        <p className="text-slate-400 mt-1">Your next few meetings and appointments</p>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(eventTypeLabels).map(([type, label]) => (
            <span key={type} className="flex items-center text-xs text-slate-300">
              <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: eventTypeColors[type] }}></span>
              {label}
            </span>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-slate-700/60 border-l-4 hover:bg-slate-700/80 transition-all duration-300"
              style={{
                borderLeftColor: getEventColor(event.type)
              }}
              draggable={!readOnly && !!event.id}
              onDragStart={!readOnly && event.id ? () => handleDragStart(event.id) : undefined}
              onDragEnd={!readOnly ? handleDragEnd : undefined}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-200">
                    {event.title}
                  </h3>
                  {event.location && (
                    <p className="text-sm text-slate-400 mt-1">
                      📍 {event.location}
                    </p>
                  )}
                </div>
                <div className="flex items-center text-sm text-slate-400 gap-2">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTime(event.start)}
                  {/* Delete button */}
                  {event.id && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      title="Delete event"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                <span className="capitalize">{event.type}</span>
                {event.attendees && (
                  <span>👥 {event.attendees} attendees</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 rounded-2xl bg-slate-700/60 text-center text-slate-400 hover:bg-slate-700/80 transition-all duration-300">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-slate-500" />
            <p>No upcoming events</p>
            <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView; 