import { NextResponse } from "next/server";
import { z } from "zod";

const assistantRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(
      1000,
      "Message must be 1000 characters or less.",
    ),
});

function createSafetyResponse(
  message: string,
): string {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes("immediate danger") ||
    normalized.includes("danger") ||
    normalized.includes("attack") ||
    normalized.includes("following me") ||
    normalized.includes("help me")
  ) {
    return "If you are in immediate danger, move toward a busy or trusted public place and contact the appropriate local emergency service. If possible, call someone you trust and share your location. SafeSignal can help with community safety signals, but it is not an emergency service.";
  }

  if (
    normalized.includes("report") ||
    normalized.includes("harassment") ||
    normalized.includes("stalking") ||
    normalized.includes("loitering")
  ) {
    return "You can submit an anonymous safety signal through SafeSignal. Choose the type of concern, provide a coarse location, optionally add context, and submit it. Individual reports are designed to remain private while aggregated patterns can help identify emerging safety concerns.";
  }

  if (
    normalized.includes("map") ||
    normalized.includes("area") ||
    normalized.includes("zone") ||
    normalized.includes("safe")
  ) {
    return "SafeSignal's safety map shows aggregated zones only when enough community signals are available. It intentionally avoids displaying individual reports or exact reporter locations.";
  }

  return "I can help you understand SafeSignal, submit a safety signal, interpret aggregated safety zones, or think through practical steps if you feel unsafe. If you are in immediate danger, contact the appropriate local emergency service.";
}

export async function POST(
  request: Request,
) {
  try {
    const body: unknown =
      await request.json();

    const result =
      assistantRequestSchema.safeParse(
        body,
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error.issues[0]?.message ??
            "Invalid message.",
        },
        { status: 400 },
      );
    }

    const response =
      createSafetyResponse(
        result.data.message,
      );

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error(
      "Assistant request failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process your message.",
      },
      { status: 500 },
    );
  }
}