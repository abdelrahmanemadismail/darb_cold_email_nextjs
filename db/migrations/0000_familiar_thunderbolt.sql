CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"domain" varchar(255),
	"industry" varchar(100),
	"size" varchar(50),
	"city" varchar(100),
	"country" varchar(100),
	"description" text,
	"website" varchar(500),
	"linkedin_url" varchar(500),
	"phone" varchar(50),
	"keywords" varchar(255)[],
	"source" varchar(100),
	"tags" varchar(255)[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"gender" varchar(50),
	"job_title" varchar(255),
	"department" varchar(100),
	"company_id" uuid,
	"linkedin_url" varchar(500),
	"twitter_url" varchar(500),
	"is_verified" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'active',
	"tags" varchar(100)[],
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"last_contacted_at" timestamp,
	CONSTRAINT "contacts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;