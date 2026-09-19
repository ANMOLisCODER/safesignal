"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function ReportDetailsPage() {
  const [details, setDetails] = useState("");

  const remainingCharacters = MAX_LENGTH - details.length;

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
              onChange={(event) => setDetails(event.target.value.slice(0, MAX_LENGTH))}
              placeholder="For example: I noticed this happening repeatedly near the station entrance..."
              className="mt-3 min-h-36 resize-none rounded-2xl p-4"
              maxLength={MAX_LENGTH}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
              <span>
                Please don't include names, phone numbers, addresses, or other
                identifying information.
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

          <div className="mt-8">
            <Button
              size="lg"
              className="w-full rounded-xl"
              onClick={() => {
                window.location.href = "/report/success";
              }}
            >
              Submit anonymous signal
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