import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

import { db } from "@/db";
import {
  moderationStatusEnum,
  reports,
} from "@/db/schema";
import {
  analyzeLocationPattern,
  createOrUpdatePatternAlert,
} from "@/lib/pattern-engine";

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

type ModerationResult = {
  status:
    | "approved"
    | "flagged"
    | "blocked";

  score: number;

  reason: string;

  piiDetected: boolean;
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

function parseModerationResponse(
  content: string,
): ModerationResult | null {
  try {
    const cleaned = content
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed: unknown =
      JSON.parse(cleaned);

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return null;
    }

    const value =
      parsed as Record<string, unknown>;

    const status =
      value.status;

    const score =
      value.score;

    const reason =
      value.reason;

    const piiDetected =
      value.piiDetected;

    if (
      status !== "approved" &&
      status !== "flagged" &&
      status !== "blocked"
    ) {
      return null;
    }

    if (
      typeof score !== "number" ||
      score < 0 ||
      score > 1
    ) {
      return null;
    }

    if (
      typeof reason !== "string"
    ) {
      return null;
    }

    if (
      typeof piiDetected !== "boolean"
    ) {
      return null;
    }

    return {
      status,
      score,
      reason: reason.slice(0, 500),
      piiDetected,
    };
  } catch {
    return null;
  }
}

async function moderateReport(
  category: string,
  description: string | null,
): Promise<ModerationResult> {
  const fallback: ModerationResult = {
    status: "approved",
    score: 0,
    reason:
      "AI moderation unavailable; report accepted with fallback moderation.",
    piiDetected: false,
  };

  if (!description?.trim()) {
    return {
      status: "approved",
      score: 0,
      reason:
        "No description provided for AI moderation.",
      piiDetected: false,
    };
  }

  const apiKey =
    process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn(
      "GROQ_API_KEY is not configured. Using moderation fallback.",
    );

    return fallback;
  }

  try {
    const groq =
      new Groq({
        apiKey,
      });

    const systemPrompt = `
You are SafeSignal's report moderation assistant.

Your task is to classify a short anonymous public-safety report.

Use ONLY the supplied category and description.

Return ONLY valid JSON with exactly these fields:

{
  "status": "approved" | "flagged" | "blocked",
  "score": number,
  "reason": "short explanation",
  "piiDetected": boolean
}

Rules:

- approved:
  Relevant public-safety report with no obvious malicious or abusive content.

- flagged:
  Potential spam, unclear content, suspicious content, excessive personal information, or content that needs review.

- blocked:
  Clearly malicious, threatening toward the platform, sexually explicit unrelated content, deliberate spam, or obvious attempts to abuse the reporting system.

- score must be between 0 and 1.
- Higher score means greater moderation concern.
- Detect obvious personal information such as phone numbers, email addresses, full home addresses, or other direct contact details.
- Do not treat a normal description of an incident as malicious.
- Do not invent facts.
- Do not identify individuals.
- Keep reason under 200 characters.
- Return JSON only.
`;

    const userPrompt = `
Report category:
${category}

Report description:
${description}
`;

    const response =
      await groq.chat.completions.create({
        model:
          "openai/gpt-oss-20b",

        messages: [
          {
            role: "system",
            content:
              systemPrompt,
          },
          {
            role: "user",
            content:
              userPrompt,
          },
        ],

        temperature: 0,

        max_completion_tokens: 500,

        include_reasoning: false,

        response_format: {
          type: "json_object",
        },
      });

    const content =
      response.choices[0]?.message?.content;

    if (!content) {
      console.warn(
        "Groq returned empty moderation response. Using fallback.",
      );

      return fallback;
    }

    const parsed =
      parseModerationResponse(
        content,
      );

    if (!parsed) {
      console.warn(
        "Unable to parse Groq moderation response. Using fallback.",
      );

      return fallback;
    }

    return parsed;
  } catch (error) {
    console.error(
      "AI moderation failed. Using fallback:",
      error,
    );

    return fallback;
  }
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

    const moderation =
      await moderateReport(
        data.category,
        data.description ?? null,
      );

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

          moderationStatus:
            moderation.status,

          moderationScore:
            moderation.score,

          moderationReason:
            moderation.reason,

          piiDetected:
            moderation.piiDetected,

          abuseScore:
            moderation.score,
        })
        .returning({
          id: reports.id,
        });

    // Automatically analyze the same privacy-safe zone
    // after a successful report is stored.
    let patternAlertId:
      | string
      | null = null;

    let patternAnalyzed = false;

    if (locationHash !== "manual-pending") {
      try {
        const analysis =
          await analyzeLocationPattern(
            locationHash,
          );

        if (analysis) {
          const alert =
            await createOrUpdatePatternAlert(
              analysis,
            );

          patternAlertId =
            alert?.id ?? null;

          patternAnalyzed = true;
        }
      } catch (patternError) {
        console.error(
          "Automatic pattern analysis failed:",
          patternError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,

        reportId:
          report[0]?.id,

        moderation: {
          status:
            moderation.status,

          score:
            moderation.score,

          piiDetected:
            moderation.piiDetected,
        },

        pattern: {
          analyzed:
            patternAnalyzed,

          alertId:
            patternAlertId,
        },
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