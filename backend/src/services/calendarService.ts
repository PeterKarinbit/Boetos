import { Pool } from 'pg';
import { pool } from '../db/init';
import { UserSchedule } from '../db/init';

const apiKey = process.env.GOOGLE_API_KEY;

export class CalendarService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // Sync calendar events for a user - FIXED: userId should be string (UUID)
  async syncUserCalendar(userId: string, events: any[]): Promise<void> {
    console.log('CalendarService: Starting sync for user', userId);
    
    // ADDED: Verify user exists before proceeding
    const userCheck = await this.pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      throw new Error(`User with ID ${userId} does not exist in the database`);
    }
    console.log('CalendarService: User exists in database');

    const client = await this.pool.connect();
    try {
      console.log('CalendarService: Beginning transaction');
      await client.query('BEGIN');

      // First, mark all existing events as cancelled
      console.log('CalendarService: Marking existing events as cancelled');
      await client.query(
        'UPDATE user_schedule SET status = $1 WHERE user_id = $2 AND source = $3',
        ['CANCELLED', userId, 'GOOGLE_CALENDAR']
      );

      // Insert or update new events
      console.log('CalendarService: Processing', events.length, 'events');
      for (const event of events) {
        try {
          console.log('CalendarService: Processing event:', {
            id: event.id,
            summary: event.summary,
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date
          });

          await client.query(
            `INSERT INTO user_schedule (
              user_id, event_id, title, description, start_time, end_time,
              location, event_type, source, is_all_day, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT ON CONSTRAINT user_schedule_user_event_unique DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time,
              location = EXCLUDED.location,
              event_type = EXCLUDED.event_type,
              is_all_day = EXCLUDED.is_all_day,
              status = EXCLUDED.status,
              updated_at = CURRENT_TIMESTAMP`,
            [
              userId, // Now correctly a string UUID
              event.id,
              event.summary,
              event.description,
              event.start.dateTime || event.start.date,
              event.end.dateTime || event.end.date,
              event.location,
              this.determineEventType(event),
              'GOOGLE_CALENDAR',
              !event.start.dateTime, // is_all_day
              'CONFIRMED'
            ]
          );
        } catch (eventError) {
          console.error('CalendarService: Error processing event:', {
            eventId: event.id,
            error: eventError instanceof Error ? eventError.message : 'Unknown error',
            stack: eventError instanceof Error ? eventError.stack : undefined
          });
          throw eventError;
        }
      }

      console.log('CalendarService: Committing transaction');
      await client.query('COMMIT');
      console.log('CalendarService: Sync completed successfully');
    } catch (error) {
      console.error('CalendarService: Error during sync:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user's calendar events for a specific time range - FIXED: userId should be string
  async getUserEvents(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<UserSchedule[]> {
    const result = await this.pool.query(
      `SELECT * FROM user_schedule 
       WHERE user_id = $1 
       AND start_time >= $2 
       AND end_time <= $3 
       AND status != 'CANCELLED'
       ORDER BY start_time ASC`,
      [userId, startTime, endTime]
    );
    return result.rows;
  }

  // Get upcoming events for a user - FIXED: userId should be string
  async getUpcomingEvents(userId: string, limit: number = 5): Promise<UserSchedule[]> {
    const result = await this.pool.query(
      `SELECT * FROM user_schedule 
       WHERE user_id = $1 
       AND start_time > CURRENT_TIMESTAMP 
       AND status != 'CANCELLED'
       ORDER BY start_time ASC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // Helper method to determine event type
  private determineEventType(event: any): 'MEETING' | 'TASK' | 'BLOCKER' | 'PERSONAL' | 'BREAK' {
    // This is a simple implementation. You might want to make this more sophisticated
    // based on event properties, calendar name, or other metadata
    if (event.summary?.toLowerCase().includes('break')) return 'BREAK';
    if (event.summary?.toLowerCase().includes('meeting')) return 'MEETING';
    if (event.summary?.toLowerCase().includes('task')) return 'TASK';
    if (event.summary?.toLowerCase().includes('blocker')) return 'BLOCKER';
    return 'PERSONAL';
  }
}