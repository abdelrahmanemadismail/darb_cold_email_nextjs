/**
 * Zod Validation Schemas for Apollo API
 * 
 * Provides type-safe validation for Apollo API requests and responses
 */

import { z } from 'zod';

/**
 * Valid Apollo email statuses
 */
export const APOLLO_EMAIL_STATUSES = [
  'verified',
  'unverified',
  'likely to engage',
  'unavailable',
] as const;

/**
 * Apollo search parameters schema
 */
export const apolloSearchParamsSchema = z.object({
  personTitles: z.array(z.string()).optional(),
  personLocations: z.array(z.string()).optional(),
  companyLocations: z.array(z.string()).optional(),
  employeeRanges: z.array(z.string()).optional(),
  contactEmailStatus: z.array(z.enum(APOLLO_EMAIL_STATUSES)).optional(),
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().max(100).optional(),
}).refine(
  (data) => {
    // At least one search criteria must be provided
    return !!(
      (data.personTitles && data.personTitles.length > 0) ||
      (data.personLocations && data.personLocations.length > 0) ||
      (data.companyLocations && data.companyLocations.length > 0) ||
      (data.employeeRanges && data.employeeRanges.length > 0)
    );
  },
  {
    message: 'At least one search criteria is required',
  }
);

export type ApolloSearchParams = z.infer<typeof apolloSearchParamsSchema>;

/**
 * Apollo script request schema (for API route)
 */
export const apolloScriptRequestSchema = z.object({
  personTitles: z.array(z.string()).optional(),
  personLocations: z.array(z.string()).optional(),
  companyLocations: z.array(z.string()).optional(),
  employeeRanges: z.array(z.string()).optional(),
  contactEmailStatus: z.array(z.enum(APOLLO_EMAIL_STATUSES)).optional(),
  maxPages: z.number().int().positive().max(100).default(1),
  perPage: z.number().int().positive().max(100).default(25),
  autoEnrich: z.boolean().default(false),
  enrichmentSettings: z.object({
    revealPersonalEmails: z.boolean().default(true),
    revealPhoneNumbers: z.boolean().default(false),
    webhookUrl: z.string().url().optional(),
  }).optional(),
}).refine(
  (data) => {
    return !!(
      (data.personTitles && data.personTitles.length > 0) ||
      (data.personLocations && data.personLocations.length > 0) ||
      (data.companyLocations && data.companyLocations.length > 0)
    );
  },
  {
    message: 'At least one search criteria is required',
  }
);

export type ApolloScriptRequest = z.infer<typeof apolloScriptRequestSchema>;

/**
 * Apollo enrichment request schema
 */
export const apolloEnrichmentRequestSchema = z.object({
  limit: z.number().int().positive().max(500).default(100),
  revealPersonalEmails: z.boolean().default(true),
  revealPhoneNumbers: z.boolean().default(false),
  webhookUrl: z.string().url().optional(),
}).refine(
  (data) => {
    // Webhook URL is required when revealing phone numbers
    if (data.revealPhoneNumbers && !data.webhookUrl) {
      return false;
    }
    return true;
  },
  {
    message: 'Webhook URL is required when revealing phone numbers',
    path: ['webhookUrl'],
  }
);

export type ApolloEnrichmentRequest = z.infer<typeof apolloEnrichmentRequestSchema>;
