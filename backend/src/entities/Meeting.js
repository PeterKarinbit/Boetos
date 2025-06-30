const { EntitySchema } = require('typeorm');

const Meeting = new EntitySchema({
  name: 'Meeting',
  tableName: 'meeting',
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
    title: {
      type: 'varchar'
    },
    description: {
      type: 'varchar',
      nullable: true
    },
    startTime: {
      type: 'timestamp',
      name: 'start_time'
    },
    endTime: {
      type: 'timestamp',
      name: 'end_time'
    },
    participants: {
      type: 'jsonb',
      nullable: true
    },
    googleCalendarEventId: {
      type: 'varchar',
      nullable: true,
      name: 'google_calendar_event_id'
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

module.exports = { Meeting }; 