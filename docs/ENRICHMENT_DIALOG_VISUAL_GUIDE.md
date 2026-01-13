# Enrichment Settings Dialog - Visual Guide

## 🎨 Dialog Layout

```
┌─────────────────────────────────────────────────┐
│  ⚙️ Enrichment Settings                    [X]  │
├─────────────────────────────────────────────────┤
│  Configure how you want to enrich your Apollo  │
│  search results. This will consume Apollo API  │
│  credits.                                       │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Number of Results to Process             │  │
│  │ ┌──────────────────────────────────────┐ │  │
│  │ │ 100                                  │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │ Maximum number of unprocessed results   │  │
│  │ to enrich (1-500)                       │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Reveal Personal Emails                   │  │
│  │ ┌──────────────────────────────────────┐ │  │
│  │ │ Yes - Reveal emails (uses credits) ▼ │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │ Retrieve personal email addresses for   │  │
│  │ contacts. This consumes API credits.    │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Reveal Phone Numbers                     │  │
│  │ ┌──────────────────────────────────────┐ │  │
│  │ │ No - Skip phones                   ▼ │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │ Retrieve phone numbers for contacts.    │  │
│  │ Requires a webhook URL for delivery.    │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ ⚠️  Credit Usage:                        │  │
│  │ This operation will consume Apollo API   │  │
│  │ credits based on the number of contacts  │  │
│  │ enriched and data types requested.       │  │
│  │ View pricing →                           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Note: Apollo respects GDPR compliance and    │
│  will not reveal personal emails for          │
│  contacts in GDPR-compliant regions.          │
│                                                 │
│                       [Cancel] [⚙️ Start Enr..] │
└─────────────────────────────────────────────────┘
```

## 🔄 State Changes

### Default State (Emails Only)
```
Number of Results: 100
Reveal Emails: ✅ Yes
Reveal Phones: ❌ No
Webhook URL: (hidden)
```

### Phone Numbers Enabled
```
Number of Results: 100
Reveal Emails: ✅ Yes
Reveal Phones: ✅ Yes
Webhook URL: (shown, required)
┌──────────────────────────────────────────┐
│ Webhook URL *                            │
│ ┌──────────────────────────────────────┐ │
│ │ https://webhook.site/...             │ │
│ └──────────────────────────────────────┘ │
│ Apollo will send phone numbers to this  │
│ URL asynchronously.                     │
└──────────────────────────────────────────┘
```

### Validation Error (Missing Webhook)
```
Number of Results: 100
Reveal Emails: ✅ Yes
Reveal Phones: ✅ Yes
Webhook URL: (empty)
┌──────────────────────────────────────────┐
│ ⚠️  Webhook URL is required when        │
│     revealing phone numbers              │
└──────────────────────────────────────────┘
[Start Enrichment] button is DISABLED
```

## 🎯 User Interactions

### 1. Opening Dialog
```
User Action: Click "Enrich Data" button
Result: Dialog opens with default settings
State: All fields editable, Start button enabled
```

### 2. Changing Settings
```
User Action: Adjust any field
Result: Form updates immediately
Validation: Real-time feedback
```

### 3. Enabling Phone Numbers
```
User Action: Set "Reveal Phone Numbers" to Yes
Result: Webhook URL field appears
Validation: Start button disabled until webhook entered
```

### 4. Starting Enrichment
```
User Action: Click "Start Enrichment"
Result:
  - Button shows "Enriching..."
  - All fields disabled
  - Cancel button disabled
Progress: Mutation runs in background
```

### 5. Completion
```
Success Path:
  - Toast notification appears
  - Dialog auto-closes
  - Table refreshes with new data

Error Path:
  - Error toast appears
  - Dialog remains open
  - User can adjust and retry
```

## 📋 Form Fields Reference

### Number of Results
```yaml
Type: Number Input
Min: 1
Max: 500
Default: 100
Validation: Must be integer in range
Error Message: "Limit must be a number between 1 and 500"
```

### Reveal Personal Emails
```yaml
Type: Select Dropdown
Options:
  - "Yes - Reveal emails (uses credits)"
  - "No - Skip emails"
Default: Yes
Impact: Controls revealPersonalEmails API parameter
```

### Reveal Phone Numbers
```yaml
Type: Select Dropdown
Options:
  - "Yes - Reveal phones (requires webhook)"
  - "No - Skip phones"
Default: No
Impact:
  - Controls revealPhoneNumbers API parameter
  - Shows/hides webhook URL field
```

### Webhook URL
```yaml
Type: Text Input (URL)
Visible: Only when "Reveal Phone Numbers" = Yes
Required: Yes (when visible)
Placeholder: "https://your-webhook.com/apollo-phones"
Validation:
  - Must not be empty when visible
  - Should be valid URL format
Impact: Where Apollo sends phone data
```

## 🎨 Visual States

### Loading State
```
Button: [⚙️ Enriching...]
Status: Disabled, with spinner icon
Fields: All disabled
Close: X button disabled
```

### Error State
```
Toast: 🔴 "Enrichment failed"
Description: Error message from API
Dialog: Remains open
Fields: Re-enabled for retry
```

### Success State
```
Toast: ✅ "Enrichment completed!"
Description: "Processed X results. Created Y companies..."
Dialog: Auto-closes
Table: Refreshes automatically
```

## 💡 UX Considerations

### Helpful Hints
- 📝 Field descriptions explain what each setting does
- 💰 Credit warning is always visible
- 🌍 GDPR notice at bottom
- ℹ️ Contextual help text under each field

### Smart Defaults
- 100 results (balanced batch size)
- Emails enabled (most common use case)
- Phones disabled (requires setup)

### Progressive Disclosure
- Webhook field only shown when needed
- Reduces cognitive load
- Cleaner initial interface

### Error Prevention
- Min/max on number inputs
- Required field indicators (*)
- Disabled submit until valid
- Clear error messages

## 📱 Responsive Behavior

### Desktop (>640px)
```
- Full width dialog (500px max)
- All fields comfortable size
- Side-by-side buttons in footer
```

### Mobile (<640px)
```
- Full screen or near-full width
- Stacked form fields
- Stacked footer buttons
- Scrollable content area
```

## 🔧 Developer Notes

### Component Props
```typescript
interface EnrichmentSettingsDialogProps {
  open: boolean;                          // Control visibility
  onOpenChange: (open: boolean) => void;  // Handle close
  onConfirm: (settings: EnrichmentSettings) => void;  // Submit handler
  isPending?: boolean;                    // Loading state
}
```

### State Management
```typescript
// Internal state (not exposed to parent)
const [limit, setLimit] = useState<number>(100);
const [revealPersonalEmails, setRevealPersonalEmails] = useState<boolean>(true);
const [revealPhoneNumbers, setRevealPhoneNumbers] = useState<boolean>(false);
const [webhookUrl, setWebhookUrl] = useState<string>('');
```

### Validation Logic
```typescript
const canSubmit = !revealPhoneNumbers ||
                  (revealPhoneNumbers && webhookUrl.trim());
```

---

**Last Updated:** January 2026
**Component:** EnrichmentSettingsDialog
**Status:** Production Ready
