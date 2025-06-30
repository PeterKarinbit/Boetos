const { EntitySchema } = require('typeorm');

const UserSchedule = new EntitySchema({
  name: 'UserSchedule',
  tableName: 'user_schedule',
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
    eventId: {
      type: 'varchar',
      nullable: true,
      name: 'event_id'
    },
    title: {
      type: 'varchar',
      nullable: true
    },
    description: {
      type: 'text',
      nullable: true
    },
    startTime: {
      type: 'timestamp',
      nullable: true,
      name: 'start_time'
    },
    endTime: {
      type: 'timestamp',
      nullable: true,
      name: 'end_time'
    },
    location: {
      type: 'varchar',
      nullable: true
    },
    eventType: {
      type: 'varchar',
      nullable: true,
      name: 'event_type'
    },
    source: {
      type: 'varchar',
      nullable: true
    },
    isAllDay: {
      type: 'boolean',
      default: false,
      name: 'is_all_day'
    },
    status: {
      type: 'varchar',
      nullable: true
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
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'user_id'
      }
    }
  }
});

module.exports = { UserSchedule }; 