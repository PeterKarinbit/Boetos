const { EntitySchema } = require('typeorm');

const AiInterventionRule = new EntitySchema({
  name: 'AiInterventionRule',
  tableName: 'ai_intervention_rule',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    ruleName: {
      type: 'varchar',
      nullable: true,
      name: 'rule_name'
    },
    ruleType: {
      type: 'varchar',
      name: 'rule_type'
    },
    ruleCondition: {
      type: 'jsonb',
      name: 'rule_condition'
    },
    interventionMethod: {
      type: 'varchar',
      nullable: true,
      name: 'intervention_method'
    },
    interventionMessageTemplate: {
      type: 'text',
      nullable: true,
      name: 'intervention_message_template'
    },
    isActive: {
      type: 'boolean',
      default: true,
      name: 'is_active'
    },
    userId: {
      type: 'uuid',
      name: 'user_id'
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
      },
      onDelete: 'CASCADE'
    }
  },
  methods: {
    validateCondition() {
      if (!this.ruleCondition) return false;
      
      switch (this.ruleType.toLowerCase()) {
        case 'activity_based':
          return !!this.ruleCondition.activityType;
        // Add other rule types validation here
        default:
          return false;
      }
    }
  }
});

module.exports = { AiInterventionRule }; 