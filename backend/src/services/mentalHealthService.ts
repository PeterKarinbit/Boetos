import { prisma } from '../lib/prisma';
import { OpenViewerClient } from '../lib/openviewer';
import { BurnoutCalculator } from '../lib/burnoutCalculator';
// import { BurnoutCalculator } from '../lib/burnoutCalculator'; // TODO: Implement or restore this module if needed

const openviewer = new OpenViewerClient({
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  model: 'deepseek/deepseek-r1-0528:free'
});

interface MentalHealthData {
  userId: string;
  mood: number;
  stress: number;
  sleep: number;
  energy: number;
  notes?: string;
}

interface BurnoutAnalysis {
  riskLevel: number;
  riskCategory: 'low' | 'moderate' | 'high';
  factors: string[];
  recommendations: string[];
  insights: string;
}

interface UserPreferences {
  preferredActivities?: string[];
  wellnessGoals?: string[];
  workSchedule?: Record<string, any>;
  lifestyleFactors?: Record<string, any>;
}

export class MentalHealthService {
  async analyzeBurnoutRisk(data: MentalHealthData): Promise<BurnoutAnalysis> {
    try {
      // Get historical data for context
      const historicalData = await this.getHistoricalData(data.userId, 'week');
      
      // Calculate burnout score using the burnout calculator
      const burnoutScore = await this.calculateBurnoutScore(data);
      
      // Prepare the context for analysis
      const context = {
        currentMetrics: {
          mood: data.mood,
          stress: data.stress,
          sleep: data.sleep,
          energy: data.energy,
          burnoutScore: burnoutScore.score
        },
        historicalData,
        notes: data.notes
      };

      // Get analysis from OpenRouter
      const analysis = await openviewer.analyze({
        type: 'burnout-risk',
        context,
        options: {
          includeFactors: true,
          includeRecommendations: true,
          includeInsights: true
        }
      });

      // Save the analysis to the database
      await prisma.mentalHealthRecord.create({
        data: {
          userId: data.userId,
          mood: data.mood,
          stress: data.stress,
          sleep: data.sleep,
          energy: data.energy,
          notes: data.notes,
          riskLevel: burnoutScore.score,
          riskCategory: this.getRiskCategory(burnoutScore.score),
          factors: analysis.factors,
          recommendations: analysis.recommendations,
          insights: analysis.insights,
        },
      });

      return {
        ...analysis,
        score: burnoutScore.score,
        metrics: burnoutScore.metrics
      };
    } catch (error) {
      console.error('Error in mental health analysis:', error);
      throw new Error('Failed to analyze mental health data');
    }
  }

  private async calculateBurnoutScore(data: MentalHealthData) {
    // Get user's calendar data for the day
    const calendarData = await this.getUserCalendarData(data.userId);
    
    // Calculate burnout score using the burnout calculator
    const calculator = new BurnoutCalculator();
    const score = calculator.calculate(calendarData);
    
    // Adjust score based on mental health data
    const adjustedScore = this.adjustScoreWithMentalHealthData(score, data);
    
    return {
      score: adjustedScore,
      metrics: {
        meetingDensity: score.meetingDensity,
        workHours: score.workHours,
        breakScore: score.breakTime,
        weekendWork: score.weekendWork,
        intensity: score.intensity,
        mentalHealth: {
          mood: data.mood,
          stress: data.stress,
          sleep: data.sleep,
          energy: data.energy
        }
      }
    };
  }

  private adjustScoreWithMentalHealthData(baseScore: number, data: MentalHealthData): number {
    // Adjust score based on mental health metrics
    const moodAdjustment = (10 - data.mood) * 0.1; // Higher mood = lower burnout
    const stressAdjustment = data.stress * 0.15; // Higher stress = higher burnout
    const sleepAdjustment = (8 - data.sleep) * 0.1; // Less sleep = higher burnout
    const energyAdjustment = (10 - data.energy) * 0.1; // Lower energy = higher burnout

    const totalAdjustment = moodAdjustment + stressAdjustment + sleepAdjustment + energyAdjustment;
    return Math.min(100, Math.max(0, baseScore + totalAdjustment));
  }

  private getRiskCategory(score: number): string {
    if (score < 30) return 'LOW';
    if (score < 60) return 'MODERATE';
    return 'HIGH';
  }

  private async getUserCalendarData(userId: string) {
    // Implement calendar data retrieval
    // This should fetch the user's calendar events for the current day
    return [];
  }

  async hasCompletedCheckInToday(userId: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayRecord = await prisma.mentalHealthRecord.findFirst({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return !!todayRecord;
  }

  async getHistoricalData(userId: string, period: 'week' | 'month' | 'year') {
    const date = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(date.setDate(date.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(date.setMonth(date.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(date.setFullYear(date.getFullYear() - 1));
        break;
      default:
        startDate = new Date(date.setDate(date.getDate() - 7));
    }

    return prisma.mentalHealthRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getRecommendations(userId: string) {
    const recentData = await this.getHistoricalData(userId, 'week');
    
    if (recentData.length === 0) {
      return {
        recommendations: [
          "Start tracking your daily mood and stress levels",
          "Set up regular check-ins with the burnout tracker",
          "Consider establishing a daily wellness routine"
        ]
      };
    }

    // Get user preferences for context
    const preferences = await this.getUserPreferences(userId);

    // Get personalized recommendations from OpenRouter
    const recommendations = await openviewer.analyze({
      type: 'wellness-recommendations',
      context: {
        historicalData: recentData,
        userPreferences: preferences
      },
      options: {
        includeImmediateActions: true,
        includeLongTermStrategies: true,
        includeWellnessActivities: true,
        includeWorkLifeBalance: true
      }
    });

    return recommendations;
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Get user preferences from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    if (!user?.preferences) {
      return {
        preferredActivities: [],
        wellnessGoals: [],
        workSchedule: {},
        lifestyleFactors: {}
      };
    }

    // Parse the JSON preferences
    const preferences = user.preferences as UserPreferences;
    return {
      preferredActivities: preferences.preferredActivities || [],
      wellnessGoals: preferences.wellnessGoals || [],
      workSchedule: preferences.workSchedule || {},
      lifestyleFactors: preferences.lifestyleFactors || {}
    };
  }
} 