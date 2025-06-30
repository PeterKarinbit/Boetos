const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
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
    title: {
      type: 'varchar',
      nullable: false
    },
    message: {
      type: 'text',
      nullable: false
    },
    type: {
      type: 'varchar',
      nullable: false
    },
    read: {
      type: 'boolean',
      default: false
    },
    data: {
      type: 'jsonb',
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
      name: 'IDX_NOTIFICATION_USER_READ',
      columns: ['user_id', 'read']
    },
    {
      name: 'IDX_NOTIFICATION_CREATED_AT',
      columns: ['created_at']
    }
  ]
}); 