export interface MeetingReminder {
  eventId: string;
  title: string;
  startTime: string; // ISO string
  location?: string;
  reminder: string;
  travelTimeMinutes: number;
  stressScore: number;
  description?: string;
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  conferenceData?: {
    conferenceId?: string;
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceSolution?: {
      name: string;
      iconUri?: string;
    };
  };
  hangoutLink?: string;
  htmlLink?: string;
  status?: string;
  creator?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  recurringEventId?: string;
  originalStartTime?: string;
  transparency?: string;
  visibility?: string;
  iCalUID?: string;
  sequence?: number;
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  source?: {
    url: string;
    title: string;
  };
  attachments?: Array<{
    fileUrl: string;
    title: string;
    mimeType: string;
    iconLink: string;
    fileId: string;
  }>;
  eventType?: string;
  privateCopy?: boolean;
  locked?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanModify?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  anyoneCanAddSelf?: boolean;
  guestsCanModifyCalendar?: boolean;
  guestsCanSeeOtherGuestsCalendar?: boolean;
  guestsCanInviteOthersCalendar?: boolean;
  anyoneCanAddSelfCalendar?: boolean;
  privateCopyCalendar?: boolean;
  lockedCalendar?: boolean;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  colorRgb?: string;
  colorHex?: string;
  colorName?: string;
  colorBackground?: string;
  colorForeground?: string;
  colorIsDefault?: boolean;
  colorIsSelected?: boolean;
  colorIsCustom?: boolean;
  colorIsFromTheme?: boolean;
  colorThemeId?: string;
  colorThemeName?: string;
  colorThemeBackgroundColor?: string;
  colorThemeForegroundColor?: string;
  colorThemeIsDefault?: boolean;
  colorThemeIsSelected?: boolean;
  colorThemeIsCustom?: boolean;
  colorThemeIsFromTheme?: boolean;
  colorThemeThemeId?: string;
  colorThemeThemeName?: string;
  colorThemeThemeBackgroundColor?: string;
  colorThemeThemeForegroundColor?: string;
  colorThemeThemeIsDefault?: boolean;
  colorThemeThemeIsSelected?: boolean;
  colorThemeThemeIsCustom?: boolean;
  colorThemeThemeIsFromTheme?: boolean;
}
