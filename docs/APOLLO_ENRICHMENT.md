# Apollo People Enrichment Guide

## Overview

The Apollo People Enrichment feature allows you to enrich contact data from the Apollo search results table with full contact information including emails, phone numbers, and complete organization details. This data is then automatically added to your main companies and contacts tables.

## How It Works

1. **Data Source**: The enrichment process reads from the `apollo_search_results` table, which contains partial data from Apollo API searches
2. **Enrichment**: Uses Apollo's Bulk People Enrichment API to get complete contact information
3. **Data Storage**: Creates or updates records in your main `companies` and `contacts` tables
4. **Status Tracking**: Marks processed results to avoid duplicate enrichment

## Usage

### Method 1: Via UI (Recommended)

1. Navigate to the Apollo Results page in your dashboard
2. Click the "Enrich Data" button in the top-right corner
3. The system will process up to 100 unprocessed results
4. A toast notification will show the results

### Method 2: Via Command Line

Run the enrichment script directly:

```bash
npx tsx scripts/enrich-apollo-results.ts
```

### Method 3: Via API

Make a POST request to the enrichment endpoint:

```bash
curl -X POST http://localhost:3000/api/apollo-results/enrich \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

## Configuration

### Environment Variables

The enrichment feature requires the following environment variable:

```bash
APOLLO_API_KEY=your_apollo_api_key_here
```

Add this to your `.env` or `.env.local` file.

### API Rate Limits

- The Bulk People Enrichment endpoint has a rate limit of **50% of the People Enrichment endpoint's per-minute rate**
- Processes up to **10 people per API call** (batch size)
- The script automatically adds 1-second delays between batches to avoid rate limiting

## Features

### Automatic Company Creation/Update

When enriching contact data, the system:

1. Checks if a company with the same name already exists
2. Creates a new company if it doesn't exist with:
   - Company name
   - Location (city, country)
   - Employee count range
   - Source marked as "Apollo"
3. Updates existing companies if found

### Automatic Contact Creation/Update

For each enriched person:

1. Checks if a contact with the same email already exists
2. Creates a new contact if it doesn't exist with:
   - First and last name
   - Email address
   - Job title
   - Phone number (if available)
   - LinkedIn URL (if available)
   - Company association
   - Email verification status
3. Updates existing contacts if found

### Data Enrichment Details

The enrichment process retrieves:

- ✅ Full first and last names
- ✅ Verified email addresses
- ✅ Job titles
- ✅ Phone numbers (optional, requires webhook)
- ✅ LinkedIn profiles
- ✅ Complete organization data
- ✅ Email verification status

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "totalProcessed": 50,
    "companiesCreated": 12,
    "contactsCreated": 45,
    "errors": []
  },
  "message": "Processed 50 results. Created 12 companies and 45 contacts."
}
```

### Error Response

```json
{
  "error": "Failed to enrich Apollo results",
  "message": "Detailed error message here"
}
```

## Credit Usage

⚠️ **Important**: Using the enrichment feature consumes Apollo API credits based on your pricing plan.

- Each enriched person with email reveal consumes credits
- To view credit usage, visit: https://app.apollo.io/#/settings/credits
- For detailed pricing information: https://www.apollo.io/pricing

## GDPR Compliance

Apollo will not reveal personal emails for people residing in GDPR-compliant regions, even if `reveal_personal_emails` is set to true.

## Phone Number Enrichment

To enrich phone numbers:

1. Set `reveal_phone_number: true` in the API call
2. Provide a `webhook_url` parameter (required when revealing phone numbers)
3. Phone numbers will be delivered asynchronously to your webhook

**Note**: The current implementation does not enable phone number enrichment by default. To enable it, modify the script to include webhook handling.

## Troubleshooting

### No Results Enriched

**Problem**: The enrichment runs but no contacts are created.

**Solutions**:
- Check that there are unprocessed results: Filter by "Not Processed" in the Apollo Results table
- Verify your Apollo API key is correct
- Check the console logs for detailed error messages

### API Key Not Configured

**Problem**: Error message about missing API key.

**Solution**: Add `APOLLO_API_KEY` to your `.env` file and restart the development server:

```bash
APOLLO_API_KEY=your_actual_key_here
```

### Rate Limit Errors

**Problem**: API returns 429 (Too Many Requests).

**Solution**:
- The script automatically handles rate limiting with delays
- Reduce the batch size if needed
- Wait a few minutes before retrying

### Duplicate Contacts

**Problem**: Same contact appears multiple times.

**Solution**:
- The system checks for existing emails before creating new contacts
- Duplicates might occur if emails are different
- Review and merge duplicates manually in the Contacts table

## Database Schema

### Apollo Search Results Table

```typescript
{
  id: uuid
  personId: string          // Apollo person ID
  firstName: string
  lastNameObfuscated: string
  title: string
  organizationName: string
  organizationData: jsonb
  hasEmail: string          // 'true' or 'false'
  rawResponse: jsonb
  processed: string         // 'true' or 'false'
  companyId: uuid          // Reference to created company
  contactId: uuid          // Reference to created contact
  createdAt: timestamp
}
```

### Contacts Table

```typescript
{
  id: uuid
  firstName: string
  lastName: string
  email: string (unique)
  phone: string
  position: string
  companyId: uuid
  linkedinUrl: string
  isEmailVerified: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Companies Table

```typescript
{
  id: uuid
  name: string
  size: string              // e.g., "1-10", "11-50"
  city: string
  country: string
  source: string            // "Apollo"
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Best Practices

1. **Run enrichment during off-peak hours** to minimize impact on rate limits
2. **Process in batches** - Don't try to enrich thousands of results at once
3. **Monitor credit usage** in your Apollo account
4. **Review enriched data** periodically for quality
5. **Clean up processed results** to keep your database manageable

## API Reference

### POST /api/apollo-results/enrich

Enrich unprocessed Apollo search results.

**Request Body:**
```json
{
  "limit": 100  // Optional, defaults to 100, max 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProcessed": 50,
    "companiesCreated": 12,
    "contactsCreated": 45,
    "errors": []
  },
  "message": "Success message"
}
```

### GET /api/apollo-results/enrich

Check enrichment configuration status.

**Response:**
```json
{
  "configured": true,
  "message": "Apollo enrichment is configured and ready to use"
}
```

## Advanced Usage

### Custom Batch Size

To modify the batch size, edit the `ApolloEnrichmentService` class:

```typescript
private batchSize = 10; // Change this value (max 10 per API docs)
```

### Webhook for Phone Numbers

To enable phone number enrichment with webhook:

```typescript
const result = await service.enrichPeople(
  enrichmentDetails,
  true,  // reveal emails
  true,  // reveal phone numbers
  'https://your-webhook-url.com/apollo-phone-callback'
);
```

## Support

For issues related to:
- **Apollo API**: Contact Apollo.io support
- **Script/Implementation**: Check the logs and refer to this documentation
- **Database issues**: Verify your database schema matches the expected structure

## Next Steps

After enriching your data:

1. Review enriched contacts in the Contacts table
2. Verify email addresses if needed
3. Create marketing campaigns targeting enriched contacts
4. Set up follow-up sequences
5. Monitor email deliverability and engagement

---

**Last Updated**: January 2026
