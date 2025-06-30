const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    email: {
      type: 'varchar',
      unique: true,
      nullable: false
    },
    password: {
      type: 'varchar',
      nullable: true
    },
    google_id: {
      type: 'varchar',
      nullable: true
    },
    google_access_token: {
      type: 'varchar',
      nullable: true
    },
    google_refresh_token: {
      type: 'varchar',
      nullable: true
    },
    name: {
      type: 'varchar',
      nullable: true
    },
    role: {
      type: 'varchar',
      nullable: true
    },
    company: {
      type: 'varchar',
      nullable: true
    },
    bio: {
      type: 'text',
      nullable: true
    },
    profileImage: {
      type: 'varchar',
      nullable: true,
      name: 'profile_image'
    },
    preferences: {
      type: 'jsonb',
      nullable: true
    },
    onboarding_completed: {
      type: 'boolean',
      default: false
    },
    onboarding_data: {
      type: 'jsonb',
      nullable: true
    },
    email_verified: {
      type: 'boolean',
      default: false
    },
    email_verification_token: {
      type: 'varchar',
      nullable: true
    },
    email_verification_expires: {
      type: 'timestamp',
      nullable: true
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true
    },
    voice_settings_id: {
      type: 'uuid',
      nullable: true
    }
  },
  relations: {
    preferences: {
      type: 'one-to-one',
      target: 'UserPreferences',
      inverseSide: 'user'
    },
    voiceSettings: {
      type: 'one-to-one',
      target: 'UserVoiceSettings',
      joinColumn: {
        name: 'voice_settings_id'
      },
      nullable: true
    },
    activities: {
      type: 'one-to-many',
      target: 'Activity',
      inverseSide: 'user'
    },
    meetings: {
      type: 'one-to-many',
      target: 'Meeting',
      inverseSide: 'user'
    },
    aiInterventionRules: {
      type: 'one-to-many',
      target: 'AiInterventionRule',
      inverseSide: 'user'
    }
  }
}); 