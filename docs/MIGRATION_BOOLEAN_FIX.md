# Migration Fix for Boolean Fields

## Issue
The schema was updated to use `boolean` types instead of `varchar` for boolean fields, but the database migration wasn't applied. This caused a type mismatch error:

```
operator does not exist: character varying = boolean
```

## Solution

### Step 1: Apply the Migration

Run the migration to convert the columns:

```bash
npm run db:migrate
```

This will execute `db/migrations/0004_convert_apollo_booleans.sql` which:
- Converts `has_email`, `has_city`, `has_state`, `has_country`, `has_direct_phone` from `varchar(10)` to `boolean`
- Converts `processed` from `varchar(10)` to `boolean`
- Sets default value for `processed` to `false`
- Converts existing string values ('true'/'false') to proper booleans

### Step 2: Code Compatibility

The code has been updated with temporary compatibility layers that handle both string and boolean values:

1. **`scripts/enrich-apollo-results.ts`** - Uses SQL to check both boolean and string values:
   ```typescript
   sql`(${apolloSearchResults.processed} = false OR ${apolloSearchResults.processed} = 'false')`
   ```

2. **`app/api/apollo-results/route.ts`** - Handles query string parameters that come as strings:
   ```typescript
   sql`(${apolloSearchResults.processed} = ${processedValue} OR ${apolloSearchResults.processed}::text = ${processedParam})`
   ```

### Step 3: After Migration (Optional Cleanup)

After the migration is successfully applied and verified, you can simplify the code by removing the compatibility SQL:

**In `scripts/enrich-apollo-results.ts`:**
```typescript
// Replace this:
sql`(${apolloSearchResults.processed} = false OR ${apolloSearchResults.processed} = 'false')`

// With this:
eq(apolloSearchResults.processed, false)
```

**In `app/api/apollo-results/route.ts`:**
```typescript
// Replace this:
sql`(${apolloSearchResults.processed} = ${processedValue} OR ${apolloSearchResults.processed}::text = ${processedParam})`

// With this:
eq(apolloSearchResults.processed, processedValue)
```

## Verification

After running the migration, verify it worked:

```sql
-- Check column types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'apollo_search_results' 
AND column_name IN ('has_email', 'has_city', 'has_state', 'has_country', 'has_direct_phone', 'processed');

-- Should show 'boolean' for all these columns
```

## Current Status

✅ Migration file created: `db/migrations/0004_convert_apollo_booleans.sql`  
✅ Migration script created: `scripts/run-apollo-boolean-migration.ts`  
✅ **Migration completed successfully** - All columns are now boolean type  
✅ Code updated to use proper boolean comparisons (compatibility layer removed)

## Migration Complete! 🎉

The migration has been successfully applied. All boolean columns in the `apollo_search_results` table are now using proper PostgreSQL boolean types:
- ✅ `has_email`: boolean
- ✅ `has_city`: boolean  
- ✅ `has_state`: boolean
- ✅ `has_country`: boolean
- ✅ `has_direct_phone`: boolean
- ✅ `processed`: boolean (with default `false`)

The code has been updated to use proper boolean comparisons without the compatibility layer.
