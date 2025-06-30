const { EntitySchema } = require('typeorm');

const UserPreferences = new EntitySchema({
  name: 'UserPreferences',
  tableName: 'user_preferences',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true
    },
    userId: {
      type: 'uuid',
      name: 'user_id'
    },
    preferredChannel: {
      type: 'varchar',
      name: 'preferred_channel'
    },
    quietHoursStart: {
      type: 'varchar',
      nullable: true,
      name: 'quiet_hours_start'
    },
    quietHoursEnd: {
      type: 'varchar',
      nullable: true,
      name: 'quiet_hours_end'
    },
    reminderFrequency: {
      type: 'int',
      nullable: true,
      name: 'reminder_frequency'
    },
    tonePreference: {
      type: 'varchar',
      name: 'tone_preference'
    },
    autoTrackCategories: {
      type: 'text',
      array: true,
      name: 'auto_track_categories'
    },
    enableAiInterventions: {
      type: 'boolean',
      name: 'enable_ai_interventions'
    },
    preferredInterventionMethod: {
      type: 'varchar',
      nullable: true,
      name: 'preferred_intervention_method'
    },
    aiTonePreference: {
      type: 'jsonb',
      nullable: true,
      name: 'ai_tone_preference'
    },
    customInterventionMessages: {
      type: 'jsonb',
      nullable: true,
      name: 'custom_intervention_messages'
    },
    aiOnboardingMemory: {
      type: 'jsonb',
      nullable: true,
      name: 'ai_onboarding_memory'
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
      name: 'created_at'
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
      name: 'updated_at'
    }
  },
  relations: {
    user: {
      type: 'one-to-one',
      target: 'User',
      joinColumn: {
        name: 'user_id'
      }
    }
  }
});

module.exports = { UserPreferences }; 