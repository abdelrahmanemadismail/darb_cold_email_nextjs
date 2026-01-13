# Apollo.io Integration

This project now includes Apollo.io integration for automated data collection of companies and contacts.

## Setup

1. **Get your Apollo.io API Key**
   - Go to [Apollo.io Settings](https://app.apollo.io/#/settings/integrations/api)
   - Generate an API key
   - Copy the API key

2. **Configure Environment Variable**
   ```bash
   # Add to your .env or .env.local file
   APOLLO_API_KEY=your_apollo_api_key_here
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Usage

### Via Dashboard UI

1. Navigate to **Dashboard > Scripts**
2. Click **"Run Apollo Script"** button
3. Configure your search criteria:
   - **Job Titles**: CEO, CTO, Founder, etc.
   - **Locations**: United States, California, etc.
   - **Industries**: Computer Software, SaaS, etc.
   - **Company Size**: Select employee count range
   - **Max Pages**: Number of pages to scrape (25 results per page)
4. Click **"Run Script"**

The script will:
- Search Apollo.io based on your criteria
- Automatically create/update companies in your database
- Automatically create/update contacts in your database
- Link contacts to their respective companies

### Programmatic Usage

You can also use the scraper programmatically in your own scripts:

```typescript
import { ApolloScraper } from '@/scripts/apollo-scraper';

const scraper = new ApolloScraper(process.env.APOLLO_API_KEY!, userId);

const result = await scraper.run({
  personTitles: ['CEO', 'CTO', 'Founder'],
  companyLocations: ['United States'],
  industries: ['Computer Software', 'Information Technology'],
  companyHeadcountMin: 10,
  companyHeadcountMax: 500,
}, 5); // Process 5 pages max

console.log(`Scraped ${result.totalContacts} contacts from ${result.totalCompanies} companies`);
```

## API Endpoints

### GET /api/scripts/apollo
Get Apollo configuration and available options

**Response:**
```json
{
  "configured": true,
  "options": {
    "commonTitles": ["CEO", "CTO", ...],
    "commonIndustries": ["Computer Software", ...],
    "headcountRanges": [...]
  }
}
```

### POST /api/scripts/apollo
Run Apollo scraping script

**Request Body:**
```json
{
  "personTitles": ["CEO", "CTO"],
  "companyLocations": ["United States"],
  "industries": ["Computer Software"],
  "companyHeadcountMin": 10,
  "companyHeadcountMax": 500,
  "maxPages": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCompanies": 45,
    "totalContacts": 120,
    "pagesProcessed": 5
  },
  "message": "Successfully scraped 120 contacts from 45 companies"
}
```

## Features

- ✅ Search by job titles, locations, industries, and company size
- ✅ Automatic deduplication (checks existing companies and contacts)
- ✅ Updates existing records with latest data
- ✅ Links contacts to companies automatically
- ✅ Rate limiting to respect API limits
- ✅ Error handling and logging
- ✅ Permission-based access control

## Rate Limits

Be mindful of Apollo.io API rate limits:
- Free tier: 50 credits/month
- Paid plans: Higher limits

Each search result consumes credits, so adjust `maxPages` accordingly.

## Troubleshooting

### "Apollo API key not configured"
Make sure `APOLLO_API_KEY` is set in your `.env` file and restart the dev server.

### "Insufficient permissions"
Only users with `admin` or `manager` roles can run scripts. Check your role in the database.

### "Script execution failed"
Check the server logs for detailed error messages. Common issues:
- Invalid API key
- API rate limit exceeded
- Network connectivity issues

## Data Privacy

Ensure compliance with data privacy regulations (GDPR, CCPA, etc.) when collecting and storing contact information.
