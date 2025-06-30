const axios = require('axios');
const { AppDataSource } = require('../data-source');
const { UserSchedule } = require('../entities/UserSchedule');
const { Between } = require('typeorm');
const { SpeechToTextService } = require('./speech-to-text.service');
const fs = require('fs');
const path = require('path');
const { OpenRouterService } = require('./openrouter.service');
const { ElevenLabsService } = require('./elevenlabs.service');
const { NLParser } = require('./nlParser');
const { User } = require('../entities/User');
const { Activity } = require('../entities/Activity');
const { Meeting } = require('../entities/Meeting');
const { google } = require('googleapis');

class VoiceAssistantService {
    constructor() {
        this.openRouterService = new OpenRouterService();
        this.elevenLabsService = new ElevenLabsService();
        this.speechToTextService = new SpeechToTextService();
        this.nlpParser = new NLParser();
        this.userRepository = AppDataSource.getRepository(User);
        this.activityRepository = AppDataSource.getRepository(Activity);
        this.meetingRepository = AppDataSource.getRepository(Meeting);
        this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
        this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
        this.OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free";
        this.ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "Rachel";
    }

    async getCalendarContext(userId) {
        try {
            const scheduleRepository = AppDataSource.getRepository(UserSchedule);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const events = await scheduleRepository.find({
                where: {
                    userId,
                    startTime: Between(today, tomorrow)
                }
            });

            if (events.length === 0) {
                return "No events scheduled for today.";
            }

            return `Today's schedule: ${events.map(event => 
                `${event.title} at ${new Date(event.startTime).toLocaleTimeString()}`
            ).join(', ')}`;
        } catch (error) {
            console.error('Calendar context error:', error);
            return "Calendar information unavailable.";
        }
    }

    async getDeepSeekResponse(prompt, calendarContext) {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'deepseek/deepseek-r1-0528:free',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful voice assistant with access to the user's calendar. 
                                Current calendar context: ${calendarContext}
                                Provide concise, natural responses suitable for voice interaction.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    async getElevenLabsAudio(text) {
        try {
            if (!this.elevenLabsApiKey) {
                throw new Error("Server configuration error: ELEVENLABS_API_KEY is not set.");
            }

            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`,
                {
                    text,
                    model_id: "eleven_multilingual_v2"
                },
                {
                    headers: {
                        "xi-api-key": this.elevenLabsApiKey,
                        "Content-Type": "application/json"
                    },
                    responseType: "arraybuffer"
                }
            );

            return response.data;
        } catch (error) {
            console.error('Text to speech error:', error);
            throw error;
        }
    }

    async processVoiceRequest(userId, prompt) {
        try {
            // Get calendar context
            const calendarContext = await this.getCalendarContext(userId);

            // Get AI response
            const aiResponse = await this.getDeepSeekResponse(prompt, calendarContext);

            // Convert to speech
            const audioBuffer = await this.getElevenLabsAudio(aiResponse);

            return {
                text: aiResponse,
                audioBuffer
            };
        } catch (error) {
            console.error('Voice assistant error:', error);
            throw new Error('Failed to process voice request');
        }
    }

    async processVoiceCommand(userId, audioBuffer) {
        try {
            // Convert speech to text
            const text = await this.speechToTextService.convertSpeechToText(audioBuffer);
            console.log('Transcribed text:', text);

            // Parse the text using NLP
            const parsedCommand = await this.nlpParser.parseCommand(text);
            console.log('Parsed command:', parsedCommand);

            // Get user's voice settings
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new Error('User not found');
            }

            // Process the command based on its type
            let response;
            switch (parsedCommand.action) {
                case 'schedule':
                    response = await this.handleScheduleCommand(user, parsedCommand);
                    break;
                case 'reschedule':
                    response = await this.handleRescheduleCommand(user, parsedCommand);
                    break;
                case 'cancel':
                    response = await this.handleCancelCommand(user, parsedCommand);
                    break;
                case 'query':
                    response = await this.handleQueryCommand(user, parsedCommand);
                    break;
                default:
                    response = "I'm not sure how to help with that. You can ask me to schedule, reschedule, or cancel meetings, or ask about your upcoming events.";
            }

            // Convert response to speech
            const audioResponse = await this.elevenLabsService.getAudio(response, {
                voiceId: user.voiceId || '21m00Tcm4TlvDq8ikWAM', // Default voice ID
                stability: user.voiceStability || 0.5,
                similarityBoost: user.voiceSimilarityBoost || 0.75
            });

            return {
                text: response,
                audio: audioResponse,
                parsedCommand
            };
        } catch (error) {
            console.error('Error processing voice command:', error);
            throw error;
        }
    }

    async handleScheduleCommand(user, parsedCommand) {
        try {
            // Create calendar event
            const event = await this.createCalendarEvent(user, parsedCommand);
            
            // Log activity
            await this.activityRepository.save({
                userId: user.id,
                type: 'CALENDAR_EVENT_CREATED',
                details: {
                    eventId: event.id,
                    title: event.summary,
                    startTime: event.start.dateTime,
                    endTime: event.end.dateTime
                }
            });

            return `I've scheduled ${parsedCommand.title} for ${new Date(parsedCommand.datetime).toLocaleString()}`;
        } catch (error) {
            console.error('Error scheduling event:', error);
            throw new Error('Failed to schedule the event');
        }
    }

    async handleRescheduleCommand(user, parsedCommand) {
        try {
            // Find existing event
            const existingEvent = await this.findExistingEvent(user, parsedCommand.title);
            if (!existingEvent) {
                return "I couldn't find that event in your calendar.";
            }

            // Update calendar event
            const updatedEvent = await this.updateCalendarEvent(user, existingEvent.id, parsedCommand);
            
            // Log activity
            await this.activityRepository.save({
                userId: user.id,
                type: 'CALENDAR_EVENT_UPDATED',
                details: {
                    eventId: updatedEvent.id,
                    title: updatedEvent.summary,
                    oldStartTime: existingEvent.start.dateTime,
                    newStartTime: updatedEvent.start.dateTime
                }
            });

            return `I've rescheduled ${parsedCommand.title} to ${new Date(parsedCommand.datetime).toLocaleString()}`;
        } catch (error) {
            console.error('Error rescheduling event:', error);
            throw new Error('Failed to reschedule the event');
        }
    }

    async handleCancelCommand(user, parsedCommand) {
        try {
            // Find existing event
            const existingEvent = await this.findExistingEvent(user, parsedCommand.title);
            if (!existingEvent) {
                return "I couldn't find that event in your calendar.";
            }

            // Delete calendar event
            await this.deleteCalendarEvent(user, existingEvent.id);
            
            // Log activity
            await this.activityRepository.save({
                userId: user.id,
                type: 'CALENDAR_EVENT_DELETED',
                details: {
                    eventId: existingEvent.id,
                    title: existingEvent.summary,
                    startTime: existingEvent.start.dateTime
                }
            });

            return `I've cancelled ${parsedCommand.title}`;
        } catch (error) {
            console.error('Error cancelling event:', error);
            throw new Error('Failed to cancel the event');
        }
    }

    async handleQueryCommand(user, parsedCommand) {
        try {
            const calendar = await this.getCalendarClient(user);
            const timeMin = new Date().toISOString();
            const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: 'startTime'
            });

            const events = response.data.items;
            if (!events || events.length === 0) {
                return "You don't have any upcoming events in the next 7 days.";
            }

            const eventList = events.map(event => {
                const start = new Date(event.start.dateTime || event.start.date);
                return `${event.summary} on ${start.toLocaleString()}`;
            }).join(', ');

            return `Here are your upcoming events: ${eventList}`;
        } catch (error) {
            console.error('Error querying events:', error);
            throw new Error('Failed to query your calendar');
        }
    }

    async createCalendarEvent(user, parsedCommand) {
        const calendar = await this.getCalendarClient(user);
        const event = {
            summary: parsedCommand.title,
            start: {
                dateTime: parsedCommand.datetime,
                timeZone: user.timezone || 'UTC'
            },
            end: {
                dateTime: new Date(new Date(parsedCommand.datetime).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour default
                timeZone: user.timezone || 'UTC'
            },
            location: parsedCommand.location
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        return response.data;
    }

    async updateCalendarEvent(user, eventId, parsedCommand) {
        const calendar = await this.getCalendarClient(user);
        const event = {
            summary: parsedCommand.title,
            start: {
                dateTime: parsedCommand.datetime,
                timeZone: user.timezone || 'UTC'
            },
            end: {
                dateTime: new Date(new Date(parsedCommand.datetime).getTime() + 60 * 60 * 1000).toISOString(),
                timeZone: user.timezone || 'UTC'
            },
            location: parsedCommand.location
        };

        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId,
            resource: event
        });

        return response.data;
    }

    async deleteCalendarEvent(user, eventId) {
        const calendar = await this.getCalendarClient(user);
        await calendar.events.delete({
            calendarId: 'primary',
            eventId
        });
    }

    async findExistingEvent(user, title) {
        const calendar = await this.getCalendarClient(user);
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            q: title
        });

        return response.data.items[0];
    }

    async getCalendarClient(user) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );

        oauth2Client.setCredentials({
            access_token: user.google_access_token,
            refresh_token: user.google_refresh_token
        });

        return google.calendar({ version: 'v3', auth: oauth2Client });
    }

    async speechToText(audioInput) {
        try {
            // Validate audio format
            if (!this.speechToTextService.validateAudioFormat(audioInput)) {
                throw new Error('Invalid audio format. Expected WAV format.');
            }

            // Convert speech to text
            const text = await this.speechToTextService.convertToText(audioInput);
            return text;
        } catch (error) {
            console.error('Speech to text error:', error);
            throw new Error('Failed to convert speech to text: ' + error.message);
        }
    }
}

module.exports = { VoiceAssistantService }; 