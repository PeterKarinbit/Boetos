const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MentalHealthCheck',
  tableName: 'mental_health_checks',
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
    mood: {
      type: 'int',
      nullable: false
    },
    stress: {
      type: 'int',
      nullable: false
    },
    sleep: {
      type: 'int',
      nullable: false
    },
    energy: {
      type: 'int',
      nullable: false
    },
    notes: {
      type: 'text',
      nullable: true
    },
    risk_score: {
      type: 'float',
      nullable: false
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'user_id'
      }
    }
  },
  indices: [
    {
      name: 'IDX_MENTAL_HEALTH_USER_DATE',
      columns: ['user_id', 'created_at']
    }
  ]
}); 