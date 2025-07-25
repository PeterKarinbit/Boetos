// @ts-ignore
import BurnoutCalculator from './calculator';
// @ts-ignore
import PatternDetector from './pattern-detector';
// @ts-ignore
import DeepSeekService from '../llm/deepseek-engine';

class BurnoutAnalyzer {
  async analyzeBurnout(calendarData: any[]): Promise<any> {
    try {
      // Calculate traditional burnout score
      const score = BurnoutCalculator.calculateBurnoutScore(calendarData);

      // Detect patterns
      const patterns = PatternDetector.detectPatterns(calendarData);

      // Get AI insights
      const aiInsights = await DeepSeekService.analyzeBurnout(score, calendarData, patterns);

      // Get pattern analysis
      const patternAnalysis = await DeepSeekService.detectPatterns(patterns);

      return {
        score,
        level: this._getBurnoutLevel(score),
        metrics: {
          meetingDensity: this._calculateMeetingDensity(calendarData),
          workHours: this._calculateWorkHours(calendarData),
          breakScore: this._calculateBreakScore(calendarData),
          weekendWork: this._hasWeekendWork(calendarData),
          intensity: this._calculateIntensity(calendarData)
        },
        insights: aiInsights,
        patterns: this._formatPatterns(patterns),
        recommendations: this._extractRecommendations(aiInsights)
      };
    } catch (error) {
      console.error('Error in burnout analysis:', error);
      throw new Error('Failed to analyze burnout risk');
    }
  }

  _getBurnoutLevel(score: number): string {
    if (score >= 7.5) return 'High Risk';
    if (score >= 5) return 'Moderate Risk';
    if (score >= 2.5) return 'Low Risk';
    return 'Minimal Risk';
  }

  _calculateMeetingDensity(calendarData: any[]): number {
    const meetings = calendarData.filter(event => event.type === 'meeting');
    const totalHours = 24;
    const meetingHours = meetings.reduce((total, meeting) => {
      const duration = (new Date(meeting.end).getTime() - new Date(meeting.start).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    return (meetingHours / totalHours) * 100;
  }

  _calculateWorkHours(calendarData: any[]): number {
    const workEvents = calendarData.filter(event => 
      event.type === 'meeting' || event.type === 'task'
    );

    return workEvents.reduce((total, event) => {
      const duration = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
  }

  _calculateBreakScore(calendarData: any[]): number {
    const events = calendarData.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    let breakScore = 100;
    let lastEventEnd: string | null = null;

    for (const event of events) {
      if (lastEventEnd) {
        const breakDuration = (new Date(event.start).getTime() - new Date(lastEventEnd).getTime()) / (1000 * 60);
        if (breakDuration < 15) {
          breakScore -= 20;
        }
      }
      lastEventEnd = event.end;
    }

    return Math.max(0, breakScore);
  }

  _hasWeekendWork(calendarData: any[]): boolean {
    return calendarData.some(event => {
      const date = new Date(event.start);
      return date.getDay() === 0 || date.getDay() === 6;
    });
  }

  _calculateIntensity(calendarData: any[]): number {
    const meetings = calendarData.filter(event => event.type === 'meeting');
    let intensityScore = 100;

    // Check for back-to-back meetings
    const sortedMeetings = meetings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    for (let i = 1; i < sortedMeetings.length; i++) {
      const gap = (new Date(sortedMeetings[i].start).getTime() - new Date(sortedMeetings[i-1].end).getTime()) / (1000 * 60);
      if (gap < 15) {
        intensityScore -= 20;
      }
    }

    // Check for long meetings (>1 hour)
    const longMeetings = meetings.filter(meeting => {
      const duration = (new Date(meeting.end).getTime() - new Date(meeting.start).getTime()) / (1000 * 60);
      return duration > 60;
    });
    intensityScore -= longMeetings.length * 10;

    return Math.max(0, intensityScore);
  }

  _formatPatterns(patterns: any[]): any[] {
    return patterns.map(pattern => ({
      type: pattern.type,
      description: this._generatePatternDescription(pattern),
      severity: this._calculatePatternSeverity(pattern)
    }));
  }

  _generatePatternDescription(pattern: any): string {
    switch (pattern.type) {
      case 'high-meeting-day':
        return `${pattern.count} meetings on ${pattern.day}`;
      case 'back-to-back-meetings':
        return `Back-to-back meetings on ${pattern.day}`;
      case 'long-work-day':
        return `${pattern.hours} hours of work on ${pattern.day}`;
      case 'insufficient-breaks':
        return `Limited breaks on ${pattern.day}`;
      case 'weekend-work':
        return 'Work detected on weekends';
      default:
        return 'Unknown pattern';
    }
  }

  _calculatePatternSeverity(pattern: any): string {
    switch (pattern.type) {
      case 'high-meeting-day':
        return pattern.count >= 6 ? 'high' : pattern.count >= 4 ? 'medium' : 'low';
      case 'back-to-back-meetings':
        return pattern.pattern.length >= 3 ? 'high' : pattern.pattern.length >= 2 ? 'medium' : 'low';
      case 'long-work-day':
        return pattern.hours >= 12 ? 'high' : pattern.hours >= 10 ? 'medium' : 'low';
      case 'insufficient-breaks':
        return pattern.breaks.length >= 3 ? 'high' : pattern.breaks.length >= 2 ? 'medium' : 'low';
      case 'weekend-work':
        return 'high';
      default:
        return 'low';
    }
  }

  _extractRecommendations(aiInsights: string): string[] {
    // Simple extraction of recommendations from AI insights
    // This could be enhanced with more sophisticated parsing
    const recommendations: string[] = [];
    const lines = aiInsights.split('\n');
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('consider')) {
        recommendations.push(line.trim());
      }
    }
    return recommendations.slice(0, 3); // Return top 3 recommendations
  }
}

export default new BurnoutAnalyzer(); 