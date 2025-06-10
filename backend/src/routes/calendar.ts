import { Router, Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { CalendarService } from '../services/calendarService';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const calendarService = new CalendarService();

interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication middleware
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('Auth check - req.user:', req.user ? 'Present' : 'Missing');
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

router.get('/events', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

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
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
          });
          if (eventsResponse.data.items) {
            const eventsWithCalendarId = eventsResponse.data.items.map(event => ({
              ...event,
              calendarId: cal.id,
              calendarSummary: cal.summary
            }));
            allEvents = allEvents.concat(eventsWithCalendarId);
          }
        } catch (eventListError: any) {
          console.error(`Error fetching events for calendar ID ${cal.id}:`, JSON.stringify(eventListError, null, 2));
          continue;
        }
      }
    }

    console.log('Total events fetched from all calendars:', allEvents.length);
    res.json(allEvents);

  } catch (error: any) {
    console.error('Calendar API error:', JSON.stringify(error, null, 2));
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      try {
        console.log('Attempting to refresh token...');
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        if (credentials.access_token) {
          user.googleAccessToken = credentials.access_token;
          if (credentials.refresh_token) {
            user.googleRefreshToken = credentials.refresh_token;
          }
          await userRepository.save(user);
          
          oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
          });
          
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          
          let retriedEvents: any[] = [];

          if (!calendars || calendars.length === 0) {
            console.log('No calendars found for the user during retry.');
            return res.json([]);
          }

          for (const cal of calendars) {
            if (cal.id) {
              try {
                const eventsResponse = await calendar.events.list({
                  calendarId: cal.id,
                  timeMin: timeMin,
                  timeMax: timeMax,
                  maxResults: 100,
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
router.post('/events', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user as User;
  const { summary, description, start, end, timeZone } = req.body as CalendarEvent;

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
      summary,
      description,
      start,
      end,
      timeZone: timeZone || 'UTC'
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      error: 'Failed to create event',
      details: error.message
    });
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