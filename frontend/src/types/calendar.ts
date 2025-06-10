export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | number;
  end: Date | number;
  type: string;
  location: string;
  preparationNeeded: boolean;
  preparationTime: number;
  attendees?: number;
} 