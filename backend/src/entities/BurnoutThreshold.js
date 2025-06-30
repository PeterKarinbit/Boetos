const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'BurnoutThreshold',
  tableName: 'burnout_thresholds',
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
    max_meeting_hours_per_day: {
      type: 'float',
      default: 4.0
    },
    max_work_hours_per_day: {
      type: 'float',
      default: 8.0
    },
    min_break_hours_per_day: {
      type: 'float',
      default: 1.0
    },
    min_focus_blocks_per_day: {
      type: 'float',
      default: 2.0
    },
    min_sleep_hours: {
      type: 'float',
      default: 7.0
    },
    meeting_weight: {
      type: 'float',
      default: 0.3
    },
    work_hours_weight: {
      type: 'float',
      default: 0.2
    },
    break_weight: {
      type: 'float',
      default: 0.15
    },
    focus_weight: {
      type: 'float',
      default: 0.2
    },
    sleep_weight: {
      type: 'float',
      default: 0.15
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
      onDelete: 'CASCADE'
    }
  }
});
