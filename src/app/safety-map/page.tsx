"use client";

import dynamic from "next/dynamic";

const SafetyMap = dynamic(
  () =>
    import("@/components/safety/safety-map").then(
      (module) => module.SafetyMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-3xl border bg-muted/20">
        <div className="rounded-xl border bg-background px-4 py-3 text-sm shadow-sm">
          Loading safety map...
        </div>
      </div>
    ),
  },
);

export default function SafetyMapPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-primary">
            SafeSignal
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Live safety map
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            View aggregated community safety signals
            across public areas. Individual reports and
            exact locations are never shown on this map.
          </p>
        </header>

        <section>
          <SafetyMap />
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 size-3 rounded-full bg-green-500" />

            <h2 className="font-medium">
              Lower signal
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Aggregated reports meeting the public
              visibility threshold.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 size-3 rounded-full bg-yellow-500" />

            <h2 className="font-medium">
              Emerging signal
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Areas where the safety signal is becoming
              more notable.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 size-3 rounded-full bg-red-500" />

            <h2 className="font-medium">
              Critical signal
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Higher-confidence aggregated safety
              patterns requiring attention.
            </p>
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          Map zones are intentionally coarse and only
          appear after multiple signals are available.
        </p>
      </div>
    </main>
  );
}