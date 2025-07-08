import { AppDataSource } from '../../data-source.js';

class BurnoutRepository {
  private get burnoutScoreRepository() {
    return AppDataSource.getRepository('BurnoutScore');
  }
  private get stressPatternRepository() {
    return AppDataSource.getRepository('StressPattern');
  }

  async saveBurnoutScore(userId: string, data: any): Promise<any> {
    const burnoutScore = this.burnoutScoreRepository.create({
      userId,
      date: new Date(),
      score: data.score,
      metrics: data.metrics,
      aiInsights: data.insights,
      recommendations: data.recommendations
    });
    return this.burnoutScoreRepository.save(burnoutScore);
  }

  async saveStressPatterns(userId: string, patterns: any[]): Promise<any> {
    const stressPatterns = patterns.map(pattern =>
      this.stressPatternRepository.create({
        userId,
        patternType: pattern.type,
        description: pattern.description,
        severity: pattern.severity,
        frequency: this._determineFrequency(pattern),
        detectedAt: new Date(),
        metadata: pattern
      })
    );
    return this.stressPatternRepository.save(stressPatterns);
  }

  async getBurnoutHistory(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.burnoutScoreRepository.find({
      where: {
        userId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      },
      order: { date: 'DESC' }
    });
  }

  async getStressPatterns(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.stressPatternRepository.find({
      where: {
        userId,
        detectedAt: {
          $gte: startDate,
          $lte: endDate
        }
      },
      order: { detectedAt: 'DESC' }
    });
  }

  async getLatestBurnoutScore(userId: string): Promise<any> {
    return this.burnoutScoreRepository.findOne({
      where: { userId },
      order: { date: 'DESC' }
    });
  }

  async getActiveStressPatterns(userId: string): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.stressPatternRepository.find({
      where: {
        userId,
        detectedAt: { $gte: thirtyDaysAgo }
      },
      order: { severity: 'DESC', detectedAt: 'DESC' }
    });
  }

  private _determineFrequency(pattern: any): string {
    if (pattern.type === 'high-meeting-day') {
      return 'daily';
    } else if (pattern.type === 'back-to-back-meetings') {
      return 'weekly';
    } else if (pattern.type === 'long-work-day') {
      return 'weekly';
    } else if (pattern.type === 'insufficient-breaks') {
      return 'daily';
    } else if (pattern.type === 'weekend-work') {
      return 'weekly';
    }
    return 'occasional';
  }
}

export default new BurnoutRepository(); 