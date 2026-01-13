# Apollo Enrichment Quick Start

## 🚀 Quick Commands

```bash
# Enrich Apollo results via command line
npm run apollo:enrich

# Or using npx directly
npx tsx scripts/enrich-apollo-results.ts
```

## 📋 Prerequisites

1. Add Apollo API key to `.env`:
   ```bash
   APOLLO_API_KEY=your_apollo_api_key_here
   ```

2. Have Apollo search results in your database (from running Apollo searches)

## 🎯 What It Does

1. ✅ Fetches unprocessed results from `apollo_search_results` table
2. ✅ Enriches data using Apollo Bulk People Enrichment API
3. ✅ Retrieves full contact emails and details
4. ✅ Creates/updates companies in your database
5. ✅ Creates/updates contacts in your database
6. ✅ Marks results as processed to avoid duplicates

## 💡 Usage Options

### Option 1: UI Button (Easiest)
- Go to Apollo Results page
- Click "Enrich Data" button
- Configure enrichment settings:
  - Number of results to process (1-500)
  - Reveal personal emails (Yes/No)
  - Reveal phone numbers (requires webhook URL)
- Click "Start Enrichment"
- Wait for completion notification

### Option 2: Command Line
```bash
npm run apollo:enrich
```

### Option 3: API Call
```bash
curl -X POST http://localhost:3000/api/apollo-results/enrich \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "revealPersonalEmails": true,
    "revealPhoneNumbers": false
  }'
```

## 📊 What You Get

| Data Point | Source | Added To |
|------------|--------|----------|
| Full Name | Apollo Enrichment | Contacts |
| Email Address | Apollo Enrichment | Contacts |
| Job Title | Apollo Enrichment | Contacts |
| Phone Number | Apollo Enrichment (optional) | Contacts |
| LinkedIn URL | Apollo Enrichment | Contacts |
| Company Name | Apollo Enrichment | Companies |
| Company Location | Apollo Enrichment | Companies |
| Company Size | Apollo Enrichment | Companies |

## ⚠️ Important Notes

1. **Credit Usage**: Each enriched contact consumes Apollo API credits
2. **Rate Limits**: Processes 10 people per batch with 1-second delays
3. **GDPR**: Personal emails won't be revealed for GDPR-compliant regions
4. **Duplicates**: System checks emails before creating new contacts

## 📈 Typical Results

```
Starting Apollo enrichment process...

Found 50 unprocessed results.
Processing batch 1/5...
Created company: TechCorp Inc
Created contact: john.doe@techcorp.com
...

=== Enrichment Summary ===
Total results processed: 50
Companies created: 12
Contacts created: 45

Enrichment process completed!
```

## 🔍 Verify Results

After enrichment:

1. Check the Contacts table for new entries
2. Verify email addresses are present
3. Review company associations
4. Filter by "Processed" status in Apollo Results table

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| No API key error | Add `APOLLO_API_KEY` to `.env` |
| No results processed | Check for unprocessed results in Apollo Results table |
| Rate limit error | Wait and retry, script handles this automatically |
| Duplicates | System checks emails, shouldn't create duplicates |

## 📚 Full Documentation

For complete details, see [APOLLO_ENRICHMENT.md](./APOLLO_ENRICHMENT.md)

---

**💰 Cost Note**: Monitor your Apollo credit usage at https://app.apollo.io/#/settings/credits
