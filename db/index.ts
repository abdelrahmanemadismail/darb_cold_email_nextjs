import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';

// Load environment variables (for scripts that import this module)
config({ path: '.env.local' });

// Disable prefetch as it's not supported for "Transaction" pool mode
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Export postgres client for raw queries (used by better-auth and scripts)
export const sql = queryClient;

// Type exports
export type DbClient = typeof db;
export { schema };
