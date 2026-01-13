/**
 * Run Apollo Boolean Migration
 * 
 * This script applies the migration to convert varchar boolean fields
 * to proper boolean columns in the apollo_search_results table.
 * 
 * Usage: npx tsx scripts/run-apollo-boolean-migration.ts
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

async function convertColumnsIndividually(sql: ReturnType<typeof postgres>) {
  const columns = [
    { name: 'has_email', nullable: true },
    { name: 'has_city', nullable: true },
    { name: 'has_state', nullable: true },
    { name: 'has_country', nullable: true },
    { name: 'has_direct_phone', nullable: true },
    { name: 'processed', nullable: false, hasDefault: true },
  ];

  for (const col of columns) {
    try {
      // For processed column, drop the default first if it exists
      if (col.hasDefault) {
        try {
          console.log(`    🔄 Dropping default for ${col.name}...`);
          await sql.unsafe(`ALTER TABLE "apollo_search_results" ALTER COLUMN "${col.name}" DROP DEFAULT;`);
          console.log(`    ✅ Default dropped for ${col.name}`);
        } catch (error) {
          const err = error as { message?: string };
          // Ignore if default doesn't exist
          if (!err.message?.includes('does not exist')) {
            console.log(`    ⚠️  Could not drop default for ${col.name}: ${err.message}`);
          }
        }
      }

      const conversion = col.nullable
        ? `CASE WHEN "${col.name}"::text = 'true' THEN true ELSE NULL END`
        : `CASE WHEN "${col.name}"::text = 'true' THEN true ELSE false END`;
      
      console.log(`    🔄 Converting ${col.name}...`);
      await sql.unsafe(`ALTER TABLE "apollo_search_results" ALTER COLUMN "${col.name}" TYPE boolean USING ${conversion};`);
      console.log(`    ✅ ${col.name} converted successfully`);

      // Set default for processed column after conversion
      if (col.hasDefault) {
        try {
          await sql.unsafe(`ALTER TABLE "apollo_search_results" ALTER COLUMN "${col.name}" SET DEFAULT false;`);
          console.log(`    ✅ Set boolean default for ${col.name} column`);
        } catch (error) {
          const err = error as { message?: string };
          console.log(`    ⚠️  Failed to set default: ${err.message}`);
        }
      }
    } catch (error) {
      const err = error as { message?: string; code?: string };
      console.log(`    ⚠️  Failed to convert ${col.name}: ${err.message}`);
    }
  }
}

async function runMigration() {
  const sql = postgres(DATABASE_URL!);

  try {
    console.log('🔄 Running Apollo boolean migration...\n');

    // Check current column types first
    console.log('🔍 Checking current column types...');
    const beforeCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'apollo_search_results' 
      AND column_name IN ('has_email', 'has_city', 'has_state', 'has_country', 'has_direct_phone', 'processed')
      ORDER BY column_name
    `;

    console.log('📊 Current column types:');
    beforeCheck.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // If all are already boolean, we're done
    if (beforeCheck.every(col => col.data_type === 'boolean')) {
      console.log('\n✅ All columns are already boolean type. Migration not needed.');
      return;
    }

    console.log('\n🔄 Converting columns to boolean type...\n');
    
    // Convert columns individually (more reliable than batch)
    await convertColumnsIndividually(sql);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const columnTypes = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'apollo_search_results' 
      AND column_name IN ('has_email', 'has_city', 'has_state', 'has_country', 'has_direct_phone', 'processed')
      ORDER BY column_name
    `;

    console.log('\n📊 Column types after migration:');
    columnTypes.forEach(col => {
      const status = col.data_type === 'boolean' ? '✅' : '❌';
      console.log(`  ${status} ${col.column_name}: ${col.data_type}`);
    });

    const allBoolean = columnTypes.every(col => col.data_type === 'boolean');
    if (allBoolean) {
      console.log('\n✅ Migration completed successfully! All columns are now boolean type.');
    } else {
      console.log('\n⚠️  Some columns may not have been converted. Please check manually.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
