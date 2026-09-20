"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    value: "harassment",
    label: "Harassment",
    description: "Unwanted comments, gestures, or attention",
  },
  {
    value: "loitering",
    label: "Loitering",
    description: "Suspicious or persistent presence",
  },
  {
    value: "unsafe_behavior",
    label: "Unsafe behaviour",
    description: "Behaviour that made the area feel unsafe",
  },
  {
    value: "stalking",
    label: "Stalking",
    description: "Repeated following or unwanted pursuit",
  },
  {
    value: "verbal_abuse",
    label: "Verbal abuse",
    description: "Threatening, insulting, or abusive language",
  },
  {
    value: "threat",
    label: "Threat",
    description: "A direct or immediate threat",
  },
  {
    value: "other",
    label: "Other",
    description: "Another safety concern",
  },
];

export default function ReportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null,
  );

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-10">
          <Link
            href="/"
            className="-ml-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <div className="flex-1">
          <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldAlert className="size-6" />
          </div>

          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Step 1 of 3
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            What happened?
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Choose the option that best describes the safety concern. You can
            report anonymously in just a few seconds.
          </p>

          <div className="mt-10 space-y-3">
            {categories.map((category) => {
              const selected = selectedCategory === category.value;

              return (
                <Card
                  key={category.value}
                  className={[
                    "rounded-2xl transition-all",
                    selected
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/40",
                  ].join(" ")}
                >
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      aria-pressed={selected}
                      className="flex min-h-20 w-full items-center gap-4 p-4 text-left sm:p-5"
                    >
                      <div
                        className={[
                          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        ].join(" ")}
                      >
                        {selected ? (
                          <Check className="size-5" />
                        ) : (
                          <ShieldAlert className="size-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {category.label}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {category.description}
                        </p>
                      </div>

                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8">
            {selectedCategory ? (
  <Link
    href={`/report/location?category=${encodeURIComponent(
      selectedCategory,
    )}`}
    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 sm:h-11"
  >
    Continue
    <ArrowRight className="size-4" />
  </Link>
) : (
  <Button
    size="lg"
    className="w-full rounded-xl"
    disabled
  >
    Continue
    <ArrowRight className="size-4" />
  </Button>
)}
          </div>
        </div>

        <div className="mt-10 border-t pt-5">
          <p className="text-xs leading-5 text-muted-foreground">
            Do not include names, phone numbers, home addresses, or other
            personally identifying information in your report.
          </p>
        </div>
      </div>
    </main>
  );
}