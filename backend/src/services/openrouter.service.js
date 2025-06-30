const axios = require('axios');

class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || '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';
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.defaultModel = 'deepseek/deepseek-r1-0528:free';
    }

    async getCompletion(prompt, options = {}) {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: options.model || this.defaultModel,
                    messages: options.messages || [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant. Respond naturally and conversationally. Keep responses concise but complete.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: options.temperature || 0.7,
                    max_tokens: options.max_tokens || 500,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.3,
                    top_p: 0.9
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            console.log('Full OpenRouter API Response Data:', JSON.stringify(response.data, null, 2));

            const message = response.data?.choices?.[0]?.message;
            
            // First check for content
            if (message?.content?.trim()) {
                return message.content.trim();
            }

            // If no content but has reasoning, use the reasoning
            if (message?.reasoning) {
                console.log('Using reasoning as response:', message.reasoning);
                // Clean up the reasoning to make it more conversational
                const cleanedReasoning = message.reasoning
                    .replace(/^Hmm, /, '')
                    .replace(/^We are given the message:.*?\n/, '')
                    .replace(/Therefore, we return.*$/, '')
                    .replace(/\n\n/g, ' ')
                    .replace(/\n/g, ' ')
                    .trim();
                
                return cleanedReasoning || "Hello! How can I help you today?";
            }

            // If no content and no reasoning, return a simple greeting
            console.warn('OpenRouter API returned no content and no reasoning');
            return "Hello! How can I help you today?";
        } catch (error) {
            console.error('OpenRouter API error:', error.response?.data || error.message);
            return "Hello! I'm here to help.";
        }
    }
}

module.exports = { OpenRouterService }; 