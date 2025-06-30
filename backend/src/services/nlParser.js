const { OpenRouterService } = require('./openrouter.service');

class NLParser {
    constructor() {
        this.openRouterService = new OpenRouterService();
    }

    async parseCommand(text) {
        try {
            const prompt = `You are a calendar assistant. Parse the following message and return a JSON object with the action, title, datetime (ISO format), and optional location. Return ONLY the JSON object without any markdown formatting or additional text.

Message: ${text}`;

            const response = await this.openRouterService.getCompletion(prompt, {
                model: 'deepseek/deepseek-r1-0528:free',
                temperature: 0.1,
                max_tokens: 150,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a calendar assistant. Parse the following message and return a JSON object with the action, title, datetime (ISO format), and optional location. Return ONLY the JSON object without any markdown formatting or additional text.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ]
            });

            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse response as JSON');
            }

            const parsedCommand = JSON.parse(jsonMatch[0]);
            
            // Validate required fields
            if (!parsedCommand.action || !parsedCommand.title) {
                throw new Error('Missing required fields in parsed command');
            }

            // Convert datetime to ISO format if it's not already
            if (parsedCommand.datetime && !parsedCommand.datetime.includes('T')) {
                parsedCommand.datetime = new Date(parsedCommand.datetime).toISOString();
            }

            return parsedCommand;
        } catch (error) {
            console.error('Error parsing command:', error);
            throw new Error('Failed to parse command: ' + error.message);
        }
    }
}

module.exports = { NLParser }; 