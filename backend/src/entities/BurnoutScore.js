const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'BurnoutScore',
  tableName: 'burnout_scores',
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
    score: {
      type: 'float',
      nullable: false
    },
    date: {
      type: 'timestamp',
      nullable: false
    },
    meeting_hours: {
      type: 'float',
      nullable: true
    },
    work_hours: {
      type: 'float',
      nullable: true
    },
    focus_blocks: {
      type: 'float',
      nullable: true
    },
    breaks_taken: {
      type: 'float',
      nullable: true
    },
    sleep_hours: {
      type: 'float',
      nullable: true
    },
    stress_indicators: {
      type: 'simple-json',
      nullable: true
    },
    recovery_indicators: {
      type: 'simple-json',
      nullable: true
    },
    metrics: {
      type: 'jsonb',
      nullable: true
    },
    ai_insights: {
      type: 'text',
      nullable: true
    },
    recommendations: {
      type: 'jsonb',
      nullable: true
    },
    notes: {
      type: 'text',
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
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE'
    }
  },
  indices: [
    {
      name: 'IDX_BURNOUT_SCORE_USER_DATE',
      columns: ['user_id', 'date']
    }
  ]
}); 