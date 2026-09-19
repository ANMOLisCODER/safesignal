"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LocateFixed,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type LocationMethod = "current" | "manual" | null;

export default function ReportLocationPage() {
  const [locationMethod, setLocationMethod] =
    useState<LocationMethod>(null);

  const canContinue = locationMethod !== null;

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-10">
          <Link
            href="/report"
            className="-ml-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <div className="flex-1">
          <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <MapPin className="size-6" />
          </div>

          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Step 2 of 3
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Where did it happen?
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            A general location helps SafeSignal identify patterns. Choose how
            you want to describe where the incident happened.
          </p>

          <div className="mt-10 space-y-4">
            <Card
              className={[
                "rounded-2xl transition-all",
                locationMethod === "current"
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/40",
              ].join(" ")}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => setLocationMethod("current")}
                  aria-pressed={locationMethod === "current"}
                  className="flex min-h-24 w-full items-center gap-4 p-5 text-left"
                >
                  <div
                    className={[
                      "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      locationMethod === "current"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    ].join(" ")}
                  >
                    {locationMethod === "current" ? (
                      <Check className="size-5" />
                    ) : (
                      <LocateFixed className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Use my current location
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Share your approximate location for this safety signal.
                    </p>
                  </div>

                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>

            <Card
              className={[
                "rounded-2xl transition-all",
                locationMethod === "manual"
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/40",
              ].join(" ")}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => setLocationMethod("manual")}
                  aria-pressed={locationMethod === "manual"}
                  className="flex min-h-24 w-full items-center gap-4 p-5 text-left"
                >
                  <div
                    className={[
                      "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      locationMethod === "manual"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    ].join(" ")}
                  >
                    {locationMethod === "manual" ? (
                      <Check className="size-5" />
                    ) : (
                      <MapPin className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Choose location manually
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Select a nearby area without sharing your exact
                      position.
                    </p>
                  </div>

                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Button
              size="lg"
              className="w-full rounded-xl"
              disabled={!canContinue}
              onClick={() => {
                if (!canContinue) {
                  return;
                }

                window.location.href = "/report/details";
              }}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-10 border-t pt-5">
          <p className="text-xs leading-5 text-muted-foreground">
            SafeSignal is designed to use location for aggregated safety
            patterns. Avoid including personally identifying information in
            your report.
          </p>
        </div>
      </div>
    </main>
  );
}