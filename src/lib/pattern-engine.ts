import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  patternAlerts,
  reports,
} from "@/db/schema";

const WINDOW_DAYS = 7;

const RECENT_WINDOW_HOURS = 24;

const MIN_REPORTS = 3;

const MIN_DISTINCT_REPORTERS = 2;

const MIN_DISTINCT_TIME_WINDOWS = 2;

type TrendDirection =
  | "rising"
  | "stable"
  | "falling";

type PatternAnalysis = {
  locationHash: string;
  reportCount: number;
  distinctReporterCount: number;
  distinctTimeWindowCount: number;
  categoryConsistency: number;
  duplicateRate: number;
  averageAbuseScore: number;
  recentReportCount: number;
  baselineDailyReportRate: number;
  velocityMultiplier: number;
  trendDirection: TrendDirection;
  confidenceScore: number;
  severity:
    | "low"
    | "medium"
    | "high"
    | "critical";
};

function clamp(
  value: number,
  min = 0,
  max = 1,
) {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

function getTimeWindow(date: Date) {
  const hour = date.getUTCHours();

  if (hour < 6) {
    return "night";
  }

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}

function getSeverity(
  confidenceScore: number,
):
  | "low"
  | "medium"
  | "high"
  | "critical" {
  if (confidenceScore >= 0.9) {
    return "critical";
  }

  if (confidenceScore >= 0.75) {
    return "high";
  }

  if (confidenceScore >= 0.55) {
    return "medium";
  }

  return "low";
}

function calculateCategoryConsistency(
  categories: string[],
) {
  if (categories.length === 0) {
    return 0;
  }

  const counts = new Map<
    string,
    number
  >();

  for (const category of categories) {
    counts.set(
      category,
      (counts.get(category) ?? 0) + 1,
    );
  }

  const highestCount = Math.max(
    ...counts.values(),
  );

  return highestCount / categories.length;
}

function calculateVelocity(
  recentReportCount: number,
  historicalReportCount: number,
) {
  const historicalDays =
    WINDOW_DAYS -
    RECENT_WINDOW_HOURS / 24;

  const baselineDailyRate =
    historicalReportCount /
    historicalDays;

  const recentDailyRate =
    recentReportCount /
    (RECENT_WINDOW_HOURS / 24);

  if (baselineDailyRate === 0) {
    if (recentReportCount > 0) {
      return {
        baselineDailyReportRate: 0,
        velocityMultiplier: 5,
        trendDirection:
          "rising" as TrendDirection,
      };
    }

    return {
      baselineDailyReportRate: 0,
      velocityMultiplier: 1,
      trendDirection:
        "stable" as TrendDirection,
    };
  }

  const velocityMultiplier =
    recentDailyRate /
    baselineDailyRate;

  let trendDirection:
    | TrendDirection = "stable";

  if (velocityMultiplier >= 1.5) {
    trendDirection = "rising";
  } else if (
    velocityMultiplier <= 0.75
  ) {
    trendDirection = "falling";
  }

  return {
    baselineDailyReportRate:
      Number(
        baselineDailyRate.toFixed(3),
      ),
    velocityMultiplier:
      Number(
        velocityMultiplier.toFixed(3),
      ),
    trendDirection,
  };
}

function calculateConfidence(
  reportCount: number,
  distinctReporterCount: number,
  distinctTimeWindowCount: number,
  categoryConsistency: number,
  duplicateRate: number,
  averageAbuseScore: number,
  velocityMultiplier: number,
) {
  const reportSignal = clamp(
    reportCount / 10,
  );

  const reporterSignal = clamp(
    distinctReporterCount / 5,
  );

  const timeSignal = clamp(
    distinctTimeWindowCount / 4,
  );

  const diversitySignal =
    reporterSignal * 0.5 +
    timeSignal * 0.5;

  const velocitySignal = clamp(
    Math.max(
      velocityMultiplier - 1,
      0,
    ) / 4,
  );

  const duplicatePenalty =
    clamp(duplicateRate) * 0.2;

  const abusePenalty =
    clamp(averageAbuseScore) * 0.2;

  const rawScore =
    reportSignal * 0.18 +
    diversitySignal * 0.32 +
    categoryConsistency * 0.22 +
    velocitySignal * 0.13 +
    0.15 -
    duplicatePenalty -
    abusePenalty;

  return Number(
    clamp(rawScore).toFixed(3),
  );
}

export async function analyzeLocationPattern(
  locationHash: string,
): Promise<PatternAnalysis | null> {
  const now = new Date();

  const windowStart =
    new Date(
      now.getTime() -
        WINDOW_DAYS *
          24 *
          60 *
          60 *
          1000,
    );

  const recentWindowStart =
    new Date(
      now.getTime() -
        RECENT_WINDOW_HOURS *
          60 *
          60 *
          1000,
    );

  const locationReports =
    await db
      .select({
        id: reports.id,
        category:
          reports.category,
        occurredAt:
          reports.occurredAt,
        reporterSessionHash:
          reports.reporterSessionHash,
        isDuplicate:
          reports.isDuplicate,
        abuseScore:
          reports.abuseScore,
      })
      .from(reports)
      .where(
        and(
          eq(
            reports.locationHash,
            locationHash,
          ),
          gte(
            reports.occurredAt,
            windowStart,
          ),
        ),
      )
      .orderBy(
        desc(reports.occurredAt),
      );

  if (
    locationReports.length <
    MIN_REPORTS
  ) {
    return null;
  }

  const distinctReporterSet =
    new Set(
      locationReports
        .map(
          (report) =>
            report.reporterSessionHash,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    );

  const distinctTimeWindowSet =
    new Set(
      locationReports.map(
        (report) =>
          getTimeWindow(
            report.occurredAt,
          ),
      ),
    );

  const categories =
    locationReports.map(
      (report) => report.category,
    );

  const categoryConsistency =
    calculateCategoryConsistency(
      categories,
    );

  const duplicateCount =
    locationReports.filter(
      (report) =>
        report.isDuplicate,
    ).length;

  const duplicateRate =
    duplicateCount /
    locationReports.length;

  const totalAbuseScore =
    locationReports.reduce(
      (sum, report) =>
        sum +
        Number(
          report.abuseScore ?? 0,
        ),
      0,
    );

  const averageAbuseScore =
    totalAbuseScore /
    locationReports.length;

  const recentReportCount =
    locationReports.filter(
      (report) =>
        report.occurredAt >=
        recentWindowStart,
    ).length;

  const historicalReportCount =
    locationReports.length -
    recentReportCount;

  const velocity =
    calculateVelocity(
      recentReportCount,
      historicalReportCount,
    );

  const distinctReporterCount =
    distinctReporterSet.size;

  const distinctTimeWindowCount =
    distinctTimeWindowSet.size;

  if (
    distinctReporterCount <
    MIN_DISTINCT_REPORTERS
  ) {
    return null;
  }

  if (
    distinctTimeWindowCount <
    MIN_DISTINCT_TIME_WINDOWS
  ) {
    return null;
  }

  const confidenceScore =
    calculateConfidence(
      locationReports.length,
      distinctReporterCount,
      distinctTimeWindowCount,
      categoryConsistency,
      duplicateRate,
      averageAbuseScore,
      velocity.velocityMultiplier,
    );

  return {
    locationHash,
    reportCount:
      locationReports.length,
    distinctReporterCount,
    distinctTimeWindowCount,
    categoryConsistency,
    duplicateRate,
    averageAbuseScore,
    recentReportCount,
    baselineDailyReportRate:
      velocity.baselineDailyReportRate,
    velocityMultiplier:
      velocity.velocityMultiplier,
    trendDirection:
      velocity.trendDirection,
    confidenceScore,
    severity:
      getSeverity(
        confidenceScore,
      ),
  };
}

export async function createOrUpdatePatternAlert(
  analysis: PatternAnalysis,
) {
  const existingAlert =
    await db
      .select({
        id: patternAlerts.id,
      })
      .from(patternAlerts)
      .where(
        and(
          eq(
            patternAlerts.locationHash,
            analysis.locationHash,
          ),
          sql`${patternAlerts.status} IN ('new', 'acknowledged', 'investigating')`,
        ),
      )
      .limit(1);

  const title =
    analysis.trendDirection ===
    "rising"
      ? "Rising safety pattern detected"
      : "Emerging safety pattern detected";

  const description =
    `SafeSignal detected ` +
    `${analysis.reportCount} reports from ` +
    `${analysis.distinctReporterCount} ` +
    `distinct anonymous reporter sessions ` +
    `across ` +
    `${analysis.distinctTimeWindowCount} ` +
    `time periods within the last ` +
    `${WINDOW_DAYS} days. ` +
    `Recent activity: ` +
    `${analysis.recentReportCount} reports in ` +
    `the last ${RECENT_WINDOW_HOURS} hours. ` +
    `Trend: ${analysis.trendDirection}.`;

  if (existingAlert.length > 0) {
    const updated =
      await db
        .update(patternAlerts)
        .set({
          title,
          description,
          severity:
            analysis.severity,
          confidenceScore:
            analysis.confidenceScore,
          reportCount:
            analysis.reportCount,
          distinctReporterCount:
            analysis.distinctReporterCount,
          distinctTimeWindowCount:
            analysis.distinctTimeWindowCount,
          lastUpdatedAt:
            new Date(),
        })
        .where(
          eq(
            patternAlerts.id,
            existingAlert[0].id,
          ),
        )
        .returning({
          id: patternAlerts.id,
        });

    return updated[0];
  }

  const created =
    await db
      .insert(patternAlerts)
      .values({
        locationHash:
          analysis.locationHash,
        title,
        description,
        severity:
          analysis.severity,
        confidenceScore:
          analysis.confidenceScore,
        reportCount:
          analysis.reportCount,
        distinctReporterCount:
          analysis.distinctReporterCount,
        distinctTimeWindowCount:
          analysis.distinctTimeWindowCount,
      })
      .returning({
        id: patternAlerts.id,
      });

  return created[0];
}