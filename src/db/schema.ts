import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const reportCategoryEnum = pgEnum("report_category", [
  "harassment",
  "loitering",
  "unsafe_behavior",
  "stalking",
  "verbal_abuse",
  "threat",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "new",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const moderationStatusEnum = pgEnum(
  "moderation_status",
  [
    "pending",
    "approved",
    "flagged",
    "blocked",
    "error",
  ],
);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const patternAlertStatusEnum = pgEnum(
  "pattern_alert_status",
  [
    "new",
    "acknowledged",
    "investigating",
    "resolved",
    "dismissed",
  ],
);

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),

  category: reportCategoryEnum("category").notNull(),

  description: text("description"),

  locationHash: text("location_hash").notNull(),

  zoneLatitude: real("zone_latitude"),

  zoneLongitude: real("zone_longitude"),

  occurredAt: timestamp("occurred_at", {
    withTimezone: true,
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  status: reportStatusEnum("status")
    .default("new")
    .notNull(),

  patternScore: real("pattern_score")
    .default(0)
    .notNull(),

  reporterHash: text("reporter_hash"),

  reporterSessionHash: text("reporter_session_hash"),

  isDuplicate: boolean("is_duplicate")
    .default(false)
    .notNull(),

  abuseScore: real("abuse_score")
    .default(0)
    .notNull(),

  moderationStatus: moderationStatusEnum(
    "moderation_status",
  )
    .default("pending")
    .notNull(),

  moderationScore: real("moderation_score")
    .default(0)
    .notNull(),

  moderationReason: text("moderation_reason"),

  piiDetected: boolean("pii_detected")
    .default(false)
    .notNull(),
});

export const patternAlerts = pgTable("pattern_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),

  locationHash: text("location_hash").notNull(),

  title: text("title").notNull(),

  description: text("description"),

  aiExplanation: text("ai_explanation"),

  severity: alertSeverityEnum("severity")
    .default("low")
    .notNull(),

  confidenceScore: real("confidence_score")
    .default(0)
    .notNull(),

  reportCount: integer("report_count")
    .default(0)
    .notNull(),

  distinctReporterCount: integer(
    "distinct_reporter_count",
  )
    .default(0)
    .notNull(),

  distinctTimeWindowCount: integer(
    "distinct_time_window_count",
  )
    .default(0)
    .notNull(),

  status: patternAlertStatusEnum("status")
    .default("new")
    .notNull(),

  firstDetectedAt: timestamp("first_detected_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  lastUpdatedAt: timestamp("last_updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const authorityActions = pgTable("authority_actions", {
  id: uuid("id").defaultRandom().primaryKey(),

  alertId: uuid("alert_id")
    .notNull()
    .references(() => patternAlerts.id, {
      onDelete: "cascade",
    }),

  action: text("action").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});