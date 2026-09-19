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
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),

  latitude: z.number().min(-90).max(90).nullable().optional(),

  longitude: z.number().min(-180).max(180).nullable().optional(),

  locationHash: z
    .string()
    .trim()
    .min(1)
    .max(100),

  occurredAt: z.coerce.date(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const result = reportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid report data.",
          issues: result.error.issues,
        },
        { status: 400 },
      );
    }

    const data = result.data;

    const report = await db
      .insert(reports)
      .values({
        category: data.category,
        description: data.description ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        locationHash: data.locationHash,
        occurredAt: data.occurredAt,
      })
      .returning({
        id: reports.id,
      });

    return NextResponse.json(
      {
        success: true,
        reportId: report[0]?.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Report creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to submit safety report.",
      },
      { status: 500 },
    );
  }
}