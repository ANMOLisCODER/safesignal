"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_LENGTH = 500;

const validCategories = [
  "harassment",
  "loitering",
  "unsafe_behavior",
  "stalking",
  "verbal_abuse",
  "threat",
  "other",
] as const;

type ReportCategory = (typeof validCategories)[number];

type ReportDraft = {
  category: ReportCategory;
  locationMethod: "current" | "manual";
  latitude: number | null;
  longitude: number | null;
};

export default function ReportDetailsPage() {
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [details, setDetails] = useState("");
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const remainingCharacters = MAX_LENGTH - details.length;

  useEffect(() => {
    try {
      const storedDraft = sessionStorage.getItem(
        "safesignal-report-draft",
      );

      if (!storedDraft) {
        setSubmitError(
          "Your report session could not be found. Please start again.",
        );
        return;
      }

      const parsed = JSON.parse(storedDraft) as Partial<ReportDraft>;

      const validCategory = validCategories.includes(
        parsed.category as ReportCategory,
      );

      const validLocationMethod =
        parsed.locationMethod === "current" ||
        parsed.locationMethod === "manual";

      if (!validCategory || !validLocationMethod) {
        setSubmitError(
          "Your report details are incomplete. Please start again.",
        );
        return;
      }

      setDraft({
        category: parsed.category as ReportCategory,
        locationMethod:
          parsed.locationMethod as "current" | "manual",
        latitude:
          typeof parsed.latitude === "number"
            ? parsed.latitude
            : null,
        longitude:
          typeof parsed.longitude === "number"
            ? parsed.longitude
            : null,
      });
    } catch {
      setSubmitError(
        "Unable to read your report session. Please start again.",
      );
    } finally {
      setIsLoadingDraft(false);
    }
  }, []);

  async function handleSubmit() {
    if (!draft || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const storageKey = "safesignal-anonymous-session";

      let anonymousSessionId = sessionStorage.getItem(storageKey);

      if (!anonymousSessionId) {
        anonymousSessionId = crypto.randomUUID();
        sessionStorage.setItem(storageKey, anonymousSessionId);
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: draft.category,
          description: details.trim() || null,
          latitude: draft.latitude,
          longitude: draft.longitude,
          reporterSessionId: anonymousSessionId,
          occurredAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to submit report.",
        );
      }

      sessionStorage.removeItem("safesignal-report-draft");

      window.location.href = "/report/success";
    } catch (error) {
      console.error("Report submission failed:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your report. Please try again.",
      );

      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-10">
          <Link
            href="/report/location"
            className="-ml-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <div className="flex-1">
          <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <FileText className="size-6" />
          </div>

          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Step 3 of 3
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Add a little context
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            This is optional. A short description can help identify patterns
            without asking you to provide personal information.
          </p>

          <div className="mt-10">
            <Label htmlFor="details" className="text-sm font-medium">
              What would you like others to know?
            </Label>

            <Textarea
              id="details"
              value={details}
              onChange={(event) =>
                setDetails(
                  event.target.value.slice(0, MAX_LENGTH),
                )
              }
              placeholder="For example: I noticed this happening repeatedly near the station entrance..."
              className="mt-3 min-h-36 resize-none rounded-2xl p-4"
              maxLength={MAX_LENGTH}
              disabled={isLoadingDraft || isSubmitting}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
              <span>
                Please don't include names, phone numbers, addresses, or
                other identifying information.
              </span>

              <span className="shrink-0">
                {remainingCharacters}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border bg-muted/30 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-medium">
                  Your report is anonymous
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  SafeSignal is designed to use reports as aggregated
                  community signals rather than exposing individual reporters.
                </p>
              </div>
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {submitError}
            </div>
          )}

          <div className="mt-8">
            <Button
              size="lg"
              className="w-full rounded-xl"
              disabled={
                !draft ||
                isLoadingDraft ||
                isSubmitting
              }
              onClick={handleSubmit}
            >
              {isSubmitting
                ? "Submitting..."
                : "Submit anonymous signal"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-10 border-t pt-5">
          <p className="text-xs leading-5 text-muted-foreground">
            This feature is for reporting community safety signals. It is not
            an emergency service. If you are in immediate danger, contact the
            appropriate emergency service.
          </p>
        </div>
      </div>
    </main>
  );
}