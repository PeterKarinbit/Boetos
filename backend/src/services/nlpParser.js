const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free";

async function parseVoiceCommand(text) {
  let content = undefined;
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a calendar assistant. Parse the following message and return a JSON object with the action, title, datetime (ISO format), and optional location. If no specific calendar action is detected, return a JSON object like: { \"action\": \"none\" }. Return ONLY the JSON object without any markdown formatting or additional text."
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 50,
        temperature: 0.1 // Lower temperature for more consistent JSON output
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    // Log the full response for debugging
    console.log('OpenRouter API Response:', JSON.stringify(response.data, null, 2));

    // Get the response content
    content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('Empty response content from OpenRouter API');
      return { action: "none" };
    }

    // Clean and parse the JSON response
    let jsonString = content.trim();
    
    // Remove any markdown formatting
    jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON if it's wrapped in other text
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsedResponse = JSON.parse(jsonString);
      return parsedResponse;
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Content that failed to parse:', jsonString);
      return { action: "none" };
    }
  } catch (error) {
    console.error('Error in parseVoiceCommand:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    return { action: "none" };
  }
}

module.exports = { parseVoiceCommand }; 