# Database Repair Tools

This directory contains tools to repair and maintain the Boetos database.

## Overview of Database Repair Tools

The following scripts have been created to help diagnose and fix database issues:

### 1. drop-type.js

Directly handles PostgreSQL type conflicts which can occur when a table and type share the same name.

```bash
npm run drop-type
```

This script:
- Drops the `user_voice_settings` table with CASCADE
- Removes any conflicting `user_voice_settings` type
- Recreates the table with proper constraints
- Re-establishes foreign key relationships

### 2. db-repair.js

A comprehensive database repair tool that checks and fixes:

```bash
npm run repair-db
```

- Migrations table structure
- Type conflicts
- Entity tables integrity
- Foreign key relationships
- Regenerates migration records

### 3. clean-start.js

Combines database repair with application startup:

```bash
npm run clean-start
```

Executes in this sequence:
1. Runs `drop-type.js` to fix critical type conflicts
2. Runs `repair-db` to ensure database integrity
3. Starts the application with database initialization bypassed

For development with auto-reload:

```bash
npm run clean-dev
```

## Common Database Issues

### Type Conflicts

PostgreSQL error: `cannot drop type user_voice_settings because table user_voice_settings requires it`

This occurs when a table and a type share the same name, creating a circular dependency. The `drop-type.js` script specifically addresses this issue.

### EntitySchema Import Issues

Error: `ReferenceError: EntitySchema is not defined`

This happens when entity files don't properly import the EntitySchema class from TypeORM. Ensure all entity files include:

```javascript
const { EntitySchema } = require('typeorm');
```

### Foreign Key Constraints

Errors about missing or invalid foreign keys can occur after schema changes. The repair tools will check and fix these constraints automatically.

## Recommended Database Maintenance

1. Before deploying schema changes, run a backup:
   ```bash
   pg_dump -U username -d database_name > backup.sql
   ```

2. After migrations, run the database repair:
   ```bash
   npm run repair-db
   ```

3. If issues persist, use the clean start approach:
   ```bash
   npm run clean-start
   ```

4. For development, prefer `clean-dev` which includes auto-reload:
   ```bash
   npm run clean-dev
   ```

## Adding New Entity Tables

When adding new entity tables:

1. Create the TypeORM entity file with proper EntitySchema import
2. Create a migration file in `src/db/` directory
3. Run `npm run convert-migrations` to convert TS migrations to JS
4. Apply the migrations with `npm run migration:run`
5. If issues occur, run `npm run clean-start`
