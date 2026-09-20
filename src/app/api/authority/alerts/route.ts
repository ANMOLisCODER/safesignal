import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { patternAlerts } from "@/db/schema";

export async function GET() {
  try {
    const alerts = await db
      .select({
        id: patternAlerts.id,
        locationHash:
          patternAlerts.locationHash,
        title: patternAlerts.title,
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
        firstDetectedAt:
          patternAlerts.firstDetectedAt,
        lastUpdatedAt:
          patternAlerts.lastUpdatedAt,
      })
      .from(patternAlerts)
      .orderBy(
        desc(patternAlerts.lastUpdatedAt),
      );

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error(
      "Authority alerts fetch failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load authority alerts.",
      },
      { status: 500 },
    );
  }
}