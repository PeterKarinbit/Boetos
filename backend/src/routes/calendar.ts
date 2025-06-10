import { Router } from 'express';
import { google } from 'googleapis';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { CalendarService } from '../services/calendarService';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const calendarService = new CalendarService();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  console.log('Auth check - req.user:', req.user ? 'Present' : 'Missing');
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

router.get('/events', requireAuth, async (req, res) => {
  console.log('Events route called');
  const user = req.user as User;
  
  console.log('User Google tokens:', {
    accessToken: user.googleAccessToken ? 'Present' : 'Missing',
    refreshToken: user.googleRefreshToken ? 'Present' : 'Missing'
  });
  
  if (!user.googleAccessToken) {
    return res.status(401).json({ error: 'Not connected to Google' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_CALLBACK_URL!
  );

  // Define a reasonable time range for fetching events
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(); // From beginning of previous month
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString(); // To end of next month

  let calendars: any[] | undefined;

  try {
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    console.log('Making Google Calendar API call...');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch calendar list first
    const calendarListResponse = await calendar.calendarList.list();
    calendars = calendarListResponse.data.items;

    if (!calendars || calendars.length === 0) {
      console.log('No calendars found for the user.');
      return res.json([]);
    }

    let allEvents: any[] = [];

    for (const cal of calendars) {
      if (cal.id) {
        try {
          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: 100, // Increased maxResults
            singleEvents: true,
            orderBy: 'startTime',
          });
          if (eventsResponse.data.items) {
            // Attach calendarId to each event for frontend filtering
            const eventsWithCalendarId = eventsResponse.data.items.map(event => ({
              ...event,
              calendarId: cal.id,
              calendarSummary: cal.summary // Also include calendar summary for easier identification
            }));
            allEvents = allEvents.concat(eventsWithCalendarId);
          }
        } catch (eventListError: any) {
          console.error(`Error fetching events for calendar ID ${cal.id}:`, JSON.stringify(eventListError, null, 2));
          // Continue to next calendar even if one fails
        }
      }
    }

    console.log('Total events fetched from all calendars:', allEvents.length);
    console.log('Full aggregated Google Calendar API data (first 5 items):', JSON.stringify(allEvents.slice(0, 5), null, 2));
    res.json(allEvents);

  } catch (error: any) {
    console.error('Calendar API error:', JSON.stringify(error, null, 2)); // Log full error object
    
    // Handle token expiration
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      // Try to refresh the token
      try {
        console.log('Attempting to refresh token...');
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        if (credentials.access_token) {
          user.googleAccessToken = credentials.access_token;
          if (credentials.refresh_token) {
            user.googleRefreshToken = credentials.refresh_token;
          }
          await userRepository.save(user);
          
          // Retry the calendar request with new token
          oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
          });
          
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          
          let retriedEvents: any[] = [];
          // Re-define time range for retry if needed (though timeMin/timeMax are already defined outside try/catch)
          // const now = new Date(); // now is already defined above
          // const retryTimeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(); // use existing timeMin
          // const retryTimeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString(); // use existing timeMax

          if (!calendars || calendars.length === 0) {
            console.log('No calendars found for the user during retry. Cannot fetch events.');
            return res.json([]);
          }

          for (const cal of calendars) {
            if (cal.id) {
              try {
                const eventsResponse = await calendar.events.list({
                  calendarId: cal.id,
                  timeMin: timeMin,
                  timeMax: timeMax,
                  maxResults: 100, // Increased maxResults
                  singleEvents: true,
                  orderBy: 'startTime',
                });
                if (eventsResponse.data.items) {
                  retriedEvents = retriedEvents.concat(eventsResponse.data.items);
                }
              } catch (retryEventListError: any) {
                console.error(`Error fetching events for calendar ID ${cal.id} during retry:`, JSON.stringify(retryEventListError, null, 2));
              }
            }
          }
          
          console.log('Retry after token refresh successful. Total events fetched:', retriedEvents.length);
          return res.json(retriedEvents);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
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

// Create an event
router.post('/events', requireAuth, async (req, res) => {
  const user = req.user as User;
  const { summary, description, start, end, timeZone } = req.body;

  if (!user.googleAccessToken) {
    return res.status(401).json({ error: 'Not connected to Google' });
  }

  if (!summary || !start || !end) {
    return res.status(400).json({ error: 'Summary, start, and end time are required.' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_CALLBACK_URL!
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: start, // e.g., '2025-06-20T10:00:00-07:00'
        timeZone: timeZone || 'UTC',
      },
      end: {
        dateTime: end, // e.g., '2025-06-20T10:25:00-07:00'
        timeZone: timeZone || 'UTC',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating event:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// Delete an event
router.delete('/events/:eventId', requireAuth, async (req, res) => {
  const user = req.user as User;
  const { eventId } = req.params;

  if (!user.googleAccessToken) {
    return res.status(401).json({ error: 'Not connected to Google' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_CALLBACK_URL!
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    res.status(204).send(); // No Content
  } catch (error: any) {
    console.error('Error deleting event:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

// POST /api/calendar/sync
router.post('/sync', async (req, res) => {
  console.log('Calendar sync request received:', {
    userId: req.body.userId,
    eventCount: req.body.events?.length
  });

  const { userId, events } = req.body;
  if (!userId || !Array.isArray(events)) {
    console.error('Invalid request body:', { userId, events });
    return res.status(400).json({ error: 'userId and events are required' });
  }

  try {
    console.log('Starting calendar sync for user:', userId);
    await calendarService.syncUserCalendar(userId, events);
    console.log('Calendar sync completed successfully for user:', userId);
    res.json({ message: 'Calendar synced successfully' });
  } catch (error) {
    console.error('Error syncing calendar:', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Failed to sync calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;