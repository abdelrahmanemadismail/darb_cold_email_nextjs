import { sql } from '../db';

async function fixSchema() {
  try {
    console.log('🔧 Fixing database schema...');

    // Fix emailVerified column to be boolean
    await sql`ALTER TABLE "user" ALTER COLUMN "emailVerified" TYPE boolean USING ("emailVerified"::integer::boolean)`;

    console.log('✅ Schema fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSchema();
