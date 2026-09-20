import { createHmac } from "crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { reports } from "@/db/schema";

const reportSchema = z.object({
  category: z.enum([
    "harassment",
    "loitering",
    "unsafe_behavior",
    "stalking",
    "verbal_abuse",
    "threat",
    "other",
  ]),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Description must be 500 characters or less",
    )
    .optional()
    .nullable(),

  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional(),

  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional(),

  reporterSessionId: z
    .string()
    .uuid()
    .optional()
    .nullable(),

  occurredAt: z.coerce.date(),
});

const GRID_SIZE = 0.003;

const REPORT_COOLDOWN_MINUTES = 2;

const HOURLY_REPORT_LIMIT = 10;

const SAME_SIGNAL_WINDOW_MINUTES = 30;

function createLocationHash(
  latitude: number,
  longitude: number,
): string {
  const latitudeCell = Math.floor(
    latitude / GRID_SIZE,
  );

  const longitudeCell = Math.floor(
    longitude / GRID_SIZE,
  );

  const cell =
    `v1:${latitudeCell}:${longitudeCell}`;

  const secret =
    process.env.LOCATION_HASH_SECRET;

  if (!secret) {
    throw new Error(
      "LOCATION_HASH_SECRET is not configured",
    );
  }

  return `v1_${createHmac(
    "sha256",
    secret,
  )
    .update(cell)
    .digest("hex")
    .slice(0, 32)}`;
}

function createReporterSessionHash(
  sessionId: string,
): string {
  const secret =
    process.env.LOCATION_HASH_SECRET;

  if (!secret) {
    throw new Error(
      "LOCATION_HASH_SECRET is not configured",
    );
  }

  return createHmac(
    "sha256",
    secret,
  )
    .update(
      `reporter:v1:${sessionId}`,
    )
    .digest("hex")
    .slice(0, 32);
}

function getAbuseScore(
  hourlyCount: number,
  duplicateCount: number,
) {
  const hourlyPressure = Math.min(
    hourlyCount / HOURLY_REPORT_LIMIT,
    1,
  );

  const duplicatePressure = Math.min(
    duplicateCount / 5,
    1,
  );

  const score =
    hourlyPressure * 0.6 +
    duplicatePressure * 0.4;

  return Number(score.toFixed(3));
}

export async function POST(
  request: Request,
) {
  try {
    const body: unknown =
      await request.json();

    const result =
      reportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid report data.",
          issues:
            result.error.issues,
        },
        { status: 400 },
      );
    }

    const data = result.data;

    let locationHash =
      "manual-pending";

    if (
      data.latitude !== null &&
      data.latitude !== undefined &&
      data.longitude !== null &&
      data.longitude !== undefined
    ) {
      locationHash =
        createLocationHash(
          data.latitude,
          data.longitude,
        );
    }

    let reporterSessionHash:
      | string
      | null = null;

    if (data.reporterSessionId) {
      reporterSessionHash =
        createReporterSessionHash(
          data.reporterSessionId,
        );
    }

    const now = new Date();

    /*
     * Anonymous reporter rate limiting.
     *
     * If no reporter session exists,
     * we cannot apply session-based
     * anti-flood checks.
     */
    if (reporterSessionHash) {
      const cooldownSince =
        new Date(
          now.getTime() -
            REPORT_COOLDOWN_MINUTES *
              60 *
              1000,
        );

      const hourlySince =
        new Date(
          now.getTime() -
            60 * 60 * 1000,
        );

      const recentReports =
        await db
          .select({
            id: reports.id,
            category:
              reports.category,
            locationHash:
              reports.locationHash,
            isDuplicate:
              reports.isDuplicate,
            createdAt:
              reports.createdAt,
          })
          .from(reports)
          .where(
            and(
              eq(
                reports
                  .reporterSessionHash,
                reporterSessionHash,
              ),
              gte(
                reports.createdAt,
                hourlySince,
              ),
            ),
          );

      const hourlyCount =
        recentReports.length;

      if (
        hourlyCount >=
        HOURLY_REPORT_LIMIT
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Too many reports from this anonymous session. Please try again later.",
          },
          { status: 429 },
        );
      }

      const cooldownMatch =
        recentReports.some(
          (report) =>
            report.createdAt >=
              cooldownSince &&
            report.locationHash ===
              locationHash &&
            report.category ===
              data.category,
        );

      if (cooldownMatch) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A similar signal was already submitted recently from this session.",
          },
          { status: 429 },
        );
      }

      const sameSignalSince =
        new Date(
          now.getTime() -
            SAME_SIGNAL_WINDOW_MINUTES *
              60 *
              1000,
        );

      const duplicateCount =
        recentReports.filter(
          (report) =>
            report.createdAt >=
              sameSignalSince &&
            report.locationHash ===
              locationHash &&
            report.category ===
              data.category,
        ).length;

      const abuseScore =
        getAbuseScore(
          hourlyCount,
          duplicateCount,
        );

      const isDuplicate =
        duplicateCount >= 2;

      const inserted =
        await db
          .insert(reports)
          .values({
            category:
              data.category,
            description:
              data.description ??
              null,
            locationHash,
            reporterSessionHash,
            occurredAt:
              data.occurredAt,
            isDuplicate,
            abuseScore,
          })
          .returning({
            id: reports.id,
            isDuplicate:
              reports.isDuplicate,
            abuseScore:
              reports.abuseScore,
          });

      return NextResponse.json(
        {
          success: true,
          reportId:
            inserted[0]?.id,
          isDuplicate:
            inserted[0]?.isDuplicate ??
            false,
          abuseScore:
            inserted[0]?.abuseScore ??
            0,
        },
        { status: 201 },
      );
    }

    /*
     * Reports without a reporter
     * session can still be stored,
     * but receive no session-based
     * abuse signal.
     */
    const inserted =
      await db
        .insert(reports)
        .values({
          category:
            data.category,
          description:
            data.description ??
            null,
          locationHash,
          reporterSessionHash:
            null,
          occurredAt:
            data.occurredAt,
          isDuplicate: false,
          abuseScore: 0,
        })
        .returning({
          id: reports.id,
        });

    return NextResponse.json(
      {
        success: true,
        reportId:
          inserted[0]?.id,
        isDuplicate: false,
        abuseScore: 0,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Report creation failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to submit safety report.",
      },
      { status: 500 },
    );
  }
}