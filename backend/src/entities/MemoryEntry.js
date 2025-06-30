const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'MemoryEntry',
  tableName: 'memory_entries',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    user_id: {
      type: 'uuid',
      nullable: false,
    },
    content: {
      type: 'text',
      nullable: false,
    },
    type: {
      type: 'varchar',
      nullable: false,
      enum: ['note', 'link', 'reminder'],
      default: 'note',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    nudgePreference: {
      type: 'varchar',
      enum: ['daily', 'before_sleep', 'never'],
      default: 'daily',
    },
    snoozedUntil: {
      type: 'timestamp',
      nullable: true,
    },
    isArchived: {
      type: 'boolean',
      default: false,
    },
    isDone: {
      type: 'boolean',
      default: false,
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
    },
  },
}); 