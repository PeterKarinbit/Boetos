import { CalendarService } from './calendarService';
import { UserSchedule } from '../entity/UserSchedule';

// Mock traffic/location service for now
const getTravelTime = async (origin: string, destination: string): Promise<number> => {
  // Mock implementation: returns a random travel time between 15 and 60 minutes
  console.log(`Mocking travel time from ${origin} to ${destination}`);
  return Math.floor(Math.random() * 45) + 15;
};

export class MeetingService {
  private calendarService: CalendarService;

  constructor() {
    this.calendarService = new CalendarService();
  }

  public async getMeetingReminders(userId: string) {
    const upcomingEvents = await this.calendarService.getUpcomingEvents(userId, 5);

    const reminders = await Promise.all(upcomingEvents.map(async (event) => {
      let travelTime: number | null = null;
      if (event.location) {
        // Assuming user's current location is 'Home' for now.
        // This should be dynamic in a real application.
        travelTime = await getTravelTime('Home', event.location);
      }

      const stressScore = this.calculatePreMeetingStress(event);

      return {
        eventId: event.eventId,
        title: event.title,
        startTime: event.startTime,
        location: event.location,
        reminder: `Reminder for your meeting: "${event.title}"`,
        travelTimeMinutes: travelTime,
        stressScore: stressScore,
      };
    }));

    return reminders;
  }

  private calculatePreMeetingStress(event: UserSchedule): number {
    // Simple scoring logic based on event properties
    let score = 0;
    const now = new Date();
    const startTime = new Date(event.startTime);
    const timeToMeeting = (startTime.getTime() - now.getTime()) / (1000 * 60); // in minutes

    if (timeToMeeting < 30) {
      score += 3; // High urgency
    } else if (timeToMeeting < 60) {
      score += 1; // Medium urgency
    }

    if (event.eventType === 'MEETING') {
        const importantKeywords = ['important', 'review', 'performance', 'deadline'];
        const eventText = `${event.title} ${event.description || ''}`.toLowerCase();
        if (importantKeywords.some(keyword => eventText.includes(keyword))) {
            score += 4;
        }
    }
    
    return Math.min(score, 10); // Cap score at 10
  }
}
