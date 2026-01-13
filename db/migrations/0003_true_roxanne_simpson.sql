CREATE TABLE "apollo_search_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_params" jsonb NOT NULL,
	"person_id" varchar(100) NOT NULL,
	"first_name" varchar(100),
	"last_name_obfuscated" varchar(100),
	"title" varchar(255),
	"organization_name" varchar(255),
	"organization_data" jsonb,
	"has_email" varchar(10),
	"has_city" varchar(10),
	"has_state" varchar(10),
	"has_country" varchar(10),
	"has_direct_phone" varchar(10),
	"raw_response" jsonb NOT NULL,
	"last_refreshed_at" varchar(100),
	"page_number" integer,
	"processed" varchar(10) DEFAULT 'false',
	"company_id" uuid,
	"contact_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "managed_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "tags";