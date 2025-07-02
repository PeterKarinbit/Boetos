const { Client } = require('pg');
require('dotenv').config();

// Expanded expected schemas for all main tables
const expectedSchemas = {
  users: {
    columns: {
      id: 'uuid',
      email: 'varchar',
      password: 'varchar',
      google_id: 'varchar',
      google_access_token: 'varchar',
      google_refresh_token: 'varchar',
      name: 'varchar',
      role: 'varchar',
      company: 'varchar',
      bio: 'text',
      profile_image: 'varchar',
      preferences: 'jsonb',
      onboarding_completed: 'boolean',
      onboarding_data: 'jsonb',
      email_verified: 'boolean',
      email_verification_token: 'varchar',
      email_verification_expires: 'timestamp',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      voice_settings_id: 'uuid',
    },
    pk: ['id'],
  },
  user_preferences: {
    columns: {
      id: 'int',
      user_id: 'uuid',
      preferred_channel: 'varchar',
      quiet_hours_start: 'varchar',
      quiet_hours_end: 'varchar',
      reminder_frequency: 'int',
      tone_preference: 'varchar',
      auto_track_categories: 'text[]',
      enable_ai_interventions: 'boolean',
      preferred_intervention_method: 'varchar',
      ai_tone_preference: 'jsonb',
      custom_intervention_messages: 'jsonb',
      ai_onboarding_memory: 'jsonb',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  user_voice_settings: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      voice_model: 'varchar',
      voice_id: 'varchar',
      voice_enabled: 'boolean',
      voice_language: 'varchar',
      voice_speed: 'float',
      voice_pitch: 'float',
      voice_volume: 'float',
      voice_gender: 'varchar',
      voice_accent: 'varchar',
      voice_style: 'varchar',
      voice_emotion: 'varchar',
      voice_background: 'varchar',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  activity: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      type: 'varchar',
      description: 'varchar',
      metadata: 'jsonb',
      created_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  meeting: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      title: 'varchar',
      description: 'varchar',
      start_time: 'timestamp',
      end_time: 'timestamp',
      participants: 'jsonb',
      google_calendar_event_id: 'varchar',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  ai_intervention_rule: {
    columns: {
      id: 'uuid',
      rule_name: 'varchar',
      rule_type: 'varchar',
      rule_condition: 'jsonb',
      intervention_method: 'varchar',
      intervention_message_template: 'text',
      is_active: 'boolean',
      user_id: 'uuid',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  burnout_scores: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      score: 'float',
      date: 'timestamp',
      meeting_hours: 'float',
      work_hours: 'float',
      focus_blocks: 'float',
      breaks_taken: 'float',
      sleep_hours: 'float',
      stress_indicators: 'jsonb',
      recovery_indicators: 'jsonb',
      metrics: 'jsonb',
      ai_insights: 'text',
      recommendations: 'jsonb',
      notes: 'text',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  burnout_thresholds: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      max_meeting_hours_per_day: 'float',
      max_work_hours_per_day: 'float',
      min_break_hours_per_day: 'float',
      min_focus_blocks_per_day: 'float',
      min_sleep_hours: 'float',
      meeting_weight: 'float',
      work_hours_weight: 'float',
      break_weight: 'float',
      focus_weight: 'float',
      sleep_weight: 'float',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  calendar_events: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      external_id: 'varchar',
      title: 'varchar',
      description: 'text',
      start_time: 'timestamp',
      end_time: 'timestamp',
      is_all_day: 'boolean',
      event_type: 'varchar',
      attendees_count: 'int',
      calendar_source: 'varchar',
      stress_impact: 'float',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      boetos_task_state: 'varchar',
      timer_state: 'jsonb',
      is_boetos_task: 'boolean',
      analytics: 'jsonb',
      reminder_time: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  memory_entries: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      content: 'text',
      type: 'varchar',
      createdat: 'timestamp',
      nudgepreference: 'varchar',
      snoozeduntil: 'timestamp',
      isarchived: 'boolean',
      isdone: 'boolean',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  chat_messages: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      content: 'text',
      sender: 'varchar',
      created_at: 'timestamp',
      session_id: 'uuid',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  notifications: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      title: 'varchar',
      message: 'text',
      type: 'varchar',
      read: 'boolean',
      data: 'jsonb',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  stress_patterns: {
    columns: {
      id: 'uuid',
      userid: 'varchar',
      patterntype: 'varchar',
      description: 'text',
      severity: 'varchar',
      frequency: 'varchar',
      detectedat: 'timestamp',
      metadata: 'jsonb',
    },
    pk: ['id'],
  },
  user_schedule: {
    columns: {
      id: 'uuid',
      user_id: 'uuid',
      event_id: 'varchar',
      title: 'varchar',
      description: 'text',
      start_time: 'timestamp',
      end_time: 'timestamp',
      location: 'varchar',
      event_type: 'varchar',
      source: 'varchar',
      is_all_day: 'boolean',
      status: 'varchar',
      created_at: 'timestamp',
      updated_at: 'timestamp',
    },
    pk: ['id'],
    fk: [{ column: 'user_id', ref: 'users(id)' }],
  },
  // Add tasks, goals, etc. as needed
};

async function getTableColumns(client, table) {
  const res = await client.query(`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = $1`, [table]);
  return res.rows;
}

async function getTableConstraints(client, table) {
  const res = await client.query(`
    SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = $1
  `, [table]);
  return res.rows;
}

async function addMissingColumn(client, table, column, type) {
  try {
    await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
    console.log(`✅ Added missing column ${column} to ${table}`);
  } catch (err) {
    console.error(`❌ Failed to add column ${column} to ${table}:`, err.message);
  }
}

async function addPrimaryKey(client, table, pkCols) {
  try {
    await client.query(`ALTER TABLE ${table} ADD PRIMARY KEY (${pkCols.join(',')})`);
    console.log(`✅ Added primary key on ${pkCols.join(',')} to ${table}`);
  } catch (err) {
    console.error(`❌ Failed to add primary key to ${table}:`, err.message);
  }
}

async function addForeignKey(client, table, column, ref) {
  try {
    await client.query(`ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_${column} FOREIGN KEY (${column}) REFERENCES ${ref}`);
    console.log(`✅ Added foreign key on ${column} to ${table} referencing ${ref}`);
  } catch (err) {
    console.error(`❌ Failed to add foreign key to ${table}:`, err.message);
  }
}

async function checkAndFixTable(client, table, schema) {
  const actualCols = await getTableColumns(client, table);
  const actualColNames = actualCols.map(c => c.column_name.toLowerCase());
  const summary = { table, added: [], missing: [], extra: [], pk: '', fk: [], errors: [] };

  // Check for missing columns
  for (const [col, type] of Object.entries(schema.columns)) {
    if (!actualColNames.includes(col.toLowerCase())) {
      summary.missing.push(col);
      await addMissingColumn(client, table, col, type);
      summary.added.push(col);
    }
  }
  // Check for extra columns
  for (const col of actualColNames) {
    if (!schema.columns[col]) {
      summary.extra.push(col);
    }
  }
  // Check constraints
  const constraints = await getTableConstraints(client, table);
  // PK
  if (schema.pk) {
    const hasPK = constraints.some(c => c.constraint_type === 'PRIMARY KEY');
    if (!hasPK) {
      await addPrimaryKey(client, table, schema.pk);
      summary.pk = 'added';
    }
  }
  // FK
  if (schema.fk) {
    for (const fk of schema.fk) {
      const hasFK = constraints.some(c => c.constraint_type === 'FOREIGN KEY' && c.column_name === fk.column);
      if (!hasFK) {
        await addForeignKey(client, table, fk.column, fk.ref);
        summary.fk.push(`added ${fk.column}->${fk.ref}`);
      }
    }
  }
  return summary;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const results = [];
  for (const table of Object.keys(expectedSchemas)) {
    try {
      const summary = await checkAndFixTable(client, table, expectedSchemas[table]);
      results.push(summary);
    } catch (err) {
      console.error(`❌ Error checking table ${table}:`, err.message);
    }
  }
  await client.end();
  // Print summary
  for (const r of results) {
    console.log(`\nTable: ${r.table}`);
    if (r.added.length) console.log('  Added columns:', r.added);
    if (r.missing.length) console.log('  Missing columns:', r.missing);
    if (r.extra.length) console.log('  Extra columns:', r.extra);
    if (r.pk) console.log('  Primary key:', r.pk);
    if (r.fk.length) console.log('  Foreign keys:', r.fk);
    if (r.errors && r.errors.length) console.log('  Errors:', r.errors);
  }
}

main(); 