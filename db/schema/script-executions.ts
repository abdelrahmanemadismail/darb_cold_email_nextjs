import { pgTable, uuid, varchar, timestamp, jsonb, integer, text } from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Script Executions Table
 * Tracks all script execution history and real-time status
 */
export const scriptExecutions = pgTable('script_executions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Script info
  scriptType: varchar('script_type', { length: 50 }).notNull(), // 'apollo', etc.
  status: varchar('status', { length: 20 }).notNull().default('running'), // running, completed, failed, cancelled

  // Timestamps
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),

  // Progress tracking
  currentPage: integer('current_page').default(0),
  totalPages: integer('total_pages').default(0),
  progressStatus: varchar('progress_status', { length: 255 }), // e.g., "Processing page 5..."

  // Parameters and results
  parameters: jsonb('parameters'), // Script input parameters
  results: jsonb('results'), // Script output results
  errorMessage: varchar('error_message', { length: 1000 }),

  // Audit
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
