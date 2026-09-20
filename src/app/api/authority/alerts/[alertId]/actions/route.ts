import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  authorityActions,
  patternAlerts,
} from "@/db/schema";

const actionSchema = z.object({
  action: z.enum([
    "acknowledge",
    "investigate",
    "resolve",
    "dismiss",
  ]),
  notes: z
    .string()
    .trim()
    .max(
      1000,
      "Notes must be 1000 characters or less",
    )
    .optional()
    .nullable(),
});

const statusByAction = {
  acknowledge: "acknowledged",
  investigate: "investigating",
  resolve: "resolved",
  dismiss: "dismissed",
} as const;

const allowedTransitions: Record<
  string,
  string[]
> = {
  new: [
    "acknowledge",
    "dismiss",
  ],
  acknowledged: [
    "investigate",
    "dismiss",
  ],
  investigating: [
    "resolve",
    "dismiss",
  ],
  resolved: [],
  dismissed: [],
};

type RouteContext = {
  params: Promise<{
    alertId: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { alertId } =
      await context.params;

    const body: unknown =
      await request.json();

    const result =
      actionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid authority action.",
          issues:
            result.error.issues,
        },
        { status: 400 },
      );
    }

    const alert =
      await db
        .select({
          id: patternAlerts.id,
          status: patternAlerts.status,
        })
        .from(patternAlerts)
        .where(
          eq(
            patternAlerts.id,
            alertId,
          ),
        )
        .limit(1);

    if (alert.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pattern alert not found.",
        },
        { status: 404 },
      );
    }

    const currentStatus =
      alert[0].status;

    const requestedAction =
      result.data.action;

    const allowedActions =
      allowedTransitions[
        currentStatus
      ] ?? [];

    if (
      !allowedActions.includes(
        requestedAction,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Action "${requestedAction}" is not allowed when the alert status is "${currentStatus}".`,
        },
        { status: 409 },
      );
    }

    const newStatus =
      statusByAction[
        requestedAction
      ];

    const createdAction =
      await db
        .insert(authorityActions)
        .values({
          alertId,
          action: requestedAction,
          notes:
            result.data.notes ??
            null,
        })
        .returning({
          id: authorityActions.id,
          alertId:
            authorityActions.alertId,
          action:
            authorityActions.action,
          notes:
            authorityActions.notes,
          createdAt:
            authorityActions.createdAt,
        });

    await db
      .update(patternAlerts)
      .set({
        status: newStatus,
        lastUpdatedAt:
          new Date(),
      })
      .where(
        eq(
          patternAlerts.id,
          alertId,
        ),
      );

    return NextResponse.json(
      {
        success: true,
        action:
          createdAction[0],
        alert: {
          id: alertId,
          previousStatus:
            currentStatus,
          status: newStatus,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Authority action failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to record authority action.",
      },
      { status: 500 },
    );
  }
}