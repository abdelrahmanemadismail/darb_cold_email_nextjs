# Apollo.io Integration - Implementation Summary

## Overview
Added complete Apollo.io integration to the DARB Cold Email platform, enabling automated B2B data collection directly from Apollo.io's API into your database.

## Files Created/Modified

### New Files
1. **scripts/apollo-scraper.ts** - Core scraper implementation
   - `ApolloScraper` class with search and database operations
   - Support for searching by titles, locations, industries, company size
   - Automatic deduplication and data updates
   - Rate limiting and error handling

2. **app/api/scripts/apollo/route.ts** - API endpoints
   - `POST /api/scripts/apollo` - Run scraping script
   - `GET /api/scripts/apollo` - Get configuration and options
   - Permission checks (admin/manager only)
   - Comprehensive error handling

3. **components/scripts/ApolloScriptDialog.tsx** - UI component
   - Dialog interface for configuring Apollo searches
   - Job title, location, industry, and company size inputs
   - Tag-based selection with common options
   - Real-time validation and feedback

4. **types/apollo.ts** - TypeScript types
   - `ApolloSearchParams`, `ApolloScriptResult`
   - `ApolloConfig`, `ApolloScriptRequest/Response`
   - Full type safety for all Apollo operations

5. **hooks/useApolloScript.ts** - React Query hooks
   - `useApolloConfig()` - Fetch configuration
   - `useRunApolloScript()` - Execute script with mutation
   - Automatic toast notifications

6. **docs/APOLLO_INTEGRATION.md** - Complete documentation
   - Setup instructions
   - Usage guide (UI and programmatic)
   - API endpoint documentation
   - Troubleshooting section

7. **.env.example** - Environment template
   - Documents required APOLLO_API_KEY variable

### Modified Files
1. **app/dashboard/scripts/page.tsx**
   - Added Apollo script dialog integration
   - Changed "New Script" button to "Run Apollo Script"
   - Connected dialog to UI

2. **README.md**
   - Updated Script Management section
   - Added Apollo setup instructions
   - Linked to detailed documentation

3. **types/index.ts**
   - Exported Apollo types

## Features Implemented

### ✅ Core Functionality
- Search Apollo.io by multiple criteria
- Automatic company creation/update
- Automatic contact creation/update
- Company-contact linking
- Duplicate prevention
- Rate limiting (1s delay between pages)

### ✅ Search Criteria
- Job titles (CEO, CTO, Founder, etc.)
- Company locations (cities, states, countries)
- Industries (Software, SaaS, etc.)
- Company size (employee count ranges)
- Pagination (25 results per page)

### ✅ User Interface
- Clean dialog-based UI
- Tag-based selection
- Pre-populated common options
- Real-time validation
- Progress feedback
- Error messages

### ✅ Permissions & Security
- Role-based access (admin/manager only)
- API key stored in environment variables
- Session-based authentication
- Input validation

### ✅ Developer Experience
- Full TypeScript support
- React Query integration
- Reusable hooks
- Comprehensive documentation
- Example code

## How to Use

### 1. Setup
```bash
# Add to .env or .env.local
APOLLO_API_KEY=your_apollo_api_key_here

# Restart dev server
npm run dev
```

### 2. Via Dashboard
1. Navigate to Dashboard > Scripts
2. Click "Run Apollo Script"
3. Configure search criteria
4. Click "Run Script"

### 3. Programmatically
```typescript
import { ApolloScraper } from '@/scripts/apollo-scraper';

const scraper = new ApolloScraper(apiKey, userId);
const result = await scraper.run({
  personTitles: ['CEO', 'CTO'],
  companyLocations: ['United States'],
  industries: ['Computer Software'],
  companyHeadcountMin: 10,
  companyHeadcountMax: 500,
}, 5);
```

### 4. Via API
```bash
# Get config
curl http://localhost:3000/api/scripts/apollo

# Run script
curl -X POST http://localhost:3000/api/scripts/apollo \
  -H "Content-Type: application/json" \
  -d '{
    "personTitles": ["CEO"],
    "companyLocations": ["United States"],
    "maxPages": 2
  }'
```

## Data Flow

```
User Input (Dialog)
    ↓
API Route (/api/scripts/apollo)
    ↓
ApolloScraper.run()
    ↓
Apollo.io API Search
    ↓
ApolloScraper.saveToDatabase()
    ↓
Companies Table (create/update)
    ↓
Contacts Table (create/update with companyId)
    ↓
Success Response
```

## Database Impact

### Companies Table
- Creates new companies with Apollo data
- Updates existing companies (matched by name)
- Fields: name, website, industry, size, location, linkedinUrl

### Contacts Table
- Creates new contacts with Apollo data
- Updates existing contacts (matched by email)
- Links contacts to companies via companyId
- Fields: firstName, lastName, email, title, companyId, linkedinUrl

## Error Handling

- API key validation
- Permission checks
- Network error handling
- Database error handling per record
- User-friendly error messages
- Server-side logging

## Rate Limiting

- 1 second delay between page requests
- Configurable max pages to prevent API abuse
- Respects Apollo.io rate limits

## Next Steps (Optional Enhancements)

### Scheduling
- Add cron jobs for automated scraping
- Save script configurations for reuse
- Schedule recurring runs

### Monitoring
- Track script execution history in database
- Show real-time progress during execution
- Email notifications on completion

### Advanced Features
- Webhook support for async execution
- Export collected data to CSV
- Advanced filtering and deduplication
- Integration with email campaigns

## Testing Checklist

- [ ] Environment variable configured
- [ ] User has admin/manager role
- [ ] Can open Apollo script dialog
- [ ] Can add job titles, locations, industries
- [ ] Can select company size range
- [ ] Script executes successfully
- [ ] Companies created in database
- [ ] Contacts created and linked to companies
- [ ] Duplicate handling works correctly
- [ ] Error messages display properly
- [ ] Success toast notification shown

## Common Issues & Solutions

### Issue: "Apollo API key not configured"
**Solution**: Add `APOLLO_API_KEY` to your `.env` file and restart the server

### Issue: "Insufficient permissions"
**Solution**: Ensure user has 'admin' or 'manager' role in database

### Issue: No results returned
**Solution**: Check Apollo.io API status, verify search criteria, check API credits

### Issue: Duplicate data
**Solution**: Scraper automatically handles duplicates by email/name matching

## Resources

- [Apollo.io API Documentation](https://apolloio.github.io/apollo-api-docs/)
- [Get Apollo API Key](https://app.apollo.io/#/settings/integrations/api)
- [Project Documentation](./APOLLO_INTEGRATION.md)
