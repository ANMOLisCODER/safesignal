CREATE TYPE "public"."alert_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."pattern_alert_status" AS ENUM('new', 'acknowledged', 'investigating', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('harassment', 'loitering', 'unsafe_behavior', 'stalking', 'verbal_abuse', 'threat', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('new', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "authority_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"action" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pattern_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_hash" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" "alert_severity" DEFAULT 'low' NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"distinct_reporter_count" integer DEFAULT 0 NOT NULL,
	"distinct_time_window_count" integer DEFAULT 0 NOT NULL,
	"status" "pattern_alert_status" DEFAULT 'new' NOT NULL,
	"first_detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "report_category" NOT NULL,
	"description" text,
	"latitude" real,
	"longitude" real,
	"location_hash" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "report_status" DEFAULT 'new' NOT NULL,
	"pattern_score" real DEFAULT 0 NOT NULL,
	"reporter_hash" text,
	"reporter_session_hash" text,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"abuse_score" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "authority_actions" ADD CONSTRAINT "authority_actions_alert_id_pattern_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."pattern_alerts"("id") ON DELETE cascade ON UPDATE no action;