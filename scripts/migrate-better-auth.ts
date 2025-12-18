import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

async function runMigrations() {
  const sql = postgres(DATABASE_URL!);

  try {
    console.log('🔄 Running better-auth migrations...');

    // Get all migration files
    const migrationsDir = join(process.cwd(), 'better-auth_migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`  📄 Applying ${file}...`);
      const migrationSQL = readFileSync(join(migrationsDir, file), 'utf-8');

      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await sql.unsafe(statement);
        } catch (error) {
          // Ignore "already exists" errors
          const err = error as { message?: string };
          if (!err.message?.includes('already exists')) {
            throw error;
          }
        }
      }
      console.log(`  ✅ ${file} applied`);
    }

    console.log('✅ All better-auth migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
