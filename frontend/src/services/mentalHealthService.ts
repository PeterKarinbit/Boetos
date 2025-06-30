import api from './api';

export interface BurnoutAnalysis {
  score: number;
  level: string;
  metrics: {
    meetingDensity: number;
    workHours: number;
    breakScore: number;
    weekendWork: boolean;
    intensity: number;
  };
  insights: string;
  patterns: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
  recommendations: string[];
}

export interface StressPattern {
  id: string;
  patternType: string;
  description: string;
  severity: string;
  frequency: string;
  detectedAt: string;
  metadata: any;
}

export interface BurnoutHistory {
  id: string;
  date: string;
  score: number;
  metrics: any;
  aiInsights: string;
  recommendations: string[];
}

export interface Alert {
  type: string;
  message: string;
  severity: string;
  pattern?: StressPattern;
}

export interface DailySurveyData {
  mood: number;
  stress: number;
  sleep: number;
  energy: number;
  notes: string;
  nudgePreference: string;
}

class MentalHealthService {
  async getBurnoutAnalysis(calendarData: any[]): Promise<BurnoutAnalysis> {
    const response = await api.post('/api/burnout/analysis', { calendarData });
    return response.data;
  }

  async getHistoricalPatterns(startDate: string, endDate: string, calendarData: any[]): Promise<{
    history: BurnoutHistory[];
    patterns: StressPattern[];
    currentAnalysis: {
      patterns: any[];
      insights: string;
      recommendations: string[];
    };
  }> {
    const response = await api.get('/api/burnout/patterns', {
      params: { startDate, endDate },
      data: { calendarData }
    });
    return response.data;
  }

  async getAlerts(calendarData: any[]): Promise<Alert[]> {
    const response = await api.get('/api/burnout/alerts', { data: { calendarData } });
    return response.data.alerts;
  }

  async getBurnoutHistory(startDate: string, endDate: string): Promise<BurnoutHistory[]> {
    const response = await api.get('/api/burnout/history', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  async submitDailySurvey(data: DailySurveyData): Promise<any> {
    const response = await api.post('/api/mental-health/check-in', {
      mood: data.mood,
      stress: data.stress,
      sleep: data.sleep,
      energy: data.energy,
      notes: data.notes
    });
    return response.data;
  }

  async getDailySurveyStatus(): Promise<{ completedToday: boolean }> {
    const response = await api.get('/api/mental-health/status');
    return response.data;
  }

  async getCheckInStreak(): Promise<{ streak: number }> {
    const response = await api.get('/api/mental-health/streak');
    return response.data;
  }

  async getHistoricalData(period: 'week' | 'month' | 'year'): Promise<any> {
    const response = await api.get(`/api/mental-health/history/${period}`);
    return response.data;
  }

  async getRecommendations(): Promise<any> {
    const response = await api.get('/api/mental-health/recommendations');
    return response.data;
  }
}

export const mentalHealthService = new MentalHealthService(); 