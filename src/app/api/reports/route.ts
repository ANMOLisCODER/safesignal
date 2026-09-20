import { createHmac } from "crypto";
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

type ZoneCoordinates = {
  latitude: number;
  longitude: number;
};

function getZoneCoordinates(
  latitude: number,
  longitude: number,
): ZoneCoordinates {
  const latitudeCell = Math.floor(
    latitude / GRID_SIZE,
  );

  const longitudeCell = Math.floor(
    longitude / GRID_SIZE,
  );

  return {
    latitude:
      (latitudeCell + 0.5) *
      GRID_SIZE,

    longitude:
      (longitudeCell + 0.5) *
      GRID_SIZE,
  };
}

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

    let zoneLatitude:
      | number
      | null = null;

    let zoneLongitude:
      | number
      | null = null;

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

      const zone =
        getZoneCoordinates(
          data.latitude,
          data.longitude,
        );

      zoneLatitude =
        zone.latitude;

      zoneLongitude =
        zone.longitude;
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

    const report =
      await db
        .insert(reports)
        .values({
          category: data.category,
          description:
            data.description ?? null,
          locationHash,
          zoneLatitude,
          zoneLongitude,
          reporterSessionHash,
          occurredAt:
            data.occurredAt,
        })
        .returning({
          id: reports.id,
        });

    return NextResponse.json(
      {
        success: true,
        reportId:
          report[0]?.id,
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