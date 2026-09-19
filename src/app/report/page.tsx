"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const categories = [
  "Harassment",
  "Following",
  "Loitering",
  "Threatening behaviour",
  "Unsafe environment",
  "Other",
];

export default function ReportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-10">
          <Link
            href="/"
            className="-ml-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="flex-1">
          <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-6" />
          </div>

          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Anonymous safety signal
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            What happened?
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Share a safety concern in a few seconds. You don&apos;t need to
            identify yourself.
          </p>

          <div className="mt-10">
            <p className="text-sm font-medium">
              Choose what best describes it
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    aria-pressed={isSelected}
                    className={[
                      "flex min-h-18 items-center justify-between rounded-2xl border p-5 text-left text-sm font-medium transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-background hover:border-foreground/20 hover:bg-muted/50",
                    ].join(" ")}
                  >
                    <span>{category}</span>

                    {isSelected && (
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <Button
              size="lg"
              className="w-full rounded-xl"
              disabled={!selectedCategory}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-10 border-t pt-5">
          <p className="text-xs leading-5 text-muted-foreground">
            Your report is intended to contribute to aggregated community
            safety patterns. It is not an emergency service.
          </p>
        </div>
      </div>
    </main>
  );
}