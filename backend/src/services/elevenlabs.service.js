const axios = require('axios');

class ElevenLabsService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.baseURL = 'https://api.elevenlabs.io/v1';
        
        if (!this.apiKey) {
            console.error('ELEVENLABS_API_KEY is not set in environment variables');
        }
    }

    async checkQuota() {
        try {
            const response = await axios.get(`${this.baseURL}/user/subscription`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });
            
            const subscription = response.data;
            console.log('ElevenLabs subscription status:', subscription);
            
            return {
                hasQuota: subscription.character_count < subscription.character_limit,
                remaining: subscription.character_limit - subscription.character_count,
                total: subscription.character_limit
            };
        } catch (error) {
            console.error('Error checking ElevenLabs quota:', error.response?.data || error.message);
            return null;
        }
    }

    async getAudio(text, options = {}) {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key is not configured');
        }

        try {
            // Check quota before making the request
            const quota = await this.checkQuota();
            if (quota && !quota.hasQuota) {
                throw new Error(`ElevenLabs quota exceeded. Remaining: ${quota.remaining}/${quota.total} characters`);
            }

            const response = await axios.post(
                `${this.baseURL}/text-to-speech/${options.voiceId || '21m00Tcm4TlvDq8ikWAM'}`,
                {
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: options.stability || 0.5,
                        similarity_boost: options.similarityBoost || 0.75
                    }
                },
                {
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000 // 30 second timeout
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Invalid ElevenLabs API key. Please check your credentials.');
                } else if (error.response?.status === 429) {
                    throw new Error('ElevenLabs rate limit exceeded. Please try again later.');
                } else if (error.response?.data) {
                    // Try to parse the error message from the response
                    const errorData = JSON.parse(Buffer.from(error.response.data).toString());
                    throw new Error(`ElevenLabs API error: ${errorData.detail || error.message}`);
                }
            }
            throw new Error(`Failed to convert text to speech: ${error.message}`);
        }
    }

    async getVoices() {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key is not configured');
        }

        try {
            const response = await axios.get(`${this.baseURL}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            return response.data.voices;
        } catch (error) {
            console.error('ElevenLabs API error:', error.response?.data || error.message);
            throw new Error(`Failed to get voices: ${error.message}`);
        }
    }
}

module.exports = { ElevenLabsService }; 