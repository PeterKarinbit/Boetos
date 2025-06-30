const { AppDataSource } = require('../../data-source');

class BurnoutRepository {
  constructor() {
    this.burnoutScoreRepository = AppDataSource.getRepository('BurnoutScore');
    this.stressPatternRepository = AppDataSource.getRepository('StressPattern');
  }

  async saveBurnoutScore(userId, data) {
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

  async saveStressPatterns(userId, patterns) {
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

  async getBurnoutHistory(userId, startDate, endDate) {
    return this.burnoutScoreRepository.find({
      where: {
        userId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      },
      order: {
        date: 'DESC'
      }
    });
  }

  async getStressPatterns(userId, startDate, endDate) {
    return this.stressPatternRepository.find({
      where: {
        userId,
        detectedAt: {
          $gte: startDate,
          $lte: endDate
        }
      },
      order: {
        detectedAt: 'DESC'
      }
    });
  }

  async getLatestBurnoutScore(userId) {
    return this.burnoutScoreRepository.findOne({
      where: { userId },
      order: { date: 'DESC' }
    });
  }

  async getActiveStressPatterns(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.stressPatternRepository.find({
      where: {
        userId,
        detectedAt: {
          $gte: thirtyDaysAgo
        }
      },
      order: {
        severity: 'DESC',
        detectedAt: 'DESC'
      }
    });
  }

  _determineFrequency(pattern) {
    // This is a simplified version - you might want to implement more sophisticated logic
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

module.exports = new BurnoutRepository(); 