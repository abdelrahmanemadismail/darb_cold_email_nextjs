/**
 * Apollo.io Data Scraper Script
 *
 * This script integrates with Apollo.io API to fetch companies and contacts
 * based on search criteria and save them to the database.
 *
 * NOTE: The People API Search endpoint does not return email addresses or full last names.
 * It returns obfuscated data and boolean flags for data availability.
 * To get full contact data, you would need to use the People Enrichment endpoint separately.
 */

import { db } from '@/db';
import { companies as companiesTable } from '@/db/schema/companies';
import { apolloSearchResults } from '@/db/schema/apollo-search-results';
import { eq } from 'drizzle-orm';
import { ApolloRateLimiter } from '@/lib/apollo/rate-limiter';
import { ApolloApiError } from '@/lib/apollo/errors';
import { ApolloLogger } from '@/lib/apollo/logger';
import type { ApolloSearchParams } from '@/lib/apollo/validation';

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name_obfuscated?: string;
  title: string;
  last_refreshed_at?: string;
  has_email: boolean;
  has_city: boolean;
  has_state: boolean;
  has_country: boolean;
  has_direct_phone?: string;
  organization: {
    name: string;
    has_industry: boolean;
    has_phone: boolean;
    has_city: boolean;
    has_state: boolean;
    has_country: boolean;
    has_zip_code: boolean;
    has_revenue: boolean;
    has_employee_count: boolean;
  };
}

interface ApolloSearchResponse {
  people: ApolloPerson[];
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export class ApolloScraper {
  private apiKey: string;
  // Base URL must include `/api` to match Apollo docs, e.g. https://api.apollo.io/api/v1/...
  private baseUrl = 'https://api.apollo.io/api/v1';
  private userId?: number;
  private rateLimiter: ApolloRateLimiter;

  constructor(apiKey: string, userId?: number, rateLimiterOptions?: { delayMs?: number; requestsPerMinute?: number }) {
    this.apiKey = apiKey;
    this.userId = userId;
    this.rateLimiter = new ApolloRateLimiter(rateLimiterOptions);
  }

  /**
   * Search for people and companies on Apollo.io
   */
  async searchPeople(params: ApolloSearchParams): Promise<ApolloSearchResponse> {
    const url = `${this.baseUrl}/mixed_people/api_search`;

    // Build request body with only non-empty arrays
    const body: Record<string, unknown> = {
      page: params.page || 1,
      per_page: params.perPage || 25,
    };

    if (params.personTitles && params.personTitles.length > 0) {
      body.person_titles = params.personTitles;
    }

    if (params.personLocations && params.personLocations.length > 0) {
      body.person_locations = params.personLocations;
    }

    if (params.companyLocations && params.companyLocations.length > 0) {
      body.organization_locations = params.companyLocations;
    }

    if (params.employeeRanges && params.employeeRanges.length > 0) {
      body.organization_num_employees_ranges = params.employeeRanges;
    }

    if (params.contactEmailStatus && params.contactEmailStatus.length > 0) {
      // Normalize to Apollo-supported statuses: verified, unverified, likely to engage, unavailable
      const allowedStatuses = new Set([
        'verified',
        'unverified',
        'likely to engage',
        'unavailable',
      ]);

      const normalizedStatuses = params.contactEmailStatus
        .map((s) => s.toLowerCase())
        .filter((s) => allowedStatuses.has(s));

      if (normalizedStatuses.length > 0) {
        body.contact_email_status = normalizedStatuses;
      }
    }

    try {
      // Apply rate limiting
      await this.rateLimiter.wait();

      ApolloLogger.info('Making Apollo API search request', {
        operation: 'searchPeople',
        userId: this.userId,
        page: params.page,
        perPage: params.perPage,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new ApolloApiError(
          `Apollo API request failed`,
          response.status,
          responseText,
          { url, params, userId: this.userId }
        );
      }

      const data = JSON.parse(responseText);
      
      ApolloLogger.info('Apollo API search successful', {
        operation: 'searchPeople',
        userId: this.userId,
        page: params.page,
        peopleCount: data.people?.length || 0,
      });

      return data;
    } catch (error) {
      if (error instanceof ApolloApiError) {
        ApolloLogger.error('Apollo API request failed', error, {
          operation: 'searchPeople',
          userId: this.userId,
          page: params.page,
        });
        throw error;
      }
      
      ApolloLogger.error('Unexpected error during Apollo API request', error, {
        operation: 'searchPeople',
        userId: this.userId,
        page: params.page,
      });
      throw new ApolloApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        undefined,
        { url, params, userId: this.userId }
      );
    }
  }

  /**
   * Save raw API search results to database
   */
  async saveRawResults(
    data: ApolloSearchResponse,
    searchParams: ApolloSearchParams,
    pageNumber: number
  ): Promise<number> {
    let savedCount = 0;
    const errors: Array<{ personId: string; error: string }> = [];

    ApolloLogger.info('Saving raw Apollo search results', {
      operation: 'saveRawResults',
      userId: this.userId,
      pageNumber,
      peopleCount: data.people.length,
    });

    for (const person of data.people) {
      try {
        // Check if this person ID already exists
        const existing = await db
          .select()
          .from(apolloSearchResults)
          .where(eq(apolloSearchResults.personId, person.id))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(apolloSearchResults).values({
            searchParams: searchParams as unknown as Record<string, unknown>,
            personId: person.id,
            firstName: person.first_name,
            lastNameObfuscated: person.last_name_obfuscated || null,
            title: person.title,
            organizationName: person.organization.name,
            organizationData: person.organization as unknown as Record<string, unknown>,
            // Now using proper booleans instead of strings
            hasEmail: person.has_email ?? null,
            hasCity: person.has_city ?? null,
            hasState: person.has_state ?? null,
            hasCountry: person.has_country ?? null,
            hasDirectPhone: person.has_direct_phone ? true : null,
            rawResponse: person as unknown as Record<string, unknown>,
            lastRefreshedAt: person.last_refreshed_at || null,
            pageNumber: pageNumber,
            processed: false,
            createdBy: this.userId ? String(this.userId) : undefined,
          });
          savedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ personId: person.id, error: errorMessage });
        ApolloLogger.error(
          `Error saving raw result for person ${person.id}`,
          error,
          {
            operation: 'saveRawResults',
            userId: this.userId,
            personId: person.id,
            pageNumber,
          }
        );
      }
    }

    if (errors.length > 0) {
      ApolloLogger.warn(`Failed to save ${errors.length} raw results`, {
        operation: 'saveRawResults',
        userId: this.userId,
        pageNumber,
        errorCount: errors.length,
      });
    }

    ApolloLogger.info(`Saved ${savedCount} raw results`, {
      operation: 'saveRawResults',
      userId: this.userId,
      pageNumber,
      savedCount,
      skippedCount: data.people.length - savedCount - errors.length,
    });

    return savedCount;
  }

  /**
   * Save companies and contacts to database
   * NOTE: Apollo API Search endpoint returns obfuscated data.
   * We create placeholder emails for contacts since the API doesn't return real emails.
   */
  async saveToDatabase(data: ApolloSearchResponse): Promise<{ companies: number; contacts: number }> {
    let companiesCreated = 0;
    const contactsCreated = 0; // Contacts are not created from search results (see comment below)
    const errors: Array<{ personId: string; error: string }> = [];

    ApolloLogger.info('Saving companies to database', {
      operation: 'saveToDatabase',
      userId: this.userId,
      peopleCount: data.people.length,
    });

    // Use transaction for atomic operations per person
    for (const person of data.people) {
      try {
        await db.transaction(async (tx) => {
          // Save or update company
          let companyId: string;

          const existingCompany = await tx
            .select()
            .from(companiesTable)
            .where(eq(companiesTable.name, person.organization.name))
            .limit(1);

          if (existingCompany.length > 0) {
            companyId = existingCompany[0].id;

            // Update company with latest data
            await tx
              .update(companiesTable)
              .set({
                source: 'Apollo',
                updatedAt: new Date(),
              })
              .where(eq(companiesTable.id, companyId));
          } else {
            // Create new company
            const [newCompany] = await tx
              .insert(companiesTable)
              .values({
                name: person.organization.name,
                source: 'Apollo',
                createdBy: this.userId ? String(this.userId) : undefined,
              })
              .returning();

            companyId = newCompany.id;
            companiesCreated++;
          }

          // IMPORTANT: Do NOT create contacts from search results because the
          // People API Search endpoint does NOT return real emails.
          // Contacts (with real emails) are created later by the enrichment flow.
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ personId: person.id, error: errorMessage });
        ApolloLogger.error(
          `Error saving person ${person.first_name} (${person.id})`,
          error,
          {
            operation: 'saveToDatabase',
            userId: this.userId,
            personId: person.id,
          }
        );
        // Continue with next person even if one fails
      }
    }

    if (errors.length > 0) {
      ApolloLogger.warn(`Failed to save ${errors.length} people`, {
        operation: 'saveToDatabase',
        userId: this.userId,
        errorCount: errors.length,
      });
    }

    ApolloLogger.info('Database save completed', {
      operation: 'saveToDatabase',
      userId: this.userId,
      companiesCreated,
      contactsCreated,
      errorCount: errors.length,
    });

    return { companies: companiesCreated, contacts: contactsCreated };
  }

  /**
   * Run the full scraping process
   */
  async run(params: ApolloSearchParams, maxPages: number = 1): Promise<{
    totalCompanies: number;
    totalContacts: number;
    totalRawResults: number;
    pagesProcessed: number;
  }> {
    const startTime = Date.now();
    let totalCompanies = 0;
    let totalContacts = 0;
    let totalRawResults = 0;
    let currentPage = params.page || 1;
    const startPage = currentPage;

    ApolloLogger.info('Starting Apollo scraping process', {
      operation: 'run',
      userId: this.userId,
      params,
      maxPages,
      startPage: currentPage,
    });

    try {
      for (let i = 0; i < maxPages; i++) {
        ApolloLogger.progress(i + 1, maxPages, `Processing page ${currentPage}`, {
          operation: 'run',
          userId: this.userId,
          pageNumber: currentPage,
        });

        const data = await this.searchPeople({ ...params, page: currentPage });

        if (data.people.length === 0) {
          ApolloLogger.info('No more results found, stopping pagination', {
            operation: 'run',
            userId: this.userId,
            pageNumber: currentPage,
          });
          break;
        }

        // Save raw results first
        const rawSaved = await this.saveRawResults(data, params, currentPage);
        totalRawResults += rawSaved;

        const result = await this.saveToDatabase(data);
        totalCompanies += result.companies;
        totalContacts += result.contacts;

        ApolloLogger.info(`Page ${currentPage} completed`, {
          operation: 'run',
          userId: this.userId,
          pageNumber: currentPage,
          companiesCreated: result.companies,
          contactsCreated: result.contacts,
          rawResultsSaved: rawSaved,
        });

        // Check pagination limits
        if (data.pagination && currentPage >= data.pagination.total_pages) {
          ApolloLogger.info('Reached last page according to pagination info', {
            operation: 'run',
            userId: this.userId,
            pageNumber: currentPage,
            totalPages: data.pagination.total_pages,
          });
          break;
        }

        // If no pagination info, just process the requested pages
        if (!data.pagination) {
          ApolloLogger.warn('No pagination info available, continuing with requested pages', {
            operation: 'run',
            userId: this.userId,
            pageNumber: currentPage,
          });
        }

        currentPage++;

        // Rate limiting is handled by rateLimiter.wait() in searchPeople
        // But we add a small delay here for database operations
        if (i < maxPages - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const duration = Date.now() - startTime;
      const pagesProcessed = currentPage - startPage;

      ApolloLogger.info('Apollo scraping process completed', {
        operation: 'run',
        userId: this.userId,
        totalCompanies,
        totalContacts,
        totalRawResults,
        pagesProcessed,
        durationMs: duration,
      });

      return {
        totalCompanies,
        totalContacts,
        totalRawResults,
        pagesProcessed,
      };
    } catch (error) {
      ApolloLogger.error('Apollo scraping process failed', error, {
        operation: 'run',
        userId: this.userId,
        pagesProcessed: currentPage - startPage,
      });
      throw error;
    }
  }
}

/**
 * Example usage:
 *
 * const scraper = new ApolloScraper(process.env.APOLLO_API_KEY!, userId);
 * const result = await scraper.run({
 *   personTitles: ['CEO', 'CTO', 'Founder'],
 *   companyLocations: ['United States'],
 *   industries: ['Computer Software', 'Information Technology'],
 *   companyHeadcountMin: 10,
 *   companyHeadcountMax: 500,
 * }, 5); // Process 5 pages max
 */
