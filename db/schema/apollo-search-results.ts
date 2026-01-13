import { pgTable, uuid, varchar, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const apolloSearchResults = pgTable('apollo_search_results', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Search parameters used
  searchParams: jsonb('search_params').notNull(), // Store the full search criteria

  // API response data
  personId: varchar('person_id', { length: 100 }).notNull(), // Apollo person ID
  firstName: varchar('first_name', { length: 100 }),
  lastNameObfuscated: varchar('last_name_obfuscated', { length: 100 }),
  title: varchar('title', { length: 255 }),

  // Organization data
  organizationName: varchar('organization_name', { length: 255 }),
  organizationData: jsonb('organization_data'), // Full organization object

  // Data availability flags (now proper booleans)
  hasEmail: boolean('has_email'),
  hasCity: boolean('has_city'),
  hasState: boolean('has_state'),
  hasCountry: boolean('has_country'),
  hasDirectPhone: boolean('has_direct_phone'),

  // Full raw response
  rawResponse: jsonb('raw_response').notNull(), // Complete person object from API

  // Metadata
  lastRefreshedAt: varchar('last_refreshed_at', { length: 100 }), // From API
  pageNumber: integer('page_number'), // Which page this result came from

  // Processing status (now proper boolean)
  processed: boolean('processed').default(false), // Whether this has been converted to contact/company
  companyId: uuid('company_id'), // Reference to created company (if processed)
  contactId: uuid('contact_id'), // Reference to created contact (if processed)

  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 255 }),
});

export type ApolloSearchResult = typeof apolloSearchResults.$inferSelect;
export type NewApolloSearchResult = typeof apolloSearchResults.$inferInsert;
