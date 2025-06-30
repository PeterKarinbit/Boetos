const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { google } = require('googleapis');
const { VoiceAssistantService } = require('../services/voice-assistant.service');
const authMiddleware = require('../middleware/authMiddleware');
const { AppDataSource } = require('../data-source');
const { User } = require('../entities/User');
const { Activity } = require('../entities/Activity');
const { Meeting } = require('../entities/Meeting');
const UserVoiceSettings = require('../entities/UserVoiceSettings');

// Initialize repositories
const voiceAssistantService = new VoiceAssistantService();
const userRepository = AppDataSource.getRepository(User);
const activityRepository = AppDataSource.getRepository(Activity);
const meetingRepository = AppDataSource.getRepository(Meeting);

// Initialize repositories when needed
async function getVoiceSettingsRepository() {
  return AppDataSource.getRepository(UserVoiceSettings);
}

// Endpoint to process voice assistant requests
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get user voice settings
    const voiceSettingsRepo = await getVoiceSettingsRepository();
    const voiceSettings = await voiceSettingsRepo.findOne({ where: { user_id: userId } });

    if (!voiceSettings) {
      return res.status(404).json({ error: 'Voice settings not found for user' });
    }

    // Step 1: Get response from LLM (OpenRouter or similar)
    const llmResponse = await getLLMResponse(prompt);
    console.log('OpenRouter/DeepSeek LLM Response:', llmResponse);

    // Step 2: If voice is enabled, convert to speech using ElevenLabs
    let audioUrl = null;
    if (voiceSettings.voice_enabled && llmResponse) {
      audioUrl = await getTextToSpeech(llmResponse, voiceSettings);
      console.log('ElevenLabs audioUrl generated:', !!audioUrl);
    }

    // Return both text and audio URL
    res.json({
      text: llmResponse,
      audioUrl: audioUrl,
      voiceEnabled: voiceSettings.voice_enabled
    });
  } catch (error) {
    console.error('Voice assistant error:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to process voice assistant request', details: error.message });
  }
});

// Function to get LLM response from OpenRouter or similar service
async function getLLMResponse(prompt) {
  console.log('Calling OpenRouter/DeepSeek with prompt:', prompt);
  try {
    // Using OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.warn('OpenRouter API key not found, using fallback response');
      return `I'm sorry, but I'm not fully configured yet. Please ask an administrator to set up the OpenRouter API key.`;
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528:free', // Use DeepSeek model
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      console.error('Error getting LLM response:', error.response.status, error.response.statusText, error.response.data);
    } else {
      console.error('Error getting LLM response:', error.message || error);
    }
    throw new Error('Failed to get response from language model');
  }
}

// Function to convert text to speech using ElevenLabs
async function getTextToSpeech(text, voiceSettings) {
  try {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      console.warn('ElevenLabs API key not found');
      return null;
    }

    // Get voice ID from settings or use default
    const voiceId = voiceSettings.voice_id || '21m00Tcm4TlvDq8ikWAM'; // Default voice ID

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: voiceSettings.voice_model || 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true,
          // Apply user's voice settings
          speed: voiceSettings.voice_speed,
          pitch: voiceSettings.voice_pitch,
          volume: voiceSettings.voice_volume
        }
      },
      {
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    );

    // Convert the audio buffer to base64 for sending to client
    const audioBase64 = Buffer.from(response.data).toString('base64');
    return `data:audio/mpeg;base64,${audioBase64}`;
  } catch (error) {
    console.error('Error getting text-to-speech:', error);
    return null;
  }
}

// Get available ElevenLabs voices
router.get('/voices', authMiddleware, async (req, res) => {
  try {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      return res.status(400).json({ error: 'ElevenLabs API key not configured' });
    }

    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data.voices);
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// Update user voice settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    const voiceSettingsRepo = await getVoiceSettingsRepository();
    let voiceSettings = await voiceSettingsRepo.findOne({ where: { user_id: userId } });

    if (!voiceSettings) {
      return res.status(404).json({ error: 'Voice settings not found' });
    }

    // Update only the provided fields
    Object.keys(settings).forEach(key => {
      // Convert camelCase to snake_case for database columns
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (dbKey in voiceSettings) {
        voiceSettings[dbKey] = settings[key];
      }
    });

    await voiceSettingsRepo.save(voiceSettings);
    res.json(voiceSettings);
  } catch (error) {
    console.error('Error updating voice settings:', error);
    res.status(500).json({ error: 'Failed to update voice settings' });
  }
});

module.exports = router;

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/wave' || file.mimetype === 'audio/mpeg') {
            cb(null, true);
        } else {
            cb(new Error('Only WAV or MP3 audio files are allowed'));
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 10MB' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// Add transcribe endpoint
router.post('/transcribe', authMiddleware, upload.single('audio'), handleMulterError, async (req, res) => {
    try {
        const audioFile = req.file;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!audioFile) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        // Convert speech to text using the voice assistant service
        const text = await voiceAssistantService.speechToTextService.convertSpeechToText(audioFile.buffer);
        res.json({ text });
    } catch (error) {
        console.error('Transcription error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({ 
            error: 'Failed to transcribe audio',
            message: error.message
        });
    }
});

// Handle voice command processing
router.post('/process', authMiddleware, upload.single('audio'), handleMulterError, async (req, res) => {
    try {
        const { userId } = req.body;
        const audioFile = req.file;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!audioFile) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const result = await voiceAssistantService.processVoiceCommand(user.id, audioFile.buffer);
        res.json(result);
    } catch (error) {
        console.error('Voice processing error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({ 
            error: 'Failed to process voice command',
            message: error.message
        });
    }
});

// Text to speech endpoint
router.post('/text-to-speech', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!text) {
            return res.status(400).json({ error: 'Missing text parameter' });
        }

        if (typeof text !== 'string' || text.length > 5000) {
            return res.status(400).json({ error: 'Invalid text parameter. Must be a string under 5000 characters' });
        }

        const audioBuffer = await voiceAssistantService.getElevenLabsAudio(text);
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error) {
        console.error('Text to speech error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({ 
            error: 'Failed to convert text to speech',
            message: error.message
        });
    }
});

// Get voice settings
router.get('/settings', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const user = await userRepository.findOne({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            voiceEnabled: user.voiceEnabled || false,
            voiceLanguage: user.voiceLanguage || 'en-US',
            voiceGender: user.voiceGender || 'female',
            voiceSpeed: user.voiceSpeed || 1.0,
            voiceVolume: user.voiceVolume || 1.0,
            voicePitch: user.voicePitch || 1.0
        });
    } catch (err) {
        console.error('Error fetching voice settings:', err);
        res.status(500).json({ error: 'Failed to fetch voice settings' });
    }
});

// Update voice settings
router.put('/settings', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { voiceEnabled, voiceLanguage, voiceGender, voiceSpeed, voiceVolume, voicePitch } = req.body;

  try {
    const user = await userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.voiceEnabled = voiceEnabled !== undefined ? voiceEnabled : user.voiceEnabled;
    user.voiceLanguage = voiceLanguage || user.voiceLanguage;
    user.voiceGender = voiceGender || user.voiceGender;
    user.voiceSpeed = voiceSpeed || user.voiceSpeed;
    user.voiceVolume = voiceVolume || user.voiceVolume;
    user.voicePitch = voicePitch || user.voicePitch;

    await userRepository.save(user);

    // Log activity
    const activity = activityRepository.create({
      userId: user.id,
      type: 'VOICE_SETTINGS_UPDATE',
      description: 'Voice settings updated',
      metadata: {
        voiceEnabled: user.voiceEnabled,
        voiceLanguage: user.voiceLanguage,
        voiceGender: user.voiceGender,
        voiceSpeed: user.voiceSpeed,
        voiceVolume: user.voiceVolume,
        voicePitch: user.voicePitch
      }
    });
    await activityRepository.save(activity);

    res.json({
      voiceEnabled: user.voiceEnabled,
      voiceLanguage: user.voiceLanguage,
      voiceGender: user.voiceGender,
      voiceSpeed: user.voiceSpeed,
      voiceVolume: user.voiceVolume,
      voicePitch: user.voicePitch
    });
  } catch (err) {
    console.error('Error updating voice settings:', err);
    res.status(500).json({ error: 'Failed to update voice settings' });
  }
});

// Get voice commands
router.get('/commands', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get upcoming meetings
    const now = new Date();
    const meetings = await meetingRepository.find({
      where: {
        userId: user.id,
        startTime: { $gte: now }
      },
      order: { startTime: 'ASC' },
      take: 5
    });

    // Get recent activities
    const activities = await activityRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: 5
    });

    res.json({
      commands: [
        {
          command: 'Show upcoming meetings',
          description: 'Lists your next 5 upcoming meetings',
          data: meetings
        },
        {
          command: 'Show recent activities',
          description: 'Lists your 5 most recent activities',
          data: activities
        },
        {
          command: 'Enable voice',
          description: 'Enables voice commands',
          action: 'enableVoice'
        },
        {
          command: 'Disable voice',
          description: 'Disables voice commands',
          action: 'disableVoice'
        },
        {
          command: 'Change voice language',
          description: 'Changes the voice language',
          action: 'changeVoiceLanguage'
        },
        {
          command: 'Change voice gender',
          description: 'Changes the voice gender',
          action: 'changeVoiceGender'
        },
        {
          command: 'Adjust voice speed',
          description: 'Adjusts the voice speed',
          action: 'adjustVoiceSpeed'
        },
        {
          command: 'Adjust voice volume',
          description: 'Adjusts the voice volume',
          action: 'adjustVoiceVolume'
        },
        {
          command: 'Adjust voice pitch',
          description: 'Adjusts the voice pitch',
          action: 'adjustVoicePitch'
        }
      ]
    });
  } catch (err) {
    console.error('Error fetching voice commands:', err);
    res.status(500).json({ error: 'Failed to fetch voice commands' });
  }
});

module.exports = router; 