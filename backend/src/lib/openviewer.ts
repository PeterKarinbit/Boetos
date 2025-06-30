interface OpenRouterOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface AnalysisOptions {
  includeFactors?: boolean;
  includeRecommendations?: boolean;
  includeInsights?: boolean;
  includeImmediateActions?: boolean;
  includeLongTermStrategies?: boolean;
  includeWellnessActivities?: boolean;
  includeWorkLifeBalance?: boolean;
}

interface AnalysisRequest {
  type: string;
  context: any;
  options?: AnalysisOptions;
}

export class OpenViewerClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(options: OpenRouterOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || 'deepseek/deepseek-r1-0528:free';
    this.baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
  }

  async analyze(request: AnalysisRequest) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://boetos.app', // Required by OpenRouter
          'X-Title': 'Boetos Mental Health Analysis' // Optional but recommended
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(request.type)
            },
            {
              role: 'user',
              content: this.formatContext(request.context, request.options)
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.processResponse(data, request.type);
    } catch (error) {
      console.error('OpenRouter analysis error:', error);
      throw error;
    }
  }

  private getSystemPrompt(type: string): string {
    switch (type) {
      case 'burnout-risk':
        return `You are a mental health AI assistant specializing in burnout prevention and workplace wellness. 
        Analyze the provided data and return a JSON object with the following structure:
        {
          "riskLevel": number (0-100),
          "riskCategory": "low" | "moderate" | "high",
          "factors": string[],
          "recommendations": string[],
          "insights": string
        }`;

      case 'wellness-recommendations':
        return `You are a wellness coach providing personalized recommendations. 
        Analyze the user's data and return a JSON object with:
        {
          "recommendations": string[],
          "immediateActions": string[],
          "longTermStrategies": string[],
          "wellnessActivities": string[],
          "workLifeBalance": string[]
        }`;

      default:
        return 'You are an AI assistant analyzing user data. Return your analysis in JSON format.';
    }
  }

  private formatContext(context: any, options?: AnalysisOptions): string {
    let prompt = 'Analyze the following data:\n\n';

    if (context.currentMetrics) {
      prompt += 'Current Metrics:\n';
      Object.entries(context.currentMetrics).forEach(([key, value]) => {
        prompt += `${key}: ${value}\n`;
      });
    }

    if (context.historicalData) {
      prompt += '\nHistorical Data:\n';
      prompt += JSON.stringify(context.historicalData, null, 2);
    }

    if (context.notes) {
      prompt += `\nUser Notes: ${context.notes}\n`;
    }

    if (options) {
      prompt += '\nInclude the following in your analysis:\n';
      Object.entries(options).forEach(([key, value]) => {
        if (value) {
          prompt += `- ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}\n`;
        }
      });
    }

    return prompt;
  }

  private processResponse(data: any, type: string) {
    try {
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);

      switch (type) {
        case 'burnout-risk':
          return {
            riskLevel: parsed.riskLevel,
            riskCategory: parsed.riskCategory,
            factors: parsed.factors,
            recommendations: parsed.recommendations,
            insights: parsed.insights
          };

        case 'wellness-recommendations':
          return {
            recommendations: parsed.recommendations,
            immediateActions: parsed.immediateActions,
            longTermStrategies: parsed.longTermStrategies,
            wellnessActivities: parsed.wellnessActivities,
            workLifeBalance: parsed.workLifeBalance
          };

        default:
          return parsed;
      }
    } catch (error) {
      console.error('Error processing response:', error);
      throw new Error('Failed to process AI response');
    }
  }
} 