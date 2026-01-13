import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { ApolloEnrichmentService } from '@/scripts/enrich-apollo-results';
import { apolloEnrichmentRequestSchema } from '@/lib/apollo/validation';
import { ApolloApiError } from '@/lib/apollo/errors';
import { ApolloLogger } from '@/lib/apollo/logger';

/**
 * POST /api/apollo-results/enrich
 *
 * Enrich Apollo search results with full contact details including emails
 */
export async function POST(request: Request) {
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

    // Check if Apollo API key is configured
    const apolloApiKey = process.env.APOLLO_API_KEY;
    if (!apolloApiKey) {
      return NextResponse.json(
        { error: 'Apollo API key is not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body with Zod
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validationResult = apolloEnrichmentRequestSchema.safeParse(body);
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
      limit,
      revealPersonalEmails,
      revealPhoneNumbers,
      webhookUrl,
    } = validationResult.data;

    // Create enrichment service
    const service = new ApolloEnrichmentService(apolloApiKey);

    ApolloLogger.info('Starting enrichment process', {
      operation: 'POST /api/apollo-results/enrich',
      userId: session.user.id,
      limit,
      revealPersonalEmails,
      revealPhoneNumbers,
    });

    // Process unprocessed results with enrichment settings
    const result = await service.processUnprocessedResults(
      limit,
      session.user.id,
      {
        revealPersonalEmails,
        revealPhoneNumbers,
        webhookUrl,
      }
    );

    ApolloLogger.info('Enrichment process completed', {
      operation: 'POST /api/apollo-results/enrich',
      userId: session.user.id,
      result,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.totalProcessed} results. Created ${result.companiesCreated} companies and ${result.contactsCreated} contacts.`,
    });

  } catch (error) {
    ApolloLogger.error('Error enriching Apollo results', error, {
      operation: 'POST /api/apollo-results/enrich',
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

    return NextResponse.json(
      {
        error: 'Failed to enrich Apollo results',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/apollo-results/enrich
 *
 * Get enrichment status and configuration
 */
export async function GET() {
  try {
    const isConfigured = !!process.env.APOLLO_API_KEY;

    return NextResponse.json({
      configured: isConfigured,
      message: isConfigured
        ? 'Apollo enrichment is configured and ready to use'
        : 'Apollo API key is not configured. Add APOLLO_API_KEY to your environment variables.',
    });
  } catch (error) {
    console.error('Error checking enrichment status:', error);
    return NextResponse.json(
      { error: 'Failed to check enrichment status' },
      { status: 500 }
    );
  }
}
