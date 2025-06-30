const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { parseVoiceCommand } = require('../services/nlpParser');
const { OpenRouterService } = require('../services/openrouter.service');
const { ElevenLabsService } = require('../services/elevenlabs.service');

const router = express.Router();

const openRouterService = new OpenRouterService();
const elevenLabsService = new ElevenLabsService();

// Fallback responses for when AI fails
const FALLBACK_RESPONSES = [
  "I'm having trouble understanding right now. Could you please try again?",
  "I didn't quite catch that. Would you mind repeating?",
  "I'm having a moment of confusion. Could you rephrase that?",
  "I'm not sure I understood. Can you say that differently?"
];

function getRandomFallbackResponse() {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Processing voice request:', { userId, prompt });

    // Parse the voice command using the NLP parser
    const parsedCommand = await parseVoiceCommand(prompt);
    console.log('Parsed command:', parsedCommand);

    // --- ACTION EXTRACTION ---
    let actionResult = null;
    if (parsedCommand && parsedCommand.action && parsedCommand.action !== 'none') {
      // Only handle add_event/schedule for now
      if (['add_event', 'schedule'].includes(parsedCommand.action)) {
        // Use CalendarEvent entity for more general events
        const { title, datetime, location } = parsedCommand;
        if (!title || !datetime) {
          actionResult = 'Sorry, I need both a title and date/time to schedule an event.';
        } else {
          try {
            const { AppDataSource } = require('../data-source');
            const CalendarEvent = require('../entities/CalendarEvent');
            const calendarRepo = AppDataSource.getRepository('CalendarEvent');
            const event = calendarRepo.create({
              user_id: userId,
              title,
              start_time: new Date(datetime),
              end_time: new Date(new Date(datetime).getTime() + 60 * 60 * 1000), // 1 hour default
              location: location || '',
              event_type: 'meeting',
              calendar_source: 'AI',
            });
            await calendarRepo.save(event);
            actionResult = `Event "${title}" scheduled for ${new Date(datetime).toLocaleString()}${location ? ' at ' + location : ''}.`;
          } catch (err) {
            console.error('Error creating calendar event:', err);
            actionResult = 'Failed to schedule the event due to a server error.';
          }
        }
      }
      // You can add more actions here (reschedule, cancel, etc.)
    }
    // --- END ACTION EXTRACTION ---

    // Get AI response using OpenRouter service
    let aiResponse;
    try {
      aiResponse = await openRouterService.getCompletion(prompt, {
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant. Respond naturally and conversationally. 
                     Keep responses concise but complete. Current date: ${new Date().toLocaleDateString()}.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500, // Increased token limit
        temperature: 0.7
      });

      console.log('AI Response:', aiResponse);

      // If AI response is empty, use a fallback
      if (!aiResponse || aiResponse.trim() === '') {
        console.warn('Empty AI response from OpenRouter');
        aiResponse = getRandomFallbackResponse();
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      aiResponse = "I'm having trouble connecting to the AI service. Please try again in a moment.";
    }

    let audioResponse = null;
    let audioError = null;

    try {
      // Check ElevenLabs quota before attempting audio generation
      const quota = await elevenLabsService.checkQuota();
      if (quota && !quota.hasQuota) {
        throw new Error(`ElevenLabs quota exceeded. Remaining: ${quota.remaining}/${quota.total} characters`);
      }

      // Get audio from ElevenLabs
      const audioBuffer = await elevenLabsService.getAudio(aiResponse, {
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        stability: 0.5,
        similarityBoost: 0.75
      });

      // Convert audio buffer to base64
      audioResponse = Buffer.from(audioBuffer).toString('base64');
      console.log('Audio generated successfully');
    } catch (error) {
      console.error('Error generating audio:', error);
      audioError = {
        message: error.message,
        details: error.response?.data || 'Unknown error',
        quota: await elevenLabsService.checkQuota()
      };
    }

    // Prepare response
    const response = {
      text: actionResult || aiResponse,
      response: actionResult || aiResponse, // For backward compatibility
      audioUrl: audioResponse ? `data:audio/mpeg;base64,${audioResponse}` : null,
      audioFormat: audioResponse ? 'audio/mpeg' : null,
      timestamp: new Date().toISOString(),
      success: true,
      error: audioError,
      parsedCommand: parsedCommand || null
    };

    console.log('Sending response to client', {
      hasAudio: !!audioResponse,
      hasError: !!audioError,
      textLength: (actionResult || aiResponse).length
    });
    
    res.status(200).json(response);

  } catch (error) {
    console.error('Voice assistant error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Return a simple response on error
    res.json({
      text: "Hello! I'm here to help.",
      error: 'Error processing voice request',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router; 