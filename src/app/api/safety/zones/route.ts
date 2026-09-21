import { and, gte, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  patternAlerts,
  reports,
} from "@/db/schema";

const MIN_REPORTS_FOR_MAP = 3;

const ACTIVE_STATUSES = [
  "new",
  "acknowledged",
  "investigating",
] as const;

const SEVEN_DAYS_MS =
  7 * 24 * 60 * 60 * 1000;

const ONE_DAY_MS =
  24 * 60 * 60 * 1000;

type ZoneAggregate = {
  locationHash: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  recentReportCount: number;
  previousReportCount: number;
  reporterHashes: Set<string>;
  timeWindows: Set<string>;
  categories: Map<string, number>;
  latestReportAt: Date | null;
  firstReportAt: Date | null;
};

function calculateTrend(
  recentReportCount: number,
  previousReportCount: number,
) {
  if (
    recentReportCount === 0 &&
    previousReportCount === 0
  ) {
    return "stable" as const;
  }

  if (recentReportCount > previousReportCount) {
    return "rising" as const;
  }

  if (recentReportCount < previousReportCount) {
    return "falling" as const;
  }

  return "stable" as const;
}

function calculateRisk(
  reportCount: number,
  confidenceScore: number,
  recentReportCount: number,
  trendDirection: "rising" | "falling" | "stable",
  alertSeverity:
    | "low"
    | "medium"
    | "high"
    | "critical"
    | null,
) {
  if (alertSeverity === "critical") {
    return "critical" as const;
  }

  if (
    alertSeverity === "high" ||
    confidenceScore >= 0.85
  ) {
    return "high" as const;
  }

  if (
    alertSeverity === "medium" ||
    confidenceScore >= 0.65
  ) {
    return "medium" as const;
  }

  if (
    reportCount >= 6 &&
    recentReportCount >= 2 &&
    trendDirection === "rising"
  ) {
    return "medium" as const;
  }

  return "low" as const;
}

export async function GET() {
  try {
    const now = Date.now();

    const sevenDaysAgo = new Date(
      now - SEVEN_DAYS_MS,
    );

    const oneDayAgo = new Date(
      now - ONE_DAY_MS,
    );

    const recentReports =
      await db
        .select({
          locationHash:
            reports.locationHash,

          zoneLatitude:
            reports.zoneLatitude,

          zoneLongitude:
            reports.zoneLongitude,

          category:
            reports.category,

          reporterSessionHash:
            reports.reporterSessionHash,

          occurredAt:
            reports.occurredAt,

          createdAt:
            reports.createdAt,

          isDuplicate:
            reports.isDuplicate,
        })
        .from(reports)
        .where(
          and(
            gte(
              reports.createdAt,
              sevenDaysAgo,
            ),
          ),
        );

    const zoneMap =
      new Map<string, ZoneAggregate>();

    for (const report of recentReports) {
      if (
        report.zoneLatitude === null ||
        report.zoneLongitude === null
      ) {
        continue;
      }

      /*
       * Duplicate reports are not allowed to increase
       * the public safety signal.
       */
      if (report.isDuplicate) {
        continue;
      }

      let zone =
        zoneMap.get(
          report.locationHash,
        );

      if (!zone) {
        zone = {
          locationHash:
            report.locationHash,

          latitude:
            report.zoneLatitude,

          longitude:
            report.zoneLongitude,

          reportCount: 0,

          recentReportCount: 0,

          previousReportCount: 0,

          reporterHashes:
            new Set<string>(),

          timeWindows:
            new Set<string>(),

          categories:
            new Map<string, number>(),

          latestReportAt: null,

          firstReportAt: null,
        };

        zoneMap.set(
          report.locationHash,
          zone,
        );
      }

      zone.reportCount += 1;

      if (
        report.createdAt.getTime() >=
        oneDayAgo.getTime()
      ) {
        zone.recentReportCount += 1;
      } else {
        zone.previousReportCount += 1;
      }

      if (
        report.reporterSessionHash
      ) {
        zone.reporterHashes.add(
          report.reporterSessionHash,
        );
      }

      /*
       * Group reports into 6-hour windows.
       * This gives us a privacy-safe signal that
       * activity happened across different periods.
       */
      const sixHourWindow = Math.floor(
        report.occurredAt.getTime() /
          (6 * 60 * 60 * 1000),
      );

      zone.timeWindows.add(
        String(sixHourWindow),
      );

      const category =
        report.category;

      zone.categories.set(
        category,
        (zone.categories.get(
          category,
        ) ?? 0) + 1,
      );

      if (
        !zone.latestReportAt ||
        report.occurredAt >
          zone.latestReportAt
      ) {
        zone.latestReportAt =
          report.occurredAt;
      }

      if (
        !zone.firstReportAt ||
        report.occurredAt <
          zone.firstReportAt
      ) {
        zone.firstReportAt =
          report.occurredAt;
      }
    }

    const eligibleZones =
      Array.from(
        zoneMap.values(),
      ).filter(
        (zone) =>
          zone.reportCount >=
          MIN_REPORTS_FOR_MAP,
      );

    if (
      eligibleZones.length === 0
    ) {
      return NextResponse.json({
        success: true,
        zones: [],
      });
    }

    const eligibleHashes =
      eligibleZones.map(
        (zone) =>
          zone.locationHash,
      );

    const alerts =
      await db
        .select({
          id:
            patternAlerts.id,

          locationHash:
            patternAlerts.locationHash,

          title:
            patternAlerts.title,

          description:
            patternAlerts.description,

          severity:
            patternAlerts.severity,

          confidenceScore:
            patternAlerts.confidenceScore,

          reportCount:
            patternAlerts.reportCount,

          distinctReporterCount:
            patternAlerts.distinctReporterCount,

          distinctTimeWindowCount:
            patternAlerts.distinctTimeWindowCount,

          status:
            patternAlerts.status,

          lastUpdatedAt:
            patternAlerts.lastUpdatedAt,
        })
        .from(patternAlerts)
        .where(
          and(
            inArray(
              patternAlerts.locationHash,
              eligibleHashes,
            ),

            inArray(
              patternAlerts.status,
              ACTIVE_STATUSES,
            ),
          ),
        );

    const alertByZone =
      new Map(
        alerts.map((alert) => [
          alert.locationHash,
          alert,
        ]),
      );

    const zones =
      eligibleZones.map((zone) => {
        const alert =
          alertByZone.get(
            zone.locationHash,
          );

        const trendDirection =
          calculateTrend(
            zone.recentReportCount,
            zone.previousReportCount,
          );

        const confidenceScore =
          alert?.confidenceScore ?? 0;

        const risk =
          calculateRisk(
            zone.reportCount,
            confidenceScore,
            zone.recentReportCount,
            trendDirection,
            alert?.severity ?? null,
          );

        const categories =
          Array.from(
            zone.categories.entries(),
          )
            .sort(
              (a, b) =>
                b[1] - a[1],
            )
            .map(
              ([category]) =>
                category,
            );

        return {
          latitude:
            zone.latitude,

          longitude:
            zone.longitude,

          reportCount:
            zone.reportCount,

          recentReportCount:
            zone.recentReportCount,

          previousReportCount:
            zone.previousReportCount,

          distinctReporterCount:
            alert?.distinctReporterCount ??
            zone.reporterHashes.size,

          distinctTimeWindowCount:
            alert?.distinctTimeWindowCount ??
            zone.timeWindows.size,

          confidenceScore,

          severity:
            alert?.severity ??
            "low",

          risk,

          trendDirection,

          status:
            alert?.status ??
            "new",

          categories,

          latestReportAt:
            zone.latestReportAt?.toISOString() ??
            null,

          firstReportAt:
            zone.firstReportAt?.toISOString() ??
            null,

          alertTitle:
            alert?.title ??
            null,

          alertDescription:
            alert?.description ??
            null,
        };
      });

    return NextResponse.json({
      success: true,
      generatedAt:
        new Date().toISOString(),
      zoneCount: zones.length,
      zones,
    });
  } catch (error) {
    console.error(
      "Safety zones fetch failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load safety zones.",
      },
      {
        status: 500,
      },
    );
  }
}