import { AppDataSource } from '../data-source';
import { UserSchedule } from '../entity/UserSchedule';
import { User } from '../entity/User';
import { In, MoreThan } from 'typeorm';

const apiKey = process.env.GOOGLE_API_KEY;

export class CalendarService {
  private userScheduleRepository = AppDataSource.getRepository(UserSchedule);
  private userRepository = AppDataSource.getRepository(User);

  constructor() {}

  async syncUserCalendar(userId: string, events: any[]): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist.`);
    }

    const schedulesToUpsert = events.map(event => ({
      userId,
      eventId: event.id,
      title: event.summary,
      description: event.description,
      startTime: new Date(event.start.dateTime || event.start.date),
      endTime: new Date(event.end.dateTime || event.end.date),
      location: event.location,
      eventType: this.determineEventType(event),
      source: 'GOOGLE_CALENDAR',
      isAllDay: !!event.start.date && !event.start.dateTime,
      status: 'CONFIRMED',
    }));

    // Use a transaction to ensure atomicity
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Mark old events as cancelled
      await transactionalEntityManager.update(UserSchedule, 
        { userId, source: 'GOOGLE_CALENDAR' },
        { status: 'CANCELLED' }
      );
      // Upsert new events
      if (schedulesToUpsert.length > 0) {
        await transactionalEntityManager.upsert(UserSchedule, schedulesToUpsert, ['userId', 'eventId']);
      }
    });
  }

  async getUserEvents(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<UserSchedule[]> {
    return this.userScheduleRepository.find({
      where: {
        userId,
        startTime: MoreThan(startTime),
        endTime: MoreThan(endTime),
        status: 'CONFIRMED',
      },
      order: {
        startTime: 'ASC',
      },
    });
  }

  async getUpcomingEvents(userId: string, limit: number = 5): Promise<UserSchedule[]> {
    return this.userScheduleRepository.find({
      where: {
        userId,
        startTime: MoreThan(new Date()),
        status: 'CONFIRMED',
      },
      order: {
        startTime: 'ASC',
      },
      take: limit,
    });
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