import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { ApolloScraper } from '@/scripts/apollo-scraper';
import { ApolloEnrichmentService } from '@/scripts/enrich-apollo-results';
import { apolloScriptRequestSchema } from '@/lib/apollo/validation';
import { ApolloApiError } from '@/lib/apollo/errors';
import { ApolloLogger } from '@/lib/apollo/logger';

/**
 * POST /api/scripts/apollo
 * Run Apollo.io scraping script
 */
export async function POST(req: NextRequest) {
  try {
    // Get auth session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions (assuming admin/manager can run scripts)
    // You may want to add proper permission checking here
    const userRole = session.user.role;
    if (!userRole || !['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get Apollo API key from environment
    const apolloApiKey = process.env.APOLLO_API_KEY;
    if (!apolloApiKey) {
      return NextResponse.json(
        { error: 'Apollo API key not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body with Zod
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validationResult = apolloScriptRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      personTitles,
      personLocations,
      companyLocations,
      employeeRanges,
      contactEmailStatus,
      maxPages,
      perPage,
      autoEnrich,
      enrichmentSettings,
    } = validationResult.data;

    // Create scraper instance
    const scraper = new ApolloScraper(apolloApiKey, parseInt(session.user.id));

    // Run the scraping process
    const result = await scraper.run(
      {
        personTitles,
        personLocations,
        companyLocations,
        employeeRanges,
        contactEmailStatus,
        perPage,
      },
      maxPages
    );

    // Auto-enrich if requested
    let enrichmentResult = null;
    if (autoEnrich && result.totalRawResults > 0) {
      try {
        console.log('Auto-enriching results with settings:', enrichmentSettings);
        const enrichmentService = new ApolloEnrichmentService(apolloApiKey);

        enrichmentResult = await enrichmentService.processUnprocessedResults(
          result.totalRawResults,
          session.user.id,
          {
            revealPersonalEmails: enrichmentSettings?.revealPersonalEmails ?? true,
            revealPhoneNumbers: enrichmentSettings?.revealPhoneNumbers ?? false,
            webhookUrl: enrichmentSettings?.webhookUrl,
          }
        );

        console.log('Auto-enrichment completed:', enrichmentResult);
      } catch (enrichError) {
        console.error('Auto-enrichment failed:', enrichError);
        // Don't fail the whole request if enrichment fails
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      enrichment: enrichmentResult,
      message: enrichmentResult
        ? `Successfully saved ${result.totalRawResults} raw results and enriched ${enrichmentResult.contactsCreated} contacts from ${enrichmentResult.companiesCreated} companies`
        : `Successfully saved ${result.totalRawResults} raw results, created ${result.totalContacts} contacts from ${result.totalCompanies} companies`,
    });

  } catch (error: unknown) {
    ApolloLogger.error('Apollo script execution failed', error, {
      operation: 'POST /api/scripts/apollo',
    });

    if (error instanceof ApolloApiError) {
      return NextResponse.json(
        {
          error: 'Apollo API error',
          message: error.getUserMessage(),
          statusCode: error.statusCode,
        },
        { status: error.isClientError() ? error.statusCode : 500 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Script execution failed',
        message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scripts/apollo
 * Get available Apollo search options and configuration
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Apollo API key is configured
    const isConfigured = !!process.env.APOLLO_API_KEY;

    return NextResponse.json({
      configured: isConfigured,
      options: {
        commonTitles: [
          'CEO',
          'CTO',
          'CFO',
          'COO',
          'Founder',
          'Co-Founder',
          'VP of Sales',
          'VP of Marketing',
          'Head of Growth',
          'Director of Marketing',
          'Director of Sales',
          'Marketing Manager',
          'Sales Manager',
        ],
        commonLocations: [
          'United States',
          'United Kingdom',
          'Canada',
          'Australia',
          'Germany',
          'France',
          'Netherlands',
          'Spain',
          'Italy',
          'Switzerland',
          'Sweden',
          'Norway',
          'Denmark',
          'Finland',
          'Belgium',
          'Austria',
          'Ireland',
          'Portugal',
          'Poland',
          'Czech Republic',
          'Romania',
          'Greece',
          'Hungary',
          'India',
          'Singapore',
          'China',
          'Japan',
          'South Korea',
          'Hong Kong',
          'Taiwan',
          'Thailand',
          'Malaysia',
          'Indonesia',
          'Philippines',
          'Vietnam',
          'United Arab Emirates',
          'Saudi Arabia',
          'Israel',
          'Turkey',
          'South Africa',
          'Egypt',
          'Nigeria',
          'Kenya',
          'Brazil',
          'Mexico',
          'Argentina',
          'Chile',
          'Colombia',
          'Peru',
          'New Zealand',
          'Russia',
          'Ukraine',
          'Pakistan',
          'Bangladesh',
        ],
        headcountRanges: [
          { label: '1-10', min: 1, max: 10 },
          { label: '11-50', min: 11, max: 50 },
          { label: '51-200', min: 51, max: 200 },
          { label: '201-500', min: 201, max: 500 },
          { label: '501-1000', min: 501, max: 1000 },
          { label: '1001-5000', min: 1001, max: 5000 },
          { label: '5001+', min: 5001, max: 100000 },
        ],
      },
    });

  } catch (error) {
    console.error('Apollo config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
