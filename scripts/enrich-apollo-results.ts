/**
 * Apollo People Enrichment Script
 *
 * This script enriches people data from the apollo_search_results table
 * using the Apollo Bulk People Enrichment API to get full contact details
 * including emails and phone numbers, then updates the main companies and contacts tables.
 *
 * Usage: npx tsx scripts/enrich-apollo-results.ts
 */

import { db } from '@/db';
import { companies as companiesTable } from '@/db/schema/companies';
import { contacts as contactsTable } from '@/db/schema/contacts';
import { apolloSearchResults } from '@/db/schema/apollo-search-results';
import { eq } from 'drizzle-orm';
import { ApolloRateLimiter } from '@/lib/apollo/rate-limiter';
import { ApolloApiError, ApolloDatabaseError } from '@/lib/apollo/errors';
import { ApolloLogger } from '@/lib/apollo/logger';

interface EnrichmentDetails {
  // Apollo person ID (recommended for best matching)
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  organization_name?: string;
  domain?: string;
}

interface EnrichedPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  email: string;
  email_status: string;
  phone_numbers: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
    position: number;
    status: string;
  }>;
  organization: {
    id: string;
    name: string;
    website_url: string;
    linkedin_url: string;
    founded_year: number;
    industry: string;
    phone: string;
    primary_domain: string;
    city: string;
    state: string;
    country: string;
    estimated_num_employees: number;
  };
  linkedin_url: string;
}

interface BulkEnrichmentResponse {
  matches: EnrichedPerson[];
  breadcrumb_id: string;
}

export class ApolloEnrichmentService {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/api/v1';
  private batchSize = 10; // API limit
  private rateLimiter: ApolloRateLimiter;

  constructor(apiKey: string, rateLimiterOptions?: { delayMs?: number; requestsPerMinute?: number }) {
    this.apiKey = apiKey;
    this.rateLimiter = new ApolloRateLimiter(rateLimiterOptions);
  }

  /**
   * Enrich multiple people using the bulk enrichment endpoint
   */
  async enrichPeople(
    details: EnrichmentDetails[],
    revealEmails = true,
    revealPhones = false,
    webhookUrl?: string
  ): Promise<BulkEnrichmentResponse> {
    const url = `${this.baseUrl}/people/bulk_match`;

    const queryParams = new URLSearchParams({
      reveal_personal_emails: revealEmails.toString(),
      reveal_phone_number: revealPhones.toString(),
    });

    if (revealPhones && webhookUrl) {
      queryParams.append('webhook_url', webhookUrl);
    }

    try {
      // Apply rate limiting
      await this.rateLimiter.wait();

      ApolloLogger.info('Making Apollo bulk enrichment request', {
        operation: 'enrichPeople',
        batchSize: details.length,
        revealEmails,
        revealPhones,
      });

      const response = await fetch(`${url}?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({ details }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new ApolloApiError(
          `Apollo bulk enrichment API request failed`,
          response.status,
          responseText,
          { url, batchSize: details.length, revealEmails, revealPhones }
        );
      }

      const data = JSON.parse(responseText);
      
      ApolloLogger.info('Apollo bulk enrichment successful', {
        operation: 'enrichPeople',
        batchSize: details.length,
        matchesCount: data.matches?.length || 0,
      });

      return data;
    } catch (error) {
      if (error instanceof ApolloApiError) {
        ApolloLogger.error('Apollo bulk enrichment API request failed', error, {
          operation: 'enrichPeople',
          batchSize: details.length,
        });
        throw error;
      }
      
      ApolloLogger.error('Unexpected error during Apollo bulk enrichment', error, {
        operation: 'enrichPeople',
        batchSize: details.length,
      });
      throw new ApolloApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        undefined,
        { url, batchSize: details.length }
      );
    }
  }

  /**
   * Process unprocessed Apollo search results and enrich them
   */
  async processUnprocessedResults(
    limit = 100,
    userId?: string,
    options?: {
      revealPersonalEmails?: boolean;
      revealPhoneNumbers?: boolean;
      webhookUrl?: string;
    }
  ): Promise<{
    totalProcessed: number;
    companiesCreated: number;
    contactsCreated: number;
    errors: Array<{ resultId: string; error: string }>;
  }> {
    const {
      revealPersonalEmails = true,
      revealPhoneNumbers = false,
      webhookUrl,
    } = options || {};

    ApolloLogger.info('Fetching unprocessed Apollo search results', {
      operation: 'processUnprocessedResults',
      userId,
      limit,
      revealPersonalEmails,
      revealPhoneNumbers,
      webhookUrl: webhookUrl ? '***configured***' : 'none',
    });

    // Get unprocessed results (now using proper boolean type)
    const results = await db
      .select()
      .from(apolloSearchResults)
      .where(eq(apolloSearchResults.processed, false))
      .limit(limit);

    if (results.length === 0) {
      ApolloLogger.info('No unprocessed results found', {
        operation: 'processUnprocessedResults',
        userId,
      });
      return {
        totalProcessed: 0,
        companiesCreated: 0,
        contactsCreated: 0,
        errors: [],
      };
    }

    ApolloLogger.info(`Found ${results.length} unprocessed results`, {
      operation: 'processUnprocessedResults',
      userId,
      resultCount: results.length,
    });

    let companiesCreated = 0;
    let contactsCreated = 0;
    const errors: Array<{ resultId: string; error: string }> = [];

    // Process in batches of 10 (API limit)
    for (let i = 0; i < results.length; i += this.batchSize) {
      const batch = results.slice(i, i + this.batchSize);
      console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(results.length / this.batchSize)}...`);

      // Prepare enrichment details from raw responses
      const enrichmentDetails: EnrichmentDetails[] = batch.map((result) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = result.rawResponse as any;
        return {
          // Use Apollo person ID directly when available to improve match rate
          id: result.personId || undefined,
          first_name: result.firstName || undefined,
          last_name: raw?.last_name || undefined,
          name: raw?.name || undefined,
          email: raw?.email || undefined,
          organization_name: result.organizationName || undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          domain: (result.organizationData as any)?.primary_domain || undefined,
        };
      });

      try {
        // Enrich the batch with configured settings
        const enrichedData = await this.enrichPeople(
          enrichmentDetails,
          revealPersonalEmails,
          revealPhoneNumbers,
          webhookUrl
        );

        // Process each enriched person
        for (let j = 0; j < enrichedData.matches.length; j++) {
          const enrichedPerson = enrichedData.matches[j];
          const originalResult = batch[j];

          if (!enrichedPerson) {
            ApolloLogger.warn(`No match found for result`, {
              operation: 'processUnprocessedResults',
              userId,
              resultId: originalResult.id,
              personId: originalResult.personId,
            });
            continue;
          }

          try {
            // Create or update company
            let companyId: string;

            if (enrichedPerson.organization) {
              const org = enrichedPerson.organization;

              // Check if company already exists by name
              const existingCompanies = await db
                .select()
                .from(companiesTable)
                .where(eq(companiesTable.name, org.name))
                .limit(1);

              if (existingCompanies.length > 0) {
                companyId = existingCompanies[0].id;
                ApolloLogger.info(`Company already exists`, {
                  operation: 'processUnprocessedResults',
                  userId,
                  companyId,
                  companyName: org.name,
                });
              } else {
                // Create new company
                const [newCompany] = await db
                  .insert(companiesTable)
                  .values({
                    name: org.name,
                    city: org.city || undefined,
                    country: org.country || undefined,
                    size: org.estimated_num_employees
                      ? this.getCompanySizeRange(org.estimated_num_employees)
                      : undefined,
                    source: 'Apollo',
                    createdBy: userId,
                  })
                  .returning();

                companyId = newCompany.id;
                companiesCreated++;
                ApolloLogger.info(`Created company`, {
                  operation: 'processUnprocessedResults',
                  userId,
                  companyId,
                  companyName: org.name,
                });
              }
            } else {
              // No organization data, skip company creation
              companyId = originalResult.companyId!;
            }

            // Create or update contact
            // Skip placeholder/obfuscated emails such as apollo_...@placeholder.local
            const email = enrichedPerson.email;
            const isPlaceholderEmail =
              email &&
              email.toLowerCase().endsWith('@placeholder.local');

            if (email && !isPlaceholderEmail) {
              // Check if contact already exists by email
              const existingContacts = await db
                .select()
                .from(contactsTable)
                .where(eq(contactsTable.email, email))
                .limit(1);

              let contactId: string;

              if (existingContacts.length > 0) {
                // Update existing contact
                const [updatedContact] = await db
                  .update(contactsTable)
                  .set({
                    firstName: enrichedPerson.first_name,
                    lastName: enrichedPerson.last_name,
                    position: enrichedPerson.title || undefined,
                    companyId: companyId,
                    linkedinUrl: enrichedPerson.linkedin_url || undefined,
                    phone:
                      enrichedPerson.phone_numbers?.[0]?.sanitized_number ||
                      undefined,
                    isEmailVerified:
                      enrichedPerson.email_status === 'verified',
                    updatedAt: new Date(),
                  })
                  .where(eq(contactsTable.id, existingContacts[0].id))
                  .returning();

                contactId = updatedContact.id;
                ApolloLogger.info(`Updated contact`, {
                  operation: 'processUnprocessedResults',
                  userId,
                  contactId,
                  email,
                });
              } else {
                // Create new contact
                const [newContact] = await db
                  .insert(contactsTable)
                  .values({
                    firstName: enrichedPerson.first_name,
                    lastName: enrichedPerson.last_name,
                    email,
                    position: enrichedPerson.title || undefined,
                    companyId: companyId,
                    linkedinUrl: enrichedPerson.linkedin_url || undefined,
                    phone:
                      enrichedPerson.phone_numbers?.[0]?.sanitized_number ||
                      undefined,
                    isEmailVerified:
                      enrichedPerson.email_status === 'verified',
                    createdBy: userId,
                  })
                  .returning();

                contactId = newContact.id;
                contactsCreated++;
                ApolloLogger.info(`Created contact`, {
                  operation: 'processUnprocessedResults',
                  userId,
                  contactId,
                  email,
                });
              }

              // Mark the Apollo result as processed (now using boolean)
              await db
                .update(apolloSearchResults)
                .set({
                  processed: true,
                  companyId: companyId,
                  contactId: contactId,
                })
                .where(eq(apolloSearchResults.id, originalResult.id));

            } else {
              const reason = isPlaceholderEmail
                ? 'Placeholder Apollo email (ignored)'
                : 'No email found in enriched data';
              ApolloLogger.warn(`No usable email found for contact`, {
                operation: 'processUnprocessedResults',
                userId,
                resultId: originalResult.id,
                firstName: enrichedPerson.first_name,
                lastName: enrichedPerson.last_name,
                reason,
              });
              errors.push({
                resultId: originalResult.id,
                error: reason,
              });
            }

          } catch (error) {
            ApolloLogger.error(`Error processing result ${originalResult.id}`, error, {
              operation: 'processUnprocessedResults',
              userId,
              resultId: originalResult.id,
            });
            errors.push({
              resultId: originalResult.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Rate limiting is handled by rateLimiter.wait() in enrichPeople
        // But we add a small delay here for database operations
        if (i + this.batchSize < results.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

      } catch (error) {
        ApolloLogger.error(`Error enriching batch ${batchNumber}`, error, {
          operation: 'processUnprocessedResults',
          userId,
          batchNumber,
          batchSize: batch.length,
        });
        // Add all results in this batch to errors
        batch.forEach((result) => {
          errors.push({
            resultId: result.id,
            error: error instanceof Error ? error.message : 'Batch enrichment failed',
          });
        });
      }
    }

    ApolloLogger.info('Enrichment process completed', {
      operation: 'processUnprocessedResults',
      userId,
      totalProcessed: results.length,
      companiesCreated,
      contactsCreated,
      errorCount: errors.length,
    });

    return {
      totalProcessed: results.length,
      companiesCreated,
      contactsCreated,
      errors,
    };
  }

  /**
   * Helper to determine company size range from employee count
   */
  private getCompanySizeRange(employeeCount: number): string {
    if (employeeCount <= 10) return '1-10';
    if (employeeCount <= 50) return '11-50';
    if (employeeCount <= 200) return '51-200';
    if (employeeCount <= 500) return '201-500';
    if (employeeCount <= 1000) return '501-1000';
    if (employeeCount <= 5000) return '1001-5000';
    if (employeeCount <= 10000) return '5001-10000';
    return '10000+';
  }
}

// Main execution
async function main() {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    console.error('Error: APOLLO_API_KEY environment variable is not set.');
    console.error('Please add APOLLO_API_KEY to your .env file.');
    process.exit(1);
  }

  console.log('Starting Apollo enrichment process...\n');

  const service = new ApolloEnrichmentService(apiKey);

  // Process up to 100 unprocessed results
  const result = await service.processUnprocessedResults(100);

  console.log('\n=== Enrichment Summary ===');
  console.log(`Total results processed: ${result.totalProcessed}`);
  console.log(`Companies created: ${result.companiesCreated}`);
  console.log(`Contacts created: ${result.contactsCreated}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors encountered: ${result.errors.length}`);
    result.errors.forEach((error) => {
      console.log(`  - Result ${error.resultId}: ${error.error}`);
    });
  }

  console.log('\nEnrichment process completed!');
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
