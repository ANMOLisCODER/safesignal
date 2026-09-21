import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

import { db } from "@/db";
import { patternAlerts } from "@/db/schema";

const alertIdSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{
    alertId: string;
  }>;
};

type AiResponse = {
  explanation?: string;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { alertId } =
      await context.params;

    const parsed =
      alertIdSchema.safeParse(alertId);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid alert ID.",
        },
        { status: 400 },
      );
    }

    const [alert] =
      await db
        .select({
          id: patternAlerts.id,
          aiExplanation:
            patternAlerts.aiExplanation,
        })
        .from(patternAlerts)
        .where(
          eq(
            patternAlerts.id,
            alertId,
          ),
        )
        .limit(1);

    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pattern alert not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      explanation:
        alert.aiExplanation ?? null,
    });
  } catch (error) {
    console.error(
      "AI explanation fetch failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load AI explanation.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { alertId } =
      await context.params;

    const parsed =
      alertIdSchema.safeParse(alertId);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid alert ID.",
        },
        { status: 400 },
      );
    }

    const [alert] =
      await db
        .select({
          id: patternAlerts.id,
          title: patternAlerts.title,
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
          description:
            patternAlerts.description,
          aiExplanation:
            patternAlerts.aiExplanation,
        })
        .from(patternAlerts)
        .where(
          eq(
            patternAlerts.id,
            alertId,
          ),
        )
        .limit(1);

    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pattern alert not found.",
        },
        { status: 404 },
      );
    }

    /*
     * IMPORTANT:
     * If an explanation already exists,
     * do NOT call Groq again.
     */
    if (alert.aiExplanation) {
      return NextResponse.json({
        success: true,
        explanation:
          alert.aiExplanation,
        cached: true,
      });
    }

    const apiKey =
      process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GROQ_API_KEY is not configured.",
        },
        { status: 500 },
      );
    }

    const groq = new Groq({
      apiKey,
    });

    const systemPrompt = `
You are SafeSignal's pattern explanation assistant.

Your task is to explain why a community safety
pattern alert was generated.

Use ONLY the supplied alert metrics.

Never invent numbers.
Never identify individuals.
Never expose exact locations.
Never claim certainty.
Never claim that an incident definitely occurred.

The pattern engine is the source of truth.

Write one concise factual explanation in plain text.

Mention the important supporting signals:
- report volume
- distinct reporter count
- distinct time periods
- confidence
- severity

Keep the explanation between 50 and 90 words.

Do not use JSON.
Do not use Markdown.
Do not add headings.
Do not add quotation marks around the response.

Return ONLY the explanation text.
`;

    const userPrompt = `
Alert title: ${alert.title}

Severity: ${alert.severity}

Confidence: ${Math.round(
      alert.confidenceScore * 100,
    )}%

Reports: ${alert.reportCount}

Distinct reporter sessions:
${alert.distinctReporterCount}

Distinct time periods:
${alert.distinctTimeWindowCount}

Description:
${alert.description ?? "No additional description."}
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
      });

    const explanation =
      response.choices[0]?.message?.content
        ?.trim();

    if (!explanation) {
      throw new Error(
        "Groq returned an empty explanation.",
      );
    }

    /*
     * Save explanation permanently.
     *
     * Future requests use the database
     * instead of calling Groq again.
     */
    await db
      .update(patternAlerts)
      .set({
        aiExplanation:
          explanation,
        lastUpdatedAt:
          new Date(),
      })
      .where(
        eq(
          patternAlerts.id,
          alertId,
        ),
      );

    console.log(
      `[AI Pattern Explanation] Generated explanation for ${alertId}.`,
    );

    return NextResponse.json({
      success: true,
      explanation,
      cached: false,
    });
  } catch (error) {
    console.error(
      "AI pattern explanation generation failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to generate AI explanation.",
      },
      { status: 500 },
    );
  }
}