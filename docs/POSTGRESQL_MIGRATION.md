# PostgreSQL Migration Guide

This document outlines the changes made to migrate better-auth from SQLite to PostgreSQL.

## Overview

The application now uses **PostgreSQL** for both better-auth authentication and Drizzle ORM data (companies/contacts). Previously, better-auth used SQLite while the rest of the app used PostgreSQL.

## Changes Made

### 1. Dependencies Updated

**Removed:**
- `better-sqlite3` - SQLite database driver
- `@types/better-sqlite3` - TypeScript types for better-sqlite3

**Already Present:**
- `postgres` - PostgreSQL driver
- `drizzle-orm` - ORM for database operations
- `better-auth` - Authentication library (now configured with Drizzle adapter)

### 2. Configuration Files

#### `lib/auth.ts`
- Removed SQLite database initialization
- Removed manual schema creation
- Added Drizzle adapter integration:
  ```typescript
  import { drizzleAdapter } from "better-auth/adapters/drizzle";
  import { db } from "@/db";

  export const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    // ... rest of config
  });
  ```

#### `.env.local`
- Removed `BETTER_AUTH_DATABASE_URL` (was for SQLite)
- Now using single `DATABASE_URL` for PostgreSQL:
  ```env
  DATABASE_URL=postgresql://username:password@localhost:5432/darb_cold_email
  ```

#### `.env.example`
- Updated to reflect PostgreSQL as the standard database
- Removed SQLite references

### 3. Scripts Updated

#### `scripts/create-admin.ts`
- Replaced SQLite queries with PostgreSQL queries via Drizzle
- Updated to use parameterized queries with `$1`, `$2` syntax
- Added environment variable loading

#### `scripts/change-password.ts`
- Replaced SQLite queries with PostgreSQL queries via Drizzle
- Updated to use parameterized queries
- Added environment variable loading

#### `scripts/migrate-better-auth.ts` (NEW)
- Script to apply better-auth migrations to PostgreSQL
- Run with: `npm run migrate-auth`
- Applies SQL files from `better-auth_migrations/` directory

### 4. package.json
- Removed `better-sqlite3` and `@types/better-sqlite3` dependencies
- Added new script: `"migrate-auth": "tsx scripts/migrate-better-auth.ts"`

### 5. Documentation

#### `README.md`
- Updated prerequisites to include PostgreSQL
- Updated setup instructions with database creation steps
- Added migration commands to setup process
- Updated tech stack section

## Migration Steps

If you're migrating an existing SQLite database to PostgreSQL:

### 1. Set Up PostgreSQL

```bash
# Install PostgreSQL (if not already installed)
# On Windows: Download from https://www.postgresql.org/download/windows/
# On Mac: brew install postgresql
# On Linux: sudo apt-get install postgresql

# Create database
psql -U postgres
CREATE DATABASE darb_cold_email;
\q
```

### 2. Update Environment Variables

Update `.env.local`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/darb_cold_email
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
# Run better-auth migrations
npm run migrate-auth

# Run Drizzle migrations (for companies/contacts)
npm run db:push
```

### 5. Migrate Existing Data (Optional)

If you have existing SQLite data you want to migrate:

1. Export data from SQLite:
   ```bash
   sqlite3 db.sqlite .dump > sqlite_dump.sql
   ```

2. Convert SQLite dump to PostgreSQL format (manual conversion needed)

3. Import into PostgreSQL:
   ```bash
   psql -U postgres -d darb_cold_email < postgres_dump.sql
   ```

### 6. Create Admin User

```bash
npm run create-admin
```

### 7. Start the Application

```bash
npm run dev
```

## Database Schema

Better-auth creates the following tables in PostgreSQL:

- **user** - User accounts
- **session** - Active sessions
- **account** - OAuth accounts and credentials
- **verification** - Email verification tokens

All tables use proper PostgreSQL types:
- `TEXT` for strings
- `DATE` for timestamps (better-auth handles date serialization)
- Foreign keys with `ON DELETE CASCADE`
- Proper indexes for performance

## Troubleshooting

### Connection Refused
If you see `ECONNREFUSED` error:
- Ensure PostgreSQL is running: `pg_ctl status` or check services
- Verify connection string in `.env.local`
- Check PostgreSQL is listening on the correct port (default 5432)

### Migration Errors
If migrations fail:
- Check PostgreSQL logs
- Verify database exists and user has proper permissions
- Try running migrations individually

### Authentication Issues
If authentication doesn't work after migration:
- Clear browser cookies
- Recreate admin user with `npm run create-admin`
- Check better-auth tables exist: `\dt` in psql

## Benefits of PostgreSQL

1. **Production Ready**: PostgreSQL is more suitable for production environments
2. **Unified Database**: Single database for all data (auth + business data)
3. **Better Performance**: Improved query performance and concurrency
4. **Advanced Features**: JSON support, full-text search, window functions
5. **Scalability**: Easier to scale and replicate
6. **Standard Compatibility**: Better SQL standard compliance

## Next Steps

- Configure connection pooling for production
- Set up database backups
- Configure PostgreSQL for optimal performance
- Set up read replicas if needed
- Consider hosted PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
