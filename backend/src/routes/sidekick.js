const express = require('express');
const router = express.Router();
const sidekickService = require('../services/sidekick.service');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// POST /api/sidekick/event
router.post('/event', authMiddleware, async (req, res) => {
  try {
    const { event, userId } = req.body;

    // Validate request
    if (!event || !userId) {
      return res.status(400).json({ error: 'event and userId are required' });
    }

    // Ensure user can only access their own data
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    logger.info(`Processing Sidekick event: ${event} for user: ${userId}`);
    const result = await sidekickService.handleEvent({ event, userId });
    
    if (!result || !result.message) {
      throw new Error('Invalid response from Sidekick service');
    }

    logger.info(`Sidekick response for ${userId}:`, result);

    // Optionally, generate TTS audio
    let audioUrl = null;
    if (req.user.preferences?.voice) {
      audioUrl = await sidekickService.tts(result.message);
    }

    res.json({ message: result.message, audioUrl });
  } catch (err) {
    logger.error('Sidekick event error:', err);
    res.status(500).json({ 
      error: 'Failed to process Sidekick event',
      message: `Welcome back${req.user?.name ? `, ${req.user.name}` : ''}! I'm having trouble accessing your information right now, but I'm here to help.`
    });
  }
});

// POST /api/sidekick/overwhelmed
router.post('/overwhelmed', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const output = await sidekickService.handleOverwhelmed(userId);
    res.json({ output });
  } catch (err) {
    logger.error('Sidekick overwhelmed error:', err);
    res.status(500).json({ error: 'Failed to process overwhelmed request', output: 'Sorry, I was unable to generate tips at this time.' });
  }
});

module.exports = router; 