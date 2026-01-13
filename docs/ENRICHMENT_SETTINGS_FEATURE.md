# Enrichment Settings Dialog - Feature Summary

## ✨ What's New

Added a configuration dialog that allows you to customize enrichment settings before processing Apollo search results.

## 🎨 UI Components

### New Dialog: `EnrichmentSettingsDialog`
Located at: `components/apollo/EnrichmentSettingsDialog.tsx`

**Features:**
- 📊 Set number of results to process (1-500)
- 📧 Toggle personal email revelation
- 📞 Toggle phone number revelation
- 🔗 Configure webhook URL for phone numbers
- ⚠️ Credit usage warnings
- ℹ️ GDPR compliance notices
- ✅ Input validation

### Updated: `ApolloResultsTable`
- Button now opens settings dialog instead of immediately enriching
- Icon changed to Settings ⚙️ for clarity
- Dialog closes automatically on successful enrichment

## 🔧 How It Works

### User Flow
```
1. User clicks "Enrich Data" button
   ↓
2. Settings dialog opens
   ↓
3. User configures:
   - Number of results (default: 100)
   - Reveal emails (default: Yes)
   - Reveal phones (default: No)
   - Webhook URL (if phones enabled)
   ↓
4. User clicks "Start Enrichment"
   ↓
5. API processes with configured settings
   ↓
6. Dialog closes, toast notification shows results
```

## ⚙️ Configuration Options

### 1. Number of Results
- **Range:** 1-500
- **Default:** 100
- **Purpose:** Limits how many unprocessed results to enrich in one run

### 2. Reveal Personal Emails
- **Type:** Boolean
- **Default:** `true`
- **Impact:** Uses Apollo API credits when enabled
- **Note:** GDPR regions will not return personal emails regardless

### 3. Reveal Phone Numbers
- **Type:** Boolean
- **Default:** `false`
- **Requirement:** Webhook URL is mandatory when enabled
- **Delivery:** Async via webhook (can take several minutes)

### 4. Webhook URL
- **Type:** URL string
- **Required:** Only when revealing phone numbers
- **Format:** Must be valid HTTPS URL
- **Purpose:** Apollo sends phone numbers to this endpoint asynchronously

## 🔌 API Changes

### Endpoint: POST `/api/apollo-results/enrich`

**New Request Body:**
```typescript
{
  limit?: number;                    // 1-500, default 100
  revealPersonalEmails?: boolean;    // default true
  revealPhoneNumbers?: boolean;      // default false
  webhookUrl?: string;               // required if revealPhoneNumbers=true
}
```

**Old Request Body:**
```typescript
{
  limit?: number;  // Only accepted limit
}
```

### Validation
- ✅ Limit must be between 1-500
- ✅ Webhook URL required when revealing phones
- ✅ Webhook URL must be valid HTTPS URL

## 📦 Backend Updates

### `ApolloEnrichmentService.processUnprocessedResults()`

**New Signature:**
```typescript
async processUnprocessedResults(
  limit = 100,
  userId?: string,
  options?: {
    revealPersonalEmails?: boolean;
    revealPhoneNumbers?: boolean;
    webhookUrl?: string;
  }
): Promise<ProcessingResult>
```

**Features:**
- Accepts enrichment options
- Logs settings for debugging
- Passes settings to Apollo API
- Maintains backward compatibility (all options have defaults)

## 💰 Cost Considerations

### Credit Usage Display
The dialog shows:
- ⚠️ Warning about API credit consumption
- 🔗 Link to Apollo pricing page
- ℹ️ GDPR compliance information

### Credit Impact
| Setting | Impact |
|---------|--------|
| Reveal Emails: Yes | ~1 credit per contact |
| Reveal Phones: Yes | Additional credits per contact |
| More results = More credits | Linear scaling |

## 🛡️ User Protection

### Input Validation
1. **Limit validation:** Prevents values outside 1-500 range
2. **Webhook validation:** Ensures URL is provided when needed
3. **Button disable states:** Prevents multiple submissions

### User Warnings
- Credit usage alert with pricing link
- GDPR compliance notice
- Webhook requirement notice when enabling phones
- Required field indicators (*)

### Error Handling
- Clear error messages for missing webhook
- API error messages shown via toast notifications
- Form validation prevents invalid submissions

## 📱 Responsive Design

- ✅ Mobile-friendly dialog
- ✅ Max width: 500px for readability
- ✅ Scrollable content for small screens
- ✅ Touch-friendly form controls

## 🧪 Testing Checklist

- [ ] Dialog opens when clicking "Enrich Data"
- [ ] All form fields are editable
- [ ] Default values are correct
- [ ] Webhook field appears/hides based on phone setting
- [ ] Submit button disables when webhook missing
- [ ] API receives correct settings
- [ ] Enrichment works with custom settings
- [ ] Toast notifications appear on success/error
- [ ] Dialog closes on successful enrichment
- [ ] Can cancel and reopen dialog

## 🚀 Usage Examples

### Example 1: Email Only (Default)
```typescript
// User selects:
- Limit: 100
- Reveal Emails: Yes
- Reveal Phones: No

// API receives:
{
  limit: 100,
  revealPersonalEmails: true,
  revealPhoneNumbers: false
}
```

### Example 2: Emails + Phones
```typescript
// User selects:
- Limit: 50
- Reveal Emails: Yes
- Reveal Phones: Yes
- Webhook: https://myapp.com/webhooks/apollo

// API receives:
{
  limit: 50,
  revealPersonalEmails: true,
  revealPhoneNumbers: true,
  webhookUrl: "https://myapp.com/webhooks/apollo"
}
```

### Example 3: No Personal Data (Just Company Info)
```typescript
// User selects:
- Limit: 200
- Reveal Emails: No
- Reveal Phones: No

// API receives:
{
  limit: 200,
  revealPersonalEmails: false,
  revealPhoneNumbers: false
}
```

## 🔄 Migration Notes

### Backward Compatibility
- ✅ Old API calls still work (limit-only)
- ✅ All new options have sensible defaults
- ✅ No breaking changes to existing code

### Upgrading from Old Version
No migration needed! The new settings dialog is additive:
1. Existing enrichment functionality unchanged
2. New settings are optional with defaults
3. UI automatically updated to use dialog

## 📝 Code Locations

| Component | File Path |
|-----------|-----------|
| Settings Dialog | `components/apollo/EnrichmentSettingsDialog.tsx` |
| Results Table | `components/apollo/ApolloResultsTable.tsx` |
| API Endpoint | `app/api/apollo-results/enrich/route.ts` |
| Enrichment Service | `scripts/enrich-apollo-results.ts` |
| Documentation | `docs/APOLLO_ENRICHMENT_QUICK_START.md` |

## 🎓 Key Learnings

1. **User Control:** Users can now optimize credit usage by choosing what to enrich
2. **Transparency:** Clear warnings about costs and limitations
3. **Flexibility:** Different enrichment strategies for different use cases
4. **Safety:** Validation prevents costly mistakes

---

**Status:** ✅ Ready to use
**Breaking Changes:** None
**New Dependencies:** None
