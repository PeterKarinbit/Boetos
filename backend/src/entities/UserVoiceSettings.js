const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'UserVoiceSettings',
  tableName: 'user_voice_settings',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    user_id: {
      type: 'uuid',
      nullable: false
    },
    voice_model: {
      type: 'varchar',
      nullable: true
    },
    voice_id: {
      type: 'varchar',
      nullable: true
    },
    voice_enabled: {
      type: 'boolean',
      default: false
    },
    voice_language: {
      type: 'varchar',
      nullable: true
    },
    voice_speed: {
      type: 'float',
      default: 1.0
    },
    voice_pitch: {
      type: 'float',
      default: 1.0
    },
    voice_volume: {
      type: 'float',
      default: 1.0
    },
    voice_gender: {
      type: 'varchar',
      nullable: true
    },
    voice_accent: {
      type: 'varchar',
      nullable: true
    },
    voice_style: {
      type: 'varchar',
      nullable: true
    },
    voice_emotion: {
      type: 'varchar',
      nullable: true
    },
    voice_background: {
      type: 'varchar',
      nullable: true
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true
    }
  },
  relations: {
    user: {
      type: 'one-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' },
      inverseSide: 'voiceSettings',
      nullable: true
    }
  }
});