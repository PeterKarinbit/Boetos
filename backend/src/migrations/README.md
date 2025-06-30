# Database Migrations
# Database Migrations

This directory contains TypeORM migrations for the Boetos application.

## Migration Format

Migrations are defined in TypeScript and then converted to JavaScript for execution. Each migration follows this pattern:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationName1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Changes to apply when migrating up
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Changes to apply when rolling back
    }
}
```

## Running Migrations

To apply all pending migrations:

```bash
npm run migration:run
```

## Creating New Migrations

Create migration source files in TypeScript format in the `src/db/` directory, then convert them to JavaScript:

```bash
npm run convert-migrations
```

This will convert your TypeScript migrations to JavaScript and place them in the proper location.

## When Migrations Fail

If migrations fail to apply correctly:

1. Try the database repair tool:
   ```bash
   npm run repair-db
   ```

2. If that fails, use the drop-type tool to fix type conflicts:
   ```bash
   npm run drop-type
   ```

3. For a complete solution, use clean-start:
   ```bash
   npm run clean-start
   ```

## Migration Best Practices

1. Always include both `up()` and `down()` methods
2. Create small, focused migrations rather than large ones
3. Test migrations in development before applying to production
4. Back up your database before running migrations in production
5. Use descriptive names for your migrations
6. Ensure migrations are idempotent when possible
7. Handle errors gracefully
8. Avoid direct data manipulation in migrations when possible
This folder contains TypeORM database migrations for the Boetos application.

## Running Migrations

To apply all pending migrations:

```bash
npm run migration:run
```

## Creating New Migrations

To create a new migration manually:

```bash
npm run migration:create src/migrations/MyMigrationName
```

To generate a migration based on entity changes:

```bash
npm run migration:generate src/migrations/MyMigrationName
```

## Reverting Migrations

To revert the most recent migration:

```bash
npm run migration:revert
```

## Migration Best Practices

1. Never use `synchronize: true` in production
2. Always test migrations in a development environment before applying them to production
3. Back up your database before running migrations in production
4. Keep migrations in version control
5. Use descriptive names for your migrations
