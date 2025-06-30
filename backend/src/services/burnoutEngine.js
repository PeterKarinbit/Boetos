/**
 * Burnout Tracking Engine
 * 
 * This service implements the core burnout calculation algorithm based on
 * calendar data, work patterns, and other burnout indicators.
 */

const { AppDataSource } = require('../data-source');
const BurnoutScore = require('../entities/BurnoutScore');
const CalendarEvent = require('../entities/CalendarEvent');
const BurnoutThreshold = require('../entities/BurnoutThreshold');
const User = require('../entities/User');
const { Between } = require('typeorm');

// Time windows for analysis
const TIME_WINDOWS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

/**
 * Calculate burnout score based on various factors
 * 
 * The algorithm weighs several factors:
 * 1. Meeting density (higher = more burnout risk)
 * 2. Work hours (higher = more burnout risk)
 * 3. Focus blocks (lower = more burnout risk)
 * 4. Breaks taken (lower = more burnout risk)
 * 5. Sleep quality/quantity (lower = more burnout risk)
 * 
 * Score range: 0-100
 * 0-25: Low burnout risk
 * 26-50: Moderate burnout risk
 * 51-75: High burnout risk
 * 76-100: Severe burnout risk
 */
async function calculateBurnoutScore(userId, date = new Date(), survey = null) {
  try {
    // Format date to YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];

    // Initialize repositories
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const thresholdRepo = AppDataSource.getRepository(BurnoutThreshold);

    // Get user's custom thresholds or create default ones
    let thresholds = await thresholdRepo.findOne({ where: { user_id: userId } });
    if (!thresholds) {
      const defaultThresholds = thresholdRepo.create({
        user_id: userId
      });
      thresholds = await thresholdRepo.save(defaultThresholds);
    }

    // Calculate start and end of the day
    const startOfDay = new Date(formattedDate);
    const endOfDay = new Date(formattedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all calendar events for the day
    const events = await calendarRepo.find({
      where: {
        user_id: userId,
        start_time: Between(startOfDay, endOfDay)
      }
    });

    // Calculate metrics
    let metrics = calculateDailyMetrics(events, thresholds);

    // If survey is provided, use its values for sleep, mood, stress, energy
    if (survey) {
      metrics = {
        ...metrics,
        sleepHours: survey.sleep,
        mood: survey.mood,
        stress: survey.stress,
        energy: survey.energy,
        notes: survey.notes
      };
    }

    // Calculate burnout score components
    const meetingScore = calculateMeetingScore(metrics.meetingHours, thresholds);
    const workHoursScore = calculateWorkHoursScore(metrics.workHours, thresholds);
    const focusScore = calculateFocusScore(metrics.focusBlocks, thresholds);
    const breakScore = calculateBreakScore(metrics.breaksTaken, thresholds);
    // Use survey sleep if available, else metrics.sleepHours
    const sleepScore = calculateSleepScore(metrics.sleepHours, thresholds);

    // Apply weights to individual scores
    let weightedScore = (
      meetingScore * thresholds.meeting_weight +
      workHoursScore * thresholds.work_hours_weight +
      focusScore * thresholds.focus_weight +
      breakScore * thresholds.break_weight +
      sleepScore * thresholds.sleep_weight
    );

    // If survey is provided, adjust score based on mood, stress, energy
    if (survey) {
      // Lower mood, higher stress, lower energy = higher burnout
      const moodAdj = (typeof survey.mood === 'number' ? (10 - survey.mood) * 0.02 : 0);
      const stressAdj = (typeof survey.stress === 'number' ? survey.stress * 0.03 : 0);
      const energyAdj = (typeof survey.energy === 'number' ? (10 - survey.energy) * 0.02 : 0);
      weightedScore += moodAdj + stressAdj + energyAdj;
    }

    // Normalize to 0-100 scale
    const normalizedScore = Math.min(100, Math.max(0, weightedScore * 100));

    return {
      score: Math.round(normalizedScore * 10) / 10, // Round to 1 decimal
      date: formattedDate,
      metrics,
      components: {
        meetingScore,
        workHoursScore,
        focusScore,
        breakScore,
        sleepScore
      },
      thresholds
    };
  } catch (error) {
    console.error('Error calculating burnout score:', error);
    throw error;
  }
}

/**
 * Extract daily metrics from calendar events
 */
function calculateDailyMetrics(events, thresholds) {
  let meetingHours = 0;
  let workHours = 0;
  let focusBlocks = 0;
  let breaksTaken = 0;

  // Default sleep hours - in real app, this would come from sleep tracker integration
  const sleepHours = 7.0; 

  // Process each event to calculate metrics
  events.forEach(event => {
    const durationHours = (new Date(event.end_time) - new Date(event.start_time)) / (1000 * 60 * 60);

    switch(event.event_type) {
      case 'meeting':
        meetingHours += durationHours;
        workHours += durationHours;
        break;
      case 'focus':
        focusBlocks += 1;
        workHours += durationHours;
        break;
      case 'break':
        breaksTaken += durationHours;
        break;
      default:
        // For other event types, still count as work if during work hours
        const hour = new Date(event.start_time).getHours();
        if (hour >= 9 && hour <= 17) { // Assume 9-5 workday
          workHours += durationHours;
        }
    }
  });

  return {
    meetingHours,
    workHours,
    focusBlocks,
    breaksTaken,
    sleepHours
  };
}

/**
 * Calculate meeting score component (0-1)
 * Higher meeting hours = higher score = higher burnout risk
 */
function calculateMeetingScore(meetingHours, thresholds) {
  const maxMeetingHours = thresholds.max_meeting_hours_per_day;
  // Non-linear scoring: exponential increase as we approach threshold
  return Math.min(1, Math.pow(meetingHours / maxMeetingHours, 2));
}

/**
 * Calculate work hours score component (0-1)
 * Higher work hours = higher score = higher burnout risk
 */
function calculateWorkHoursScore(workHours, thresholds) {
  const maxWorkHours = thresholds.max_work_hours_per_day;
  // After threshold, score increases more rapidly
  if (workHours <= maxWorkHours) {
    return 0.5 * (workHours / maxWorkHours);
  } else {
    return 0.5 + 0.5 * Math.min(1, (workHours - maxWorkHours) / 4);
  }
}

/**
 * Calculate focus score component (0-1)
 * Lower focus blocks = higher score = higher burnout risk
 */
function calculateFocusScore(focusBlocks, thresholds) {
  const minFocusBlocks = thresholds.min_focus_blocks_per_day;
  // Inverse relationship: fewer focus blocks = higher burnout risk
  return Math.max(0, 1 - (focusBlocks / minFocusBlocks));
}

/**
 * Calculate break score component (0-1)
 * Lower breaks = higher score = higher burnout risk
 */
function calculateBreakScore(breaksTaken, thresholds) {
  const minBreakHours = thresholds.min_break_hours_per_day;
  // Inverse relationship: fewer breaks = higher burnout risk
  return Math.max(0, 1 - (breaksTaken / minBreakHours));
}

/**
 * Calculate sleep score component (0-1)
 * Lower sleep = higher score = higher burnout risk
 */
function calculateSleepScore(sleepHours, thresholds) {
  const minSleepHours = thresholds.min_sleep_hours;
  // Inverse relationship: less sleep = higher burnout risk
  // More punitive for very low sleep
  if (sleepHours >= minSleepHours) {
    return 0;
  } else if (sleepHours >= minSleepHours * 0.8) {
    return 0.3 * (1 - (sleepHours / minSleepHours));
  } else {
    return 0.3 + 0.7 * (1 - (sleepHours / (minSleepHours * 0.8)));
  }
}

/**
 * Save a burnout score to the database
 */
async function saveBurnoutScore(userId, scoreData) {
  try {
    const burnoutRepo = AppDataSource.getRepository(BurnoutScore);

    // Check if a score already exists for this date
    const existingScore = await burnoutRepo.findOne({
      where: {
        user_id: userId,
        date: scoreData.date
      }
    });

    if (existingScore) {
      // Update existing score
      existingScore.score = scoreData.score;
      existingScore.meeting_hours = scoreData.metrics.meetingHours;
      existingScore.work_hours = scoreData.metrics.workHours;
      existingScore.focus_blocks = scoreData.metrics.focusBlocks;
      existingScore.breaks_taken = scoreData.metrics.breaksTaken;
      existingScore.sleep_hours = scoreData.metrics.sleepHours;
      existingScore.stress_indicators = scoreData.components;

      return await burnoutRepo.save(existingScore);
    } else {
      // Create new score
      const newScore = burnoutRepo.create({
        user_id: userId,
        score: scoreData.score,
        date: scoreData.date,
        meeting_hours: scoreData.metrics.meetingHours,
        work_hours: scoreData.metrics.workHours,
        focus_blocks: scoreData.metrics.focusBlocks,
        breaks_taken: scoreData.metrics.breaksTaken,
        sleep_hours: scoreData.metrics.sleepHours,
        stress_indicators: scoreData.components
      });

      return await burnoutRepo.save(newScore);
    }
  } catch (error) {
    console.error('Error saving burnout score:', error);
    throw error;
  }
}

/**
 * Get burnout scores for a user within a time range
 */
async function getBurnoutScores(userId, startDate, endDate) {
  try {
    const burnoutRepo = AppDataSource.getRepository(BurnoutScore);

    return await burnoutRepo.find({
      where: {
        user_id: userId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      },
      order: {
        date: 'ASC'
      }
    });
  } catch (error) {
    console.error('Error fetching burnout scores:', error);
    throw error;
  }
}

/**
 * Get current burnout risk level
 */
function getBurnoutRiskLevel(score) {
  if (score <= 25) return { level: 'LOW', label: 'Low Risk' };
  if (score <= 50) return { level: 'MODERATE', label: 'Moderate Risk' };
  if (score <= 75) return { level: 'HIGH', label: 'High Risk' };
  return { level: 'SEVERE', label: 'Severe Risk' };
}

/**
 * Get or create burnout thresholds for a user
 */
async function getOrCreateThresholds(userId) {
  try {
    const thresholdRepo = AppDataSource.getRepository(BurnoutThreshold);

    let thresholds = await thresholdRepo.findOne({ where: { user_id: userId } });
    if (!thresholds) {
      const defaultThresholds = thresholdRepo.create({
        user_id: userId
      });
      thresholds = await thresholdRepo.save(defaultThresholds);
    }

    return thresholds;
  } catch (error) {
    console.error('Error getting burnout thresholds:', error);
    throw error;
  }
}

/**
 * Update burnout thresholds for a user
 */
async function updateThresholds(userId, updates) {
  try {
    const thresholdRepo = AppDataSource.getRepository(BurnoutThreshold);

    const thresholds = await getOrCreateThresholds(userId);

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key in thresholds) {
        thresholds[key] = updates[key];
      }
    });

    return await thresholdRepo.save(thresholds);
  } catch (error) {
    console.error('Error updating burnout thresholds:', error);
    throw error;
  }
}

module.exports = {
  calculateBurnoutScore,
  saveBurnoutScore,
  getBurnoutScores,
  getBurnoutRiskLevel,
  getOrCreateThresholds,
  updateThresholds,
  TIME_WINDOWS
};
