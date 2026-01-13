# Apollo Scraping & Enrichment Improvements

This document outlines the improvements made to the Apollo scraping and enrichment system.

## Summary of Changes

### 1. **Schema Improvements** ✅
- **Fixed Boolean Fields**: Changed `hasEmail`, `hasCity`, `hasState`, `hasCountry`, `hasDirectPhone`, and `processed` from `varchar` (storing 'true'/'false' strings) to proper `boolean` columns
- **Benefits**: 
  - Type safety in TypeScript
  - Cleaner queries (no string comparisons)
  - Better database performance
  - Reduced risk of bugs from string typos

### 2. **Zod Validation** ✅
- **Created**: `lib/apollo/validation.ts` with comprehensive schemas
- **Schemas**:
  - `apolloSearchParamsSchema` - Validates search parameters
  - `apolloScriptRequestSchema` - Validates API script requests
  - `apolloEnrichmentRequestSchema` - Validates enrichment requests
- **Benefits**:
  - Type-safe request validation
  - Automatic error messages for invalid inputs
  - Prevents invalid API calls
  - Better developer experience with autocomplete

### 3. **Rate Limiting Utility** ✅
- **Created**: `lib/apollo/rate-limiter.ts`
- **Features**:
  - Configurable delay between requests
  - Requests-per-minute tracking
  - Automatic cleanup of old timestamps
  - Prevents hitting Apollo API rate limits
- **Usage**: Automatically applied in `ApolloScraper` and `ApolloEnrichmentService`

### 4. **Enhanced Error Handling** ✅
- **Created**: `lib/apollo/errors.ts` with custom error classes
- **Error Types**:
  - `ApolloApiError` - API-specific errors with status codes and context
  - `ApolloValidationError` - Validation errors
  - `ApolloDatabaseError` - Database operation errors
- **Features**:
  - User-friendly error messages
  - Error type detection (rate limit, client error, server error)
  - Rich context for debugging
  - Better error propagation

### 5. **Structured Logging** ✅
- **Created**: `lib/apollo/logger.ts`
- **Features**:
  - Timestamped logs
  - Contextual information (userId, operation, pageNumber, etc.)
  - Progress tracking for long operations
  - Error logging with stack traces
- **Benefits**:
  - Easier debugging in production
  - Better observability
  - Consistent log format

### 6. **Database Transactions** ✅
- **Added**: Transaction support in `saveToDatabase` method
- **Benefits**:
  - Atomic operations (all-or-nothing)
  - Data consistency
  - Better error recovery

### 7. **API Route Improvements** ✅
- **Updated**: `/api/scripts/apollo` and `/api/apollo-results/enrich`
- **Changes**:
  - Zod validation for all requests
  - Better error handling with custom error classes
  - Structured logging
  - Proper authentication checks
  - User-friendly error messages

## Migration Required

⚠️ **Important**: The schema changes require a database migration.

Run the following commands to generate and apply the migration:

```bash
npm run db:generate
npm run db:migrate
```

The migration will:
- Change `has_email`, `has_city`, `has_state`, `has_country`, `has_direct_phone` from `varchar` to `boolean`
- Change `processed` from `varchar` to `boolean`
- Convert existing 'true'/'false' strings to boolean values

## Usage Examples

### Using the Improved ApolloScraper

```typescript
import { ApolloScraper } from '@/scripts/apollo-scraper';

const scraper = new ApolloScraper(apiKey, userId, {
  delayMs: 1000,           // 1 second delay between requests
  requestsPerMinute: 60   // Max 60 requests per minute
});

const result = await scraper.run({
  personTitles: ['CEO', 'CTO'],
  companyLocations: ['United States'],
  perPage: 25,
}, 5); // Process 5 pages
```

### Using the Improved ApolloEnrichmentService

```typescript
import { ApolloEnrichmentService } from '@/scripts/enrich-apollo-results';

const service = new ApolloEnrichmentService(apiKey, {
  delayMs: 1000,
  requestsPerMinute: 60
});

const result = await service.processUnprocessedResults(100, userId, {
  revealPersonalEmails: true,
  revealPhoneNumbers: false,
});
```

### API Request with Validation

```typescript
// Frontend example
const response = await fetch('/api/scripts/apollo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    personTitles: ['CEO'],
    companyLocations: ['United States'],
    maxPages: 5,
    perPage: 25,
    autoEnrich: true,
    enrichmentSettings: {
      revealPersonalEmails: true,
      revealPhoneNumbers: false,
    },
  }),
});

// Invalid requests will return 400 with validation errors
if (!response.ok) {
  const error = await response.json();
  console.error('Validation errors:', error.details);
}
```

## Error Handling

### Custom Error Classes

```typescript
import { ApolloApiError } from '@/lib/apollo/errors';

try {
  await scraper.searchPeople(params);
} catch (error) {
  if (error instanceof ApolloApiError) {
    if (error.isRateLimit()) {
      // Handle rate limit - wait and retry
    } else if (error.isClientError()) {
      // Handle client error (bad request, auth, etc.)
    } else if (error.isServerError()) {
      // Handle server error - retry later
    }
    
    // Get user-friendly message
    console.error(error.getUserMessage());
  }
}
```

## Logging

All operations now use structured logging:

```typescript
import { ApolloLogger } from '@/lib/apollo/logger';

ApolloLogger.info('Operation started', {
  operation: 'searchPeople',
  userId: 123,
  pageNumber: 1,
});

ApolloLogger.progress(5, 10, 'Processing pages', {
  operation: 'run',
  userId: 123,
});

ApolloLogger.error('Operation failed', error, {
  operation: 'searchPeople',
  userId: 123,
});
```

## Benefits Summary

1. **Type Safety**: Proper TypeScript types throughout
2. **Reliability**: Better error handling and recovery
3. **Observability**: Structured logging for debugging
4. **Performance**: Proper boolean types and transactions
5. **Developer Experience**: Zod validation with clear error messages
6. **Maintainability**: Cleaner, more organized code

## Next Steps

1. Run database migration (see above)
2. Test the improved error handling
3. Monitor logs in production
4. Consider adding metrics/telemetry for API usage
5. Add retry logic for transient errors (future improvement)
