const express = require('express');
const { MentalHealthService } = require('../services/mentalHealthService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
let mentalHealthService;

// Initialize service
const initializeService = async () => {
  try {
    if (!mentalHealthService) {
      mentalHealthService = new MentalHealthService();
      await mentalHealthService.initializeRepository();
      logger.info('Mental health service initialized');
    }
  } catch (error) {
    logger.error('Failed to initialize mental health service:', error);
    throw error;
  }
};

// Initialize service when routes are loaded
initializeService().catch(error => {
  logger.error('Failed to initialize mental health service:', error);
});

// Submit a mental health check-in
router.post('/check-in', auth, async (req, res) => {
  try {
    if (!mentalHealthService) {
      await initializeService();
    }

    const { mood, stress, sleep, energy, notes } = req.body;
    const userId = req.user.userId;

    if (!mood || !stress || !sleep || !energy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const analysis = await mentalHealthService.analyzeBurnoutRisk({
      userId,
      mood,
      stress,
      sleep,
      energy,
      notes,
    });

    res.json(analysis);
  } catch (error) {
    logger.error('Error in check-in:', error);
    res.status(500).json({ error: 'Failed to process check-in' });
  }
});

// Get daily check-in status
router.get('/status', auth, async (req, res) => {
  try {
    if (!mentalHealthService) {
      await initializeService();
    }

    const userId = req.user.userId;
    const completedToday = await mentalHealthService.hasCompletedCheckInToday(userId);
    res.json({ completedToday });
  } catch (error) {
    logger.error('Error checking daily check-in status:', error);
    res.status(500).json({ error: 'Failed to check daily check-in status' });
  }
});

// Get historical data
router.get('/history/:period', auth, async (req, res) => {
  try {
    if (!mentalHealthService) {
      await initializeService();
    }

    const { period } = req.params;
    const userId = req.user.userId;

    if (!['week', 'month', 'year'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period specified' });
    }

    const data = await mentalHealthService.getHistoricalData(userId, period);
    res.json(data);
  } catch (error) {
    logger.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Get current check-in streak
router.get('/streak', auth, async (req, res) => {
  try {
    if (!mentalHealthService) {
      await initializeService();
    }

    const userId = req.user.userId;
    const streak = await mentalHealthService.getCheckInStreak(userId);
    
    res.json({ streak });
  } catch (error) {
    logger.error('Error fetching streak:', error);
    res.status(500).json({ error: 'Failed to fetch streak data' });
  }
});

// Get personalized recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    if (!mentalHealthService) {
      await initializeService();
    }

    const userId = req.user.userId;
    const recommendations = await mentalHealthService.getRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router; 