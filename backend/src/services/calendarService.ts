import { dataSource } from '../data-source-new.js';
import { UserSchedule } from '../entities/UserSchedule.js';
import { User } from '../entities/User.js';
import { In, MoreThan } from 'typeorm';

const apiKey = process.env.GOOGLE_API_KEY;

export class CalendarService {
  private userScheduleRepository = dataSource.then(ds => ds.getRepository(UserSchedule));
  private userRepository = dataSource.then(ds => ds.getRepository(User));

  constructor() {}

  async syncUserCalendar(userId: string, events: any[]): Promise<void> {
    const dataSourceInstance = await dataSource;
    const queryRunner = dataSourceInstance.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const user = await (await this.userRepository).findOneBy({ id: userId });
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

      // Mark old events as cancelled
      const userScheduleRepo = await this.userScheduleRepository;
      await queryRunner.manager.update(
        userScheduleRepo.metadata.target as any,
        { userId, source: 'GOOGLE_CALENDAR' },
        { status: 'CANCELLED' }
      );
      
      // Upsert new events if there are any
      if (schedulesToUpsert.length > 0) {
        await queryRunner.manager.upsert(
          userScheduleRepo.metadata.target as any,
          schedulesToUpsert,
          ['userId', 'eventId']
        );
      }
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserEvents(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<UserSchedule[]> {
    const repo = await this.userScheduleRepository;
    return repo.find({
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
    const repo = await this.userScheduleRepository;
    const now = new Date();
    return repo.find({
      where: {
        userId,
        startTime: MoreThan(now),
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