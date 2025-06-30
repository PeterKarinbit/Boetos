const { EntitySchema } = require('typeorm');

const Activity = new EntitySchema({
  name: 'Activity',
  tableName: 'activity',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    userId: {
      type: 'uuid',
      name: 'user_id'
    },
    type: {
      type: 'varchar'
    },
    description: {
      type: 'varchar',
      nullable: true
    },
    metadata: {
      type: 'jsonb',
      nullable: true
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
      name: 'created_at'
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
  }
});

module.exports = { Activity }; 