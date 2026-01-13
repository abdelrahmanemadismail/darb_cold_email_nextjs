-- Convert varchar boolean fields to proper boolean columns in apollo_search_results table

-- Alter the columns to boolean type with proper conversion
ALTER TABLE "apollo_search_results" 
  ALTER COLUMN "has_email" TYPE boolean USING CASE WHEN "has_email"::text = 'true' THEN true ELSE NULL END,
  ALTER COLUMN "has_city" TYPE boolean USING CASE WHEN "has_city"::text = 'true' THEN true ELSE NULL END,
  ALTER COLUMN "has_state" TYPE boolean USING CASE WHEN "has_state"::text = 'true' THEN true ELSE NULL END,
  ALTER COLUMN "has_country" TYPE boolean USING CASE WHEN "has_country"::text = 'true' THEN true ELSE NULL END,
  ALTER COLUMN "has_direct_phone" TYPE boolean USING CASE WHEN "has_direct_phone"::text = 'true' THEN true ELSE NULL END,
  ALTER COLUMN "processed" TYPE boolean USING CASE WHEN "processed"::text = 'true' THEN true ELSE false END;

-- Set default for processed column
ALTER TABLE "apollo_search_results" ALTER COLUMN "processed" SET DEFAULT false;
