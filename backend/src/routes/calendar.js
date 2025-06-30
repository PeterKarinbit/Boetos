const express = require('express');
const { google } = require('googleapis');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const authMiddleware = require('../middleware/authMiddleware');
const CalendarEvent = require('../entities/CalendarEvent');
const MemoryEntry = require('../entities/MemoryEntry');
const { Between } = require('typeorm');

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);

// Helper function to fetch all events from all calendars
async function fetchAllGoogleEvents(calendar, calendars, timeMin, timeMax) {
  const allEvents = [];
  
  for (const cal of calendars) {
    try {
      const response = await calendar.events.list({
        calendarId: cal.id,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      if (response.data.items) {
        allEvents.push(...response.data.items.map(event => ({
          ...event,
          calendarId: cal.id,
          calendarName: cal.summary
        })));
      }
    } catch (error) {
      console.error(`Error fetching events from calendar ${cal.summary}:`, error);
    }
  }
  
  return allEvents;
}

router.use(authMiddleware);

// Get all calendar events and memory entries for a date range
router.get('/events', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const memoryRepo = AppDataSource.getRepository(MemoryEntry);

    const [calendarEvents, memoryEntries] = await Promise.all([
      calendarRepo.find({
        where: { user_id: userId, start_time: Between(start, end) },
        order: { start_time: 'ASC' },
      }),
      memoryRepo.find({
        where: { user_id: userId, createdAt: Between(start, end) },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const formattedMemoryEvents = memoryEntries.map(memory => ({
      id: `memory-${memory.id}`,
      title: `📝 ${memory.content.substring(0, 30)}...`,
      start: memory.createdAt,
      end: memory.createdAt,
      allDay: true,
      resource: { type: 'memory', ...memory },
    }));

    // Fetch Google Calendar events if connected
    let googleEvents = [];
    if (user.google_access_token) {
      try {
        console.log('[DEBUG] Attempting to fetch Google Calendar events for user:', user.email);
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_CALLBACK_URL
        );
        oauth2Client.setCredentials({
          access_token: user.google_access_token,
          refresh_token: user.google_refresh_token,
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const calendarListResponse = await calendar.calendarList.list();
        const calendars = calendarListResponse.data.items;
        if (!calendars || calendars.length === 0) {
          console.log('[DEBUG] No Google calendars found for user:', user.email);
        }
        googleEvents = await fetchAllGoogleEvents(
          calendar,
          calendars || [],
          start.toISOString(),
          end.toISOString()
        );
        console.log(`[DEBUG] Fetched ${googleEvents.length} Google events for user:`, user.email);
      } catch (error) {
        console.error('[DEBUG] Error fetching Google Calendar events:', error);
      }
    } else {
      console.log('[DEBUG] User has no google_access_token:', user.email);
    }

    const combinedEvents = [...calendarEvents, ...formattedMemoryEvents, ...googleEvents];
    res.json(combinedEvents);
  } catch (error) {
    console.error('Error fetching combined events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// Get a single calendar event
router.get('/events/:id', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  const user = req.user;

  if (!user.google_access_token) {
    return res.status(401).json({ error: 'Not connected to Google', needsReauth: true });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

  oauth2Client.setCredentials({
    access_token: user.google_access_token,
    refresh_token: user.google_refresh_token,
  });

  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items;

    let allEvents = await fetchAllGoogleEvents(calendar, calendars || [], timeMin, timeMax);
    
    res.json(allEvents);

  } catch (error) {
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        if (credentials.access_token) {
          user.google_access_token = credentials.access_token;
          if (credentials.refresh_token) {
            user.google_refresh_token = credentials.refresh_token;
          }
          await userRepository.save(user);
          
          oauth2Client.setCredentials(credentials);
          
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          
          const calendarListResponse = await calendar.calendarList.list();
          const calendars = calendarListResponse.data.items;

          const retriedEvents = await fetchAllGoogleEvents(calendar, calendars || [], timeMin, timeMax);
          
          return res.json(retriedEvents);
        }
      } catch (refreshError) {
        return res.status(401).json({ 
          error: 'Google authentication expired. Please reconnect your Google Calendar.',
          needsReauth: true 
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch events', 
      details: error.message 
    });
  }
});

// Create a Boetos Task and sync to Google Calendar
router.post('/boetos-tasks', async (req, res) => {
  try {
    const user = req.user;
    const { title, description, duration, start, category } = req.body;
    if (!title || !duration || !start || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const startTime = new Date(start);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // 1. Store in local DB
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const newEvent = calendarRepo.create({
      user_id: user.id,
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      is_all_day: false,
      event_type: category,
      calendar_source: 'manual',
    });
    await calendarRepo.save(newEvent);

    // 2. Sync to Google Calendar if connected
    let googleEvent = null;
    if (user.google_access_token) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_CALLBACK_URL
        );
        oauth2Client.setCredentials({
          access_token: user.google_access_token,
          refresh_token: user.google_refresh_token,
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = {
          summary: title,
          description,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
        };
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });
        // Update local event with Google event id
        newEvent.external_id = response.data.id;
        newEvent.calendar_source = 'google';
        await calendarRepo.save(newEvent);
        googleEvent = response.data;
      } catch (err) {
        console.error('Failed to sync Boetos Task to Google Calendar:', err.message);
      }
    }
    res.status(201).json({
      ...newEvent,
      googleEvent,
    });
  } catch (error) {
    console.error('Error creating Boetos Task:', error);
    res.status(500).json({ error: 'Failed to create Boetos Task' });
  }
});

// PATCH /boetos-tasks/:id/state - Update Boetos Task state and timer
router.patch('/boetos-tasks/:id/state', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { boetos_task_state, timer_state } = req.body;
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const task = await calendarRepo.findOne({ where: { id, user_id: userId, is_boetos_task: true } });
    if (!task) return res.status(404).json({ error: 'Boetos Task not found' });
    if (boetos_task_state) task.boetos_task_state = boetos_task_state;
    if (timer_state) task.timer_state = timer_state;
    // Analytics: update timestamps
    if (!task.analytics) task.analytics = {};
    if (boetos_task_state === 'active' && !task.analytics.startedAt) task.analytics.startedAt = new Date();
    if (boetos_task_state === 'completed') task.analytics.completedAt = new Date();
    if (boetos_task_state === 'cancelled') task.analytics.cancelledAt = new Date();
    await calendarRepo.save(task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update Boetos Task state', details: error.message });
  }
});

// GET /boetos-tasks/:id - Fetch full Boetos Task details
router.get('/boetos-tasks/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const task = await calendarRepo.findOne({ where: { id, user_id: userId, is_boetos_task: true } });
    if (!task) return res.status(404).json({ error: 'Boetos Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Boetos Task', details: error.message });
  }
});

// GET /boetos-tasks/history - List all Boetos Tasks with analytics
router.get('/boetos-tasks/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const tasks = await calendarRepo.find({ where: { user_id: userId, is_boetos_task: true }, order: { start_time: 'DESC' } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Boetos Task history', details: error.message });
  }
});

// POST /boetos-tasks/:id/reminder - Set or update a reminder for a Boetos Task
router.post('/boetos-tasks/:id/reminder', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reminder_time } = req.body;
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const task = await calendarRepo.findOne({ where: { id, user_id: userId, is_boetos_task: true } });
    if (!task) return res.status(404).json({ error: 'Boetos Task not found' });
    task.reminder_time = reminder_time ? new Date(reminder_time) : null;
    await calendarRepo.save(task);
    // TODO: Schedule notification (stub: log for now)
    console.log(`[REMINDER] Reminder set for Boetos Task ${id} at ${task.reminder_time}`);
    res.json({ success: true, reminder_time: task.reminder_time });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set reminder', details: error.message });
  }
});

// Delete an event from Google Calendar
router.delete('/events/:id', async (req, res) => {
  try {
    const user = req.user;
    const eventId = req.params.id;
    if (!user.google_access_token) {
      return res.status(401).json({ error: 'Not connected to Google', needsReauth: true });
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
    });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    // Try to delete from all calendars
    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items;
    let deleted = false;
    for (const cal of calendars) {
      try {
        await calendar.events.delete({ calendarId: cal.id, eventId });
        deleted = true;
        break;
      } catch (err) {
        // Ignore if not found in this calendar
        if (err.code !== 404) {
          console.error(`Error deleting event from calendar ${cal.summary}:`, err);
        }
      }
    }
    if (deleted) {
      return res.json({ success: true });
    } else {
      return res.status(404).json({ error: 'Event not found in any Google Calendar' });
    }
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Create a new calendar event
router.post('/events', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, type, start, location, description } = req.body;
    if (!title || !type || !start) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const newEvent = calendarRepo.create({
      user_id: userId,
      title,
      event_type: type,
      start_time: new Date(start),
      location: location || null,
      description: description || null,
      calendar_source: 'manual',
    });
    await calendarRepo.save(newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

module.exports = router; 