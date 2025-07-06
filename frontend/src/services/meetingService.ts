import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/meetings`;

export interface MeetingReminder {
  eventId: string;
  title: string;
  startTime: string;
  location?: string;
  reminder: string;
  travelTimeMinutes: number;
  stressScore: number;
}

export const getMeetingReminders = async (): Promise<MeetingReminder[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reminders`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting reminders:', error);
    throw error;
  }
};

export const snoozeReminder = async (eventId: string, minutes: number): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/reminders/${eventId}/snooze`,
      { minutes },
      { withCredentials: true }
    );
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    throw error;
  }
};

export const dismissReminder = async (eventId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/reminders/${eventId}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    throw error;
  }
};
