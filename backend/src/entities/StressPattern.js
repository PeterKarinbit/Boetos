const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'StressPattern',
  tableName: 'stress_patterns',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    userId: {
      type: 'varchar',
      nullable: false
    },
    patternType: {
      type: 'varchar',
      nullable: false
    },
    description: {
      type: 'text',
      nullable: false
    },
    severity: {
      type: 'varchar',
      nullable: false
    },
    frequency: {
      type: 'varchar',
      nullable: false
    },
    detectedAt: {
      type: 'timestamp',
      nullable: false
    },
    metadata: {
      type: 'jsonb',
      nullable: true
    }
  },
  indices: [
    {
      name: 'IDX_STRESS_PATTERN_USER_DATE',
      columns: ['userId', 'detectedAt']
    }
  ]
}); 