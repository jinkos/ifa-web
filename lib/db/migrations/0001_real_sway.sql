CREATE TABLE "clients" (
	"client_id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"address1" varchar(255),
	"address2" varchar(255),
	"postcode" varchar(32),
	"mobile" varchar(32),
	"landline" varchar(32),
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "bot_name" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "mailbox_name" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "intelliflo_access_token" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "intelliflo_refresh_token" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "intelliflo_token_expires_at" timestamp;