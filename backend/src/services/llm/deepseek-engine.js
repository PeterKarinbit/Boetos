const axios = require('axios');
const config = require('../../config');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'deepseek/deepseek-r1-0528:free';
  }

  async analyzeBurnout(score, calendarData, patterns) {
    const prompt = this._buildBurnoutPrompt(score, calendarData, patterns);
    return this._callLLM(prompt);
  }

  async detectPatterns(historicalData) {
    const prompt = this._buildPatternPrompt(historicalData);
    return this._callLLM(prompt);
  }

  async _callLLM(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling DeepSeek:', error);
      throw new Error('Failed to get AI insights');
    }
  }

  _buildBurnoutPrompt(score, calendarData, patterns) {
    return `
You are a workplace wellness expert analyzing someone's schedule for burnout risk.

BURNOUT SCORE: ${score}/10
SCHEDULE DATA: ${JSON.stringify(calendarData)}
PATTERNS DETECTED: ${JSON.stringify(patterns)}

Provide:
1. Clear explanation of the burnout score
2. Specific stress patterns identified (e.g., "back-to-back Tuesdays")
3. 2-3 actionable recommendations
4. Encouraging but honest tone

Keep response conversational and under 150 words.
`;
  }

  _buildPatternPrompt(historicalData) {
    return `
You are analyzing historical calendar patterns to identify stress triggers.

HISTORICAL DATA: ${JSON.stringify(historicalData)}

Identify and explain:
1. Recurring stress patterns (days, times, meeting types)
2. Improvement or worsening trends
3. Correlation between schedule and likely stress
4. One key insight for better schedule management

Be specific with examples like "Every Thursday you have 4+ meetings" rather than general statements.
`;
  }
}

module.exports = new DeepSeekService(); 