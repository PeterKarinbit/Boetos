const { AppDataSource } = require('../data-source');
const logger = require('../utils/logger');
const { MoreThanOrEqual } = require('typeorm');

class MentalHealthService {
  constructor() {
    this.initializeRepository();
  }

  async initializeRepository() {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      this.mentalHealthRepository = AppDataSource.getRepository('MentalHealthCheck');
      logger.info('MentalHealthService repository initialized');
    } catch (error) {
      logger.error('Failed to initialize MentalHealthService repository:', error);
      throw error;
    }
  }

  async analyzeBurnoutRisk({ userId, mood, stress, sleep, energy, notes }) {
    try {
      if (!this.mentalHealthRepository) {
        await this.initializeRepository();
      }

      // Calculate risk score based on inputs
      const riskScore = this.calculateRiskScore({ mood, stress, sleep, energy });
      
      // Save the check-in
      const checkIn = await this.mentalHealthRepository.save({
        user_id: userId,
        mood,
        stress,
        sleep,
        energy,
        notes,
        risk_score: riskScore,
        created_at: new Date()
      });

      // Generate insights based on the data
      const insights = this.generateInsights({ mood, stress, sleep, energy, riskScore });

      return {
        checkIn,
        riskScore,
        insights,
        recommendations: this.getRecommendations(riskScore)
      };
    } catch (error) {
      logger.error('Error in analyzeBurnoutRisk:', error);
      throw error;
    }
  }

  calculateRiskScore({ mood, stress, sleep, energy }) {
    // Normalize inputs to 0-1 scale
    const normalizedMood = (mood - 1) / 4; // Assuming 1-5 scale
    const normalizedStress = (stress - 1) / 4;
    const normalizedSleep = (sleep - 1) / 4;
    const normalizedEnergy = (energy - 1) / 4;

    // Calculate weighted score (higher stress and lower mood/sleep/energy = higher risk)
    const score = (
      (1 - normalizedMood) * 0.3 +
      normalizedStress * 0.3 +
      (1 - normalizedSleep) * 0.2 +
      (1 - normalizedEnergy) * 0.2
    ) * 10; // Scale to 0-10

    return Math.round(score * 10) / 10; // Round to 1 decimal place
  }

  generateInsights({ mood, stress, sleep, energy, riskScore }) {
    const insights = [];

    if (mood <= 2) {
      insights.push('Your mood is significantly low. Consider taking some time for self-care.');
    }
    if (stress >= 4) {
      insights.push('You\'re experiencing high stress levels. Try to identify and address the main stressors.');
    }
    if (sleep <= 2) {
      insights.push('Your sleep quality is poor. Consider improving your sleep hygiene.');
    }
    if (energy <= 2) {
      insights.push('Your energy levels are low. This might indicate burnout or fatigue.');
    }
    if (riskScore >= 7) {
      insights.push('You\'re at high risk of burnout. Consider taking immediate action.');
    }

    return insights;
  }

  async hasCompletedCheckInToday(userId) {
    try {
      if (!this.mentalHealthRepository) {
        await this.initializeRepository();
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkIn = await this.mentalHealthRepository.findOne({
        where: {
          user_id: userId,
          created_at: MoreThanOrEqual(today)
        }
      });

      return !!checkIn;
    } catch (error) {
      logger.error('Error in hasCompletedCheckInToday:', error);
      throw error;
    }
  }

  async getHistoricalData(userId, period) {
    try {
      if (!this.mentalHealthRepository) {
        await this.initializeRepository();
      }

      const startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          throw new Error('Invalid period specified');
      }

      const checkIns = await this.mentalHealthRepository.find({
        where: {
          user_id: userId,
          created_at: MoreThanOrEqual(startDate)
        },
        order: {
          created_at: 'ASC'
        }
      });

      return {
        checkIns,
        period,
        averageRiskScore: this.calculateAverageRiskScore(checkIns)
      };
    } catch (error) {
      logger.error('Error in getHistoricalData:', error);
      throw error;
    }
  }

  calculateAverageRiskScore(checkIns) {
    if (!checkIns.length) return 0;
    const sum = checkIns.reduce((acc, checkIn) => acc + checkIn.risk_score, 0);
    return Math.round((sum / checkIns.length) * 10) / 10;
  }

  getRecommendations(riskScore) {
    const recommendations = [];

    if (riskScore >= 7) {
      recommendations.push(
        'Consider taking a short break or vacation',
        'Schedule regular check-ins with a mental health professional',
        'Reduce work hours temporarily if possible',
        'Practice daily stress-reduction techniques'
      );
    } else if (riskScore >= 5) {
      recommendations.push(
        'Take regular breaks during work',
        'Maintain a consistent sleep schedule',
        'Engage in regular physical activity',
        'Practice mindfulness or meditation'
      );
    } else {
      recommendations.push(
        'Continue monitoring your mental health',
        'Maintain healthy work-life boundaries',
        'Keep up with your current self-care practices'
      );
    }

    return recommendations;
  }

  async getCheckInStreak(userId) {
    try {
      if (!this.mentalHealthRepository) {
        await this.initializeRepository();
      }

      // Get all check-ins for this user, ordered by date descending
      const checkIns = await this.mentalHealthRepository.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' }
      });

      if (checkIns.length === 0) {
        return 0; // No check-ins at all
      }

      // Find the most recent check-in date
      const mostRecentCheckIn = new Date(checkIns[0].created_at);
      mostRecentCheckIn.setHours(0, 0, 0, 0); // Start of day

      // Count consecutive days backwards from the most recent check-in
      let streak = 0;
      let currentDate = new Date(mostRecentCheckIn);

      while (true) {
        // Check if there's a check-in for this date
        const hasCheckInForDate = checkIns.some(checkIn => {
          const checkInDate = new Date(checkIn.created_at);
          checkInDate.setHours(0, 0, 0, 0);
          return checkInDate.getTime() === currentDate.getTime();
        });

        if (hasCheckInForDate) {
          streak++;
          // Move to previous day
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break; // Found a gap, stop counting
        }
      }

      return streak;
    } catch (error) {
      logger.error('Error calculating check-in streak:', error);
      return 0; // Return 0 on error to avoid breaking notifications
    }
  }
}

module.exports = { MentalHealthService }; 