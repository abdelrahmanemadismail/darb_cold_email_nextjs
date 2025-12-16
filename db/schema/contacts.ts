import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Basic information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  gender: varchar('gender', { length: 50 }),

  // Professional information
  jobTitle: varchar('job_title', { length: 255 }),
  department: varchar('department', { length: 100 }),
  // seniority: varchar('seniority', { length: 50 }), // e.g., "entry", "mid", "senior", "executive"

  // Company relationship
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),

  // Social profiles
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  twitterUrl: varchar('twitter_url', { length: 500 }),

  // Contact status
  isVerified: boolean('is_verified').default(false),
  status: varchar('status', { length: 50 }).default('active'), // active, unsubscribed, bounced, etc.


  // Tracking
  tags: varchar('tags', { length: 100 }).array(),

  // Notes and custom fields
  notes: text('notes'),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  lastContactedAt: timestamp('last_contacted_at'),
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
