# Apollo Script - Quick Start Guide

## Setup (2 minutes)

### 1. Get Apollo API Key
1. Go to [Apollo.io API Settings](https://app.apollo.io/#/settings/integrations/api)
2. Click "Create API Key" if you don't have one
3. Copy your API key

### 2. Add to Environment
```bash
# Add to .env or .env.local
APOLLO_API_KEY=your_api_key_here
```

### 3. Restart Server
```bash
npm run dev
```

## Usage

### Step 1: Navigate to Scripts Page
- Go to **Dashboard** → **Scripts** in the sidebar
- Click the **"Run Apollo Script"** button

### Step 2: Configure Search
Fill in at least one search criterion:

**Job Titles** (recommended)
- Type: `CEO` and press Enter or click "Add"
- Or click on suggested titles: CEO, CTO, Founder, etc.

**Company Locations** (optional)
- Type: `United States` and press Enter
- Or: `California`, `New York`, etc.

**Industries** (optional)
- Select from dropdown: Computer Software, SaaS, etc.

**Company Size** (optional)
- Select employee range: 1-10, 11-50, 51-200, etc.

**Max Pages**
- Set how many pages to scrape (25 results per page)
- Start with 1-2 pages for testing

### Step 3: Run Script
- Click **"Run Script"** button
- Wait for completion (progress shown in button)
- Success message will appear when done

### Step 4: View Data
- Go to **Dashboard** → **Data**
- Check the **Companies** and **Contacts** tabs
- New records will be at the top (most recent)

## Example Searches

### Startup Founders
```
Job Titles: Founder, Co-Founder, CEO
Locations: United States
Company Size: 1-10
Max Pages: 2
```

### SaaS Executives
```
Job Titles: VP of Sales, CRO, CEO
Industries: Computer Software
Company Size: 51-200
Max Pages: 3
```

### Marketing Leaders
```
Job Titles: CMO, VP of Marketing, Director of Marketing
Industries: Marketing and Advertising
Locations: California
Max Pages: 2
```

## What Happens Behind the Scenes

1. **Search Apollo.io** - Queries based on your criteria
2. **Create Companies** - Adds new companies to database
3. **Create Contacts** - Adds contacts linked to companies
4. **Update Existing** - Updates records if they already exist
5. **Deduplicate** - Prevents duplicate emails/companies

## Tips

✅ **Start Small** - Test with 1-2 pages first
✅ **Be Specific** - More criteria = better targeting
✅ **Check Duplicates** - Script handles this automatically
✅ **Monitor Credits** - Each result uses Apollo credits

❌ **Don't** run too many pages at once (rate limits)
❌ **Don't** spam the button (one run at a time)

## Troubleshooting

**"Apollo API key not configured"**
→ Check `.env` file has `APOLLO_API_KEY` set

**"Insufficient permissions"**
→ Ask admin to grant you admin/manager role

**No results returned**
→ Try broader search criteria (fewer filters)

**"Script execution failed"**
→ Check console/logs for detailed error
→ Verify API key is valid
→ Check Apollo.io account credits

## Need Help?

- Check [APOLLO_INTEGRATION.md](./APOLLO_INTEGRATION.md) for detailed docs
- Check [APOLLO_IMPLEMENTATION_SUMMARY.md](./APOLLO_IMPLEMENTATION_SUMMARY.md) for technical details
