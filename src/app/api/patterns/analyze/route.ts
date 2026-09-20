import { NextResponse } from "next/server";
import { z } from "zod";

import {
  analyzeLocationPattern,
  createOrUpdatePatternAlert,
} from "@/lib/pattern-engine";

const analyzeSchema = z.object({
  locationHash: z.string().min(1),
});

export async function POST(
  request: Request,
) {
  try {
    const body: unknown = await request.json();

    const result =
      analyzeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid location hash.",
        },
        { status: 400 },
      );
    }

    const analysis =
      await analyzeLocationPattern(
        result.data.locationHash,
      );

    if (!analysis) {
      return NextResponse.json({
        success: true,
        alertCreated: false,
        message:
          "Not enough diverse signals to create a pattern alert.",
      });
    }

    const alert =
      await createOrUpdatePatternAlert(
        analysis,
      );

    return NextResponse.json({
      success: true,
      alertCreated: true,
      alertId: alert?.id,
      analysis,
    });
  } catch (error) {
    console.error(
      "Pattern analysis failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to analyze safety pattern.",
      },
      { status: 500 },
    );
  }
}