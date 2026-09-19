import Link from "next/link";
import { CheckCircle2, Map, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ReportSuccessPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col items-center justify-center px-4 py-8 text-center sm:px-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="size-8" />
        </div>

        <p className="mt-6 text-sm font-medium text-muted-foreground">
          Signal received
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Thank you for speaking up.
        </h1>

        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
          Your anonymous safety signal can contribute to identifying emerging
          patterns in the community.
        </p>

        <div className="mt-8 w-full max-w-md rounded-2xl border bg-muted/30 p-5 text-left">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-medium">
                Your identity wasn't requested
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Reports are intended to be analyzed in aggregate rather than
                exposing individual reporters.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
  <Link
    href="/"
    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
  >
    Back to dashboard
  </Link>

  <Link
    href="/report"
    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
  >
    Report another signal
  </Link>
</div>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Map className="size-4" />
            Explore safety signals
          </Link>
        </div>
      </div>
    </main>
  );
}