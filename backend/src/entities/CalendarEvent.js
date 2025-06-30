const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'CalendarEvent',
  tableName: 'calendar_events',
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
    external_id: {
      type: 'varchar',
      nullable: true
    },
    title: {
      type: 'varchar',
      nullable: false
    },
    description: {
      type: 'text',
      nullable: true
    },
    start_time: {
      type: 'timestamp',
      nullable: false
    },
    end_time: {
      type: 'timestamp',
      nullable: false
    },
    is_all_day: {
      type: 'boolean',
      default: false
    },
    event_type: {
      type: 'varchar',
      nullable: true,
      comment: 'meeting, focus, break, personal'
    },
    attendees_count: {
      type: 'int',
      nullable: true
    },
    calendar_source: {
      type: 'varchar',
      nullable: true,
      comment: 'google, outlook, manual'
    },
    stress_impact: {
      type: 'float',
      nullable: true,
      comment: 'Estimated stress impact of the event (-1 to 1)'
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true
    },
    boetos_task_state: {
      type: 'varchar',
      nullable: true,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active',
      comment: 'State of Boetos Task (active, paused, completed, cancelled)'
    },
    timer_state: {
      type: 'jsonb',
      nullable: true,
      comment: 'Timer state for Boetos Task (remaining, lastStarted, pausedAt, etc)'
    },
    is_boetos_task: {
      type: 'boolean',
      default: false,
      comment: 'True if this event is a Boetos Task'
    },
    analytics: {
      type: 'jsonb',
      nullable: true,
      comment: 'Analytics for Boetos Task (startedAt, completedAt, cancelledAt, etc)'
    },
    reminder_time: {
      type: 'timestamp',
      nullable: true,
      comment: 'Reminder time for Boetos Task'
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE'
    }
  }
});
