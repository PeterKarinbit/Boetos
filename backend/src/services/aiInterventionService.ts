import { AppDataSource } from '../data-source';
import { AiInterventionRule } from '../entity/AiInterventionRule'; // Import the entity class
import { UserPreferences } from '../entity/UserPreferences'; // Import the entity class

export class AiInterventionService {
  private aiInterventionRuleRepository = AppDataSource.getRepository(AiInterventionRule);
  private userPreferencesRepository = AppDataSource.getRepository(UserPreferences);

  constructor() {
    // Additional setup if needed
  }

  // This method will process incoming user activity and evaluate rules
  async processActivity(userId: string, activityType: string, timestamp: string, details?: any): Promise<any | null> {
    console.log(`AI Intervention Service: Processing activity for user ${userId}: ${activityType}`);
    
    const activeRules = await this.aiInterventionRuleRepository.find({
      where: { userId: userId, isActive: true },
    });

    console.log(`Found ${activeRules.length} active AI intervention rules for user ${userId}.`);

    for (const rule of activeRules) {
      const triggerCondition = rule.triggerCondition as any; // Corrected trigger_condition to triggerCondition

      // Evaluate rule conditions
      if (rule.triggerType === 'ACTIVITY_BASED' && triggerCondition.activityType === activityType) { // Corrected trigger_type to triggerType
        if (activityType === 'IDLE') {
          const durationMinutes = details?.durationMinutes;
          if (durationMinutes && durationMinutes >= triggerCondition.durationMinutes) {
            console.log(`Rule triggered: ${rule.ruleName} for user ${userId}`); // Corrected rule_name to ruleName
            
            // Fetch user preferences to confirm intervention method
            const userPrefs = await this.userPreferencesRepository.findOne({ where: { userId: userId } }); // Corrected user_id to userId
            const preferredMethod = userPrefs?.preferredInterventionMethod || rule.interventionMethod; // Corrected preferred_intervention_method and intervention_method

            // Prepare notification object
            return {
              message: rule.interventionMessageTemplate, // Corrected intervention_message_template
              method: preferredMethod,
              ruleName: rule.ruleName, // Corrected rule_name to ruleName
              userId: userId,
              timestamp: new Date().toISOString(),
            };
          }
        }
        // Add more activity types and their conditions here
      }
      // Add other trigger types (TIME_BASED, EXTERNAL_EVENT, BEHAVIOR_PATTERN) here
    }

    return null; // No intervention triggered
  }

  // TODO: Add methods for managing (create, read, update, delete) AI intervention rules
} 