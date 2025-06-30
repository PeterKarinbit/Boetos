const axios = require('axios');

class SpeechToTextService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = 'https://api.openai.com/v1/audio';
    }

    async convertSpeechToText(audioBuffer) {
        try {
            const formData = new FormData();
            formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
            formData.append('model', 'whisper-1');

            const response = await axios.post(
                `${this.baseURL}/transcriptions`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data.text;
        } catch (error) {
            console.error('Speech to text error:', error.response?.data || error.message);
            throw new Error('Failed to convert speech to text: ' + (error.response?.data?.error?.message || error.message));
        }
    }

    // Helper method to validate audio format
    validateAudioFormat(audioBuffer) {
        // Basic validation for WAV format
        if (!audioBuffer || audioBuffer.length < 44) {
            return false;
        }

        // Check WAV header
        const header = audioBuffer.slice(0, 4).toString();
        return header === 'RIFF';
    }
}

module.exports = { SpeechToTextService }; 