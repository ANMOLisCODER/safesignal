CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'flagged', 'blocked', 'error');--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "moderation_score" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "moderation_reason" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "pii_detected" boolean DEFAULT false NOT NULL;