export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

export interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  meetings: Meeting[];
}

export interface UpcomingMeetingProps {
  meetings: Meeting[];
}

export interface QuickActionsProps {
  onAction: (action: string) => void;
} 