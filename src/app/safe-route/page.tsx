"use client";

import dynamic from "next/dynamic";

const SafeRoute = dynamic(
  () =>
    import(
      "@/components/safety/safe-route"
    ).then(
      (module) =>
        module.SafeRoute,
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[560px] items-center justify-center rounded-3xl border bg-muted/20">
        <div className="rounded-xl border bg-background px-4 py-3 text-sm shadow-sm">
          Loading route planner...
        </div>
      </div>
    ),
  },
);

export default function SafeRoutePage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-8">
          <p className="text-sm font-medium text-primary">
            SafeSignal
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Safe Route
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Plan a route and see privacy-safe aggregated
            safety signals near it. SafeSignal does not
            expose individual reports or exact report
            locations.
          </p>
        </header>

        <SafeRoute />

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 size-3 rounded-full bg-green-500" />

            <h2 className="font-medium">
              Aggregated signals
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Route context is calculated from qualifying
              coarse safety zones rather than individual
              reports.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 size-3 rounded-full bg-yellow-500" />

            <h2 className="font-medium">
              Risk context
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Rising activity and higher-risk zones can be
              surfaced when they are near the route.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 size-3 rounded-full bg-red-500" />

            <h2 className="font-medium">
              Privacy first
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Exact report coordinates and individual
              reporter information are never displayed.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}