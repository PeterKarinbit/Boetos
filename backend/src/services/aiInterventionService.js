const { AppDataSource } = require('../data-source');
const { AiInterventionRule } = require('../entities/AiInterventionRule');
const { UserPreferences } = require('../entities/UserPreferences');

class AiInterventionService {
  constructor() {
    this.aiInterventionRuleRepository = AppDataSource.getRepository(AiInterventionRule);
    this.userPreferencesRepository = AppDataSource.getRepository(UserPreferences);
  }

  async processActivity(userId, activityType, timestamp, details) {
    console.log(`AI Intervention Service: Processing activity for user ${userId}: ${activityType}`);
    
    const activeRules = await this.aiInterventionRuleRepository.find({
      where: { userId: userId, isActive: true },
    });

    console.log(`Found ${activeRules.length} active AI intervention rules for user ${userId}.`);

    for (const rule of activeRules) {
      // Validate rule condition
      if (!rule.validateCondition()) {
        console.warn(`Invalid rule condition for rule ${rule.ruleName}`);
        continue;
      }

      // Get condition data safely
      const condition = rule.ruleCondition;
      const triggerType = rule.ruleType?.toUpperCase() || 'ACTIVITY_BASED';

      // Evaluate rule conditions
      if (triggerType === 'ACTIVITY_BASED' && condition.activityType === activityType) {
        // Handle IDLE activity
        if (activityType === 'IDLE' && condition.durationMinutes) {
          const durationMinutes = details?.durationMinutes;
          if (durationMinutes && durationMinutes >= condition.durationMinutes) {
            console.log(`Rule triggered: ${rule.ruleName} for user ${userId}`);
            
            // Fetch user preferences
            const userPrefs = await this.userPreferencesRepository.findOne({ where: { userId: userId } });
            const preferredMethod = userPrefs?.preferredInterventionMethod || rule.interventionMethod;

            // Prepare notification
            if (!rule.interventionMessageTemplate) {
              console.warn(`No intervention message template for rule ${rule.ruleName}`);
              continue;
            }

            return {
              message: rule.interventionMessageTemplate,
              method: preferredMethod,
              ruleName: rule.ruleName,
              userId: userId,
              timestamp: new Date().toISOString(),
            };
          }
        }
      }
    }

    return null; // No intervention triggered
  }
}

module.exports = { AiInterventionService }; 