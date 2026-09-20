
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

export async function GET() {
  try {
    const recentReports =
      await db
        .select({
          locationHash:
            reports.locationHash,
          zoneLatitude:
            reports.zoneLatitude,
          zoneLongitude:
            reports.zoneLongitude,
        })
        .from(reports)
        .where(
          and(
            gte(
              reports.createdAt,
              new Date(
                Date.now() -
                  7 * 24 * 60 * 60 * 1000,
              ),
            ),
          ),
        );

    const zoneCounts = new Map<
      string,
      {
        locationHash: string;
        latitude: number;
        longitude: number;
        reportCount: number;
      }
    >();

    for (const report of recentReports) {
      if (
        report.zoneLatitude === null ||
        report.zoneLongitude === null
      ) {
        continue;
      }

      const existing =
        zoneCounts.get(
          report.locationHash,
        );

      if (existing) {
        existing.reportCount += 1;
        continue;
      }

      zoneCounts.set(
        report.locationHash,
        {
          locationHash:
            report.locationHash,
          latitude:
            report.zoneLatitude,
          longitude:
            report.zoneLongitude,
          reportCount: 1,
        },
      );
    }

    const eligibleZones =
      Array.from(
        zoneCounts.values(),
      ).filter(
        (zone) =>
          zone.reportCount >=
          MIN_REPORTS_FOR_MAP,
      );

    if (eligibleZones.length === 0) {
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
          locationHash:
            patternAlerts.locationHash,
          severity:
            patternAlerts.severity,
          confidenceScore:
            patternAlerts.confidenceScore,
          status:
            patternAlerts.status,
          reportCount:
            patternAlerts.reportCount,
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

    const zones = eligibleZones.map(
      (zone) => {
        const alert =
          alertByZone.get(
            zone.locationHash,
          );

        return {
          latitude: zone.latitude,
          longitude: zone.longitude,
          reportCount:
            zone.reportCount,
          severity:
            alert?.severity ??
            "low",
          confidenceScore:
            alert?.confidenceScore ??
            0,
          status:
            alert?.status ??
            "new",
        };
      },
    );

    return NextResponse.json({
      success: true,
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
      { status: 500 },
    );
  }
}