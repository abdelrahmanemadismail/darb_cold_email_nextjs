import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  size: varchar('size', { length: 50 }), // e.g., "1-10", "11-50", "51-200", etc.
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  description: text('description'),
  website: varchar('website', { length: 500 }),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  phone: varchar('phone', { length: 50 }),
  keywords: varchar('keywords', { length: 255 }).array(),

  // Tracking
  source: varchar('source', { length: 100 }), // e.g., "manual", "apify", "Apollo"
  tags: varchar('tags', { length: 255 }).array(),

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 255 }),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
