const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const BurnoutAnalyzer = require('../services/burnout/analyzer');
const BurnoutRepository = require('../services/burnout/repository');
const burnoutEngine = require('../services/burnoutEngine');
const { AppDataSource } = require('../data-source');
const CalendarEvent = require('../entities/CalendarEvent');
const { Between, MoreThanOrEqual, LessThanOrEqual } = require('typeorm');

// Apply auth middleware to all burnout routes
router.use(authMiddleware);

// Get current burnout analysis
router.get('/analysis', async (req, res) => {
  try {
    const calendarData = req.body.calendarData || [];
    const analysis = await BurnoutAnalyzer.analyzeBurnout(calendarData);
    
    // Save the analysis results
    await BurnoutRepository.saveBurnoutScore(req.user.id, analysis);
    await BurnoutRepository.saveStressPatterns(req.user.id, analysis.patterns);
    
    res.json(analysis);
  } catch (error) {
    console.error('Error in burnout analysis:', error);
    res.status(500).json({ error: 'Failed to analyze burnout risk' });
  }
});

// Get historical patterns
router.get('/patterns', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const calendarData = req.body.calendarData || [];
    
    // Get historical data
    const [burnoutHistory, stressPatterns] = await Promise.all([
      BurnoutRepository.getBurnoutHistory(req.user.id, startDate, endDate),
      BurnoutRepository.getStressPatterns(req.user.id, startDate, endDate)
    ]);

    // Get current analysis
    const filteredData = calendarData.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
    });

    const analysis = await BurnoutAnalyzer.analyzeBurnout(filteredData);
    
    res.json({
      history: burnoutHistory,
      patterns: stressPatterns,
      currentAnalysis: {
        patterns: analysis.patterns,
        insights: analysis.insights,
        recommendations: analysis.recommendations
      }
    });
  } catch (error) {
    console.error('Error in pattern analysis:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

// Get real-time alerts
router.get('/alerts', async (req, res) => {
  try {
    const calendarData = req.body.calendarData || [];
    const analysis = await BurnoutAnalyzer.analyzeBurnout(calendarData);
    
    // Get active stress patterns
    const activePatterns = await BurnoutRepository.getActiveStressPatterns(req.user.id);
    
    const alerts = [];
    
    // Generate alerts based on analysis
    if (analysis.score >= 7.5) {
      alerts.push({
        type: 'high-risk',
        message: 'High burnout risk detected. Please review your schedule.',
        severity: 'high'
      });
    }

    if (analysis.patterns.some(p => p.severity === 'high')) {
      alerts.push({
        type: 'pattern-alert',
        message: 'Concerning work patterns detected. Check recommendations for details.',
        severity: 'medium'
      });
    }

    if (analysis.metrics.weekendWork) {
      alerts.push({
        type: 'weekend-work',
        message: 'Work detected on weekends. Consider rescheduling.',
        severity: 'medium'
      });
    }

    // Add alerts for active patterns
    const patternAlerts = activePatterns
      .filter(pattern => pattern.severity === 'high')
      .map(pattern => ({
        type: 'active-pattern',
        message: `Active pattern detected: ${pattern.description}`,
        severity: pattern.severity,
        pattern: pattern
      }));

    alerts.push(...patternAlerts);

    res.json({ alerts });
  } catch (error) {
    console.error('Error generating alerts:', error);
    res.status(500).json({ error: 'Failed to generate alerts' });
  }
});

/**
 * Get current burnout score
 * GET /api/burnout/score
 */
router.get('/score', async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.query.date ? new Date(req.query.date) : new Date();

    const scoreData = await burnoutEngine.calculateBurnoutScore(userId, date);
    await burnoutEngine.saveBurnoutScore(userId, scoreData);

    const riskLevel = burnoutEngine.getBurnoutRiskLevel(scoreData.score);

    res.json({
      score: scoreData.score,
      riskLevel,
      date: scoreData.date,
      metrics: scoreData.metrics,
      components: scoreData.components
    });
  } catch (error) {
    console.error('Error getting burnout score:', error);
    res.status(500).json({ error: 'Failed to calculate burnout score' });
  }
});

/**
 * Get burnout history
 * GET /api/burnout/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const scores = await burnoutEngine.getBurnoutScores(userId, startDate, endDate);

    // Transform scores to include risk levels
    const formattedScores = scores.map(score => ({
      ...score,
      riskLevel: burnoutEngine.getBurnoutRiskLevel(score.score)
    }));

    res.json(formattedScores);
  } catch (error) {
    console.error('Error getting burnout history:', error);
    res.status(500).json({ error: 'Failed to retrieve burnout history' });
  }
});

/**
 * Get burnout thresholds
 * GET /api/burnout/thresholds
 */
router.get('/thresholds', async (req, res) => {
  try {
    const userId = req.user.id;
    const thresholds = await burnoutEngine.getOrCreateThresholds(userId);
    res.json(thresholds);
  } catch (error) {
    console.error('Error getting burnout thresholds:', error);
    res.status(500).json({ error: 'Failed to retrieve burnout thresholds' });
  }
});

/**
 * Update burnout thresholds
 * PUT /api/burnout/thresholds
 */
router.put('/thresholds', async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const thresholds = await burnoutEngine.updateThresholds(userId, updates);
    res.json(thresholds);
  } catch (error) {
    console.error('Error updating burnout thresholds:', error);
    res.status(500).json({ error: 'Failed to update burnout thresholds' });
  }
});

/**
 * Get calendar events for burnout analysis
 * GET /api/burnout/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/calendar', async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to last 7 days
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to next 7 days

    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const events = await calendarRepo.find({
      where: {
        user_id: userId,
        start_time: Between(startDate, endDate)
      },
      order: {
        start_time: 'ASC'
      }
    });

    res.json(events);
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ error: 'Failed to retrieve calendar events' });
  }
});

/**
 * Add/update calendar event
 * POST /api/burnout/calendar
 */
router.post('/calendar', async (req, res) => {
  try {
    const userId = req.user.id;
    const eventData = req.body;

    if (!eventData.title || !eventData.start_time || !eventData.end_time) {
      return res.status(400).json({ error: 'Missing required event fields' });
    }

    const calendarRepo = AppDataSource.getRepository(CalendarEvent);

    // Check if event already exists (for updates)
    let event;
    if (eventData.id) {
      event = await calendarRepo.findOne({ where: { id: eventData.id, user_id: userId } });
    } else if (eventData.external_id) {
      event = await calendarRepo.findOne({ where: { external_id: eventData.external_id, user_id: userId } });
    }

    if (event) {
      // Update existing event
      Object.keys(eventData).forEach(key => {
        if (key !== 'id' && key !== 'user_id') {
          event[key] = eventData[key];
        }
      });
    } else {
      // Create new event
      event = calendarRepo.create({
        ...eventData,
        user_id: userId
      });
    }

    await calendarRepo.save(event);
    res.json(event);
  } catch (error) {
    console.error('Error saving calendar event:', error);
    res.status(500).json({ error: 'Failed to save calendar event' });
  }
});

/**
 * Delete calendar event
 * DELETE /api/burnout/calendar/:id
 */
router.delete('/calendar/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const event = await calendarRepo.findOne({ where: { id: eventId, user_id: userId } });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await calendarRepo.remove(event);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

/**
 * Get burnout insights
 * GET /api/burnout/insights
 */
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = new Date();

    // Get burnout scores for the last 30 days
    const scores = await burnoutEngine.getBurnoutScores(userId, startDate, endDate);

    // Get recent calendar events
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const events = await calendarRepo.find({
      where: {
        user_id: userId,
        start_time: {
          $gte: startDate
        },
        end_time: {
          $lte: endDate
        }
      }
    });

    // Calculate insights
    const insights = generateBurnoutInsights(scores, events);

    res.json(insights);
  } catch (error) {
    console.error('Error generating burnout insights:', error);
    res.status(500).json({ error: 'Failed to generate burnout insights' });
  }
});

/**
 * Generate insights from burnout scores and calendar data
 */
function generateBurnoutInsights(scores, events) {
  // Default response if not enough data
  if (!scores || scores.length < 5) {
    return {
      trend: 'NOT_ENOUGH_DATA',
      trendDescription: 'Not enough data to analyze burnout trends yet. Continue tracking for more insights.',
      suggestions: [
        'Schedule regular breaks throughout your day',
        'Try to limit meetings to 4 hours per day',
        'Ensure you have at least 2 focus blocks daily'
      ]
    };
  }

  // Calculate trend
  const recentScores = scores.slice(-7); // Last 7 days
  const avgRecentScore = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;
  const prevScores = scores.slice(-14, -7); // Previous 7 days
  const avgPrevScore = prevScores.length ? prevScores.reduce((sum, s) => sum + s.score, 0) / prevScores.length : avgRecentScore;

  const scoreDiff = avgRecentScore - avgPrevScore;

  // Determine trend
  let trend, trendDescription;
  if (scoreDiff >= 10) {
    trend = 'RAPIDLY_WORSENING';
    trendDescription = 'Your burnout indicators are rapidly worsening. Immediate intervention is recommended.';
  } else if (scoreDiff >= 5) {
    trend = 'WORSENING';
    trendDescription = 'Your burnout risk is increasing. Consider adjusting your work patterns.';
  } else if (scoreDiff <= -10) {
    trend = 'RAPIDLY_IMPROVING';
    trendDescription = 'Your burnout indicators are rapidly improving. Keep up the positive changes!';
  } else if (scoreDiff <= -5) {
    trend = 'IMPROVING';
    trendDescription = 'Your burnout risk is decreasing. Your current strategies appear to be working.';
  } else {
    trend = 'STABLE';
    trendDescription = 'Your burnout risk is relatively stable.';
  }

  // Meeting analysis
  const meetingEvents = events.filter(e => e.event_type === 'meeting');
  const totalMeetingHours = meetingEvents.reduce((sum, event) => {
    return sum + (new Date(event.end_time) - new Date(event.start_time)) / (1000 * 60 * 60);
  }, 0);
  const avgDailyMeetingHours = totalMeetingHours / 30; // Assuming 30 days

  // Focus block analysis
  const focusEvents = events.filter(e => e.event_type === 'focus');
  const totalFocusBlocks = focusEvents.length;
  const avgDailyFocusBlocks = totalFocusBlocks / 30; // Assuming 30 days

  // Generate suggestions
  const suggestions = [];

  // Meeting suggestions
  if (avgDailyMeetingHours > 4) {
    suggestions.push(`Consider reducing your meeting load (currently averaging ${avgDailyMeetingHours.toFixed(1)} hours/day)`);
  }

  // Focus block suggestions
  if (avgDailyFocusBlocks < 2) {
    suggestions.push(`Try to increase dedicated focus time (currently averaging only ${avgDailyFocusBlocks.toFixed(1)} focus blocks/day)`);
  }

  // Break suggestions
  if (recentScores.some(s => s.breaks_taken < 1)) {
    suggestions.push('Schedule more breaks throughout your workday');
  }

  // General suggestions
  suggestions.push('Consider timeboxing your workday to maintain boundaries');
  suggestions.push('Practice stress reduction techniques like deep breathing or short walks');

  return {
    trend,
    trendDescription,
    suggestions,
    averageScore: avgRecentScore,
    metrics: {
      avgDailyMeetingHours,
      avgDailyFocusBlocks
    }
  };
}

/**
 * Predict upcoming stress for the next 3 days
 * GET /api/burnout/predict
 */
router.get('/predict', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    const calendarRepo = AppDataSource.getRepository(CalendarEvent);
    const events = await calendarRepo.find({
      where: {
        user_id: userId,
        start_time: MoreThanOrEqual(today),
        end_time: LessThanOrEqual(threeDaysLater)
      },
      order: { start_time: 'ASC' }
    });

    if (events.length === 0) {
      return res.json({
        summary: 'No upcoming events found in the next 3 days. Your schedule looks clear!',
        recommendations: ['Use this time for deep work or take a well-deserved break.'],
        days: {}
      });
    }

    // Initialize daily metrics
    const dailyMetrics = {};
    for (let i = 0; i < 3; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];
      dailyMetrics[dayStr] = { meetings: 0, workHours: 0, events: 0 };
    }

    // Process events
    events.forEach(event => {
      const eventDate = new Date(event.start_time);
      const dayStr = eventDate.toISOString().split('T')[0];

      if (dailyMetrics[dayStr]) {
        dailyMetrics[dayStr].events += 1;
        dailyMetrics[dayStr].workHours += (new Date(event.end_time) - eventDate) / (1000 * 60 * 60);
        if (event.event_type === 'meeting') {
          dailyMetrics[dayStr].meetings += 1;
        }
      }
    });

    const totalMeetings = Object.values(dailyMetrics).reduce((sum, day) => sum + day.meetings, 0);
    const totalWorkHours = Object.values(dailyMetrics).reduce((sum, day) => sum + day.workHours, 0);

    let summary;
    const recommendations = [];

    if (totalMeetings > 8 || totalWorkHours > 20) {
      summary = `High-intensity period predicted with ${totalMeetings} meetings and ${totalWorkHours.toFixed(1)} work hours over the next 3 days.`;
      recommendations.push('Ensure you have breaks between back-to-back meetings.');
      recommendations.push('Prioritize tasks and delegate if possible.');
    } else if (totalMeetings > 5 || totalWorkHours > 12) {
      summary = `Moderate-intensity period predicted with ${totalMeetings} meetings and ${totalWorkHours.toFixed(1)} work hours.`;
      recommendations.push('Prepare for meetings in advance to reduce stress.');
      recommendations.push('Pace yourself and protect your focus time.');
    } else {
      summary = `Your schedule for the next 3 days seems balanced. Stress levels are predicted to be manageable.`;
      recommendations.push('Maintain this balance to prevent future burnout.');
    }

    res.json({ summary, recommendations, days: dailyMetrics });
  } catch (error) {
    console.error('Error predicting burnout:', error);
    res.status(500).json({ error: 'Failed to predict burnout' });
  }
});

module.exports = router; 