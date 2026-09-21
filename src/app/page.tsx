import Link from "next/link";
import {
  ArrowUpRight,
  FileWarning,
  Map,
  Newspaper,
  Route,
  Shield,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppShell } from "@/components/shell/app-shell";

const stats = [
  {
    title: "Community reports",
    value: "1,284",
    change: "+12.4%",
    description: "from the previous 7 days",
    icon: FileWarning,
  },
  {
    title: "Active safety zones",
    value: "18",
    change: "+3",
    description: "emerging patterns detected",
    icon: Map,
  },
  {
    title: "Verified signals",
    value: "847",
    change: "66%",
    description: "of recent reports",
    icon: ShieldCheck,
  },
  {
    title: "Community reach",
    value: "24.8K",
    change: "+8.2%",
    description: "people protected by signals",
    icon: Users,
  },
];

const recentSignals = [
  {
    location: "Central Market Road",
    type: "Harassment",
    reports: 14,
    status: "Emerging",
  },
  {
    location: "West Station Exit",
    type: "Loitering",
    reports: 9,
    status: "Monitoring",
  },
  {
    location: "College Avenue",
    type: "Unsafe behaviour",
    reports: 7,
    status: "Monitoring",
  },
];

const featureCards = [
  {
    href: "/safety-map",
    title: "Safety Map",
    description:
      "Explore aggregated community safety zones, rising signals and risk context.",
    icon: Map,
    label: "Live intelligence",
  },
  {
    href: "/safe-route",
    title: "Safe Route",
    description:
      "Check route safety context using nearby aggregated community signals.",
    icon: Route,
    label: "Route safety",
  },
  {
    href: "/news",
    title: "Safety News",
    description:
      "Stay updated with AI-filtered news related to women and public safety.",
    icon: Newspaper,
    label: "Live updates",
  },
  {
    href: "/emergency",
    title: "Emergency Help",
    description:
      "Access emergency resources and important safety actions quickly.",
    icon: Siren,
    label: "Quick help",
  },
  {
    href: "/report",
    title: "Report Anonymously",
    description:
      "Flag an unsafe moment in seconds without creating an account.",
    icon: FileWarning,
    label: "Anonymous",
  },
  {
    href: "/authority",
    title: "Authority Dashboard",
    description:
      "Review emerging patterns, alerts, supporting signals and actions.",
    icon: Shield,
    label: "Safety intelligence",
  },
];

export default function Home() {
  return (
    <AppShell>
      <main className="min-h-[calc(100svh-4rem)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="space-y-7">
            {/* HERO */}
            <section className="rounded-3xl border bg-card/60 p-5 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1"
                    >
                      <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" />
                      Live safety network
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Good evening.
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Monitor community safety signals, discover emerging
                    patterns, and help make public spaces safer.
                  </p>
                </div>

                <Link
                  href="/report"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <FileWarning className="size-4" />
                  Report a safety issue
                </Link>
              </div>
            </section>

            {/* STATS */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Card
                    key={stat.title}
                    className="rounded-2xl shadow-sm"
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardDescription>
                        {stat.title}
                      </CardDescription>

                      <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-semibold tracking-tight">
                          {stat.value}
                        </p>

                        <span className="mb-1 text-xs font-medium text-emerald-600">
                          {stat.change}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            {/* EXPLORE */}
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  Explore SafeSignal
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Access the tools and intelligence available across the
                  platform.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featureCards.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <Link
                      key={feature.href}
                      href={feature.href}
                      className="group block"
                    >
                      <Card className="h-full rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="size-5" />
                            </div>

                            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                          </div>

                          <Badge
                            variant="secondary"
                            className="mt-4 rounded-full text-[11px]"
                          >
                            {feature.label}
                          </Badge>

                          <h3 className="mt-3 text-base font-semibold">
                            {feature.title}
                          </h3>

                          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                            {feature.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* SIGNALS + QUICK ACTIONS */}
            <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>
                      Emerging safety patterns
                    </CardTitle>

                    <CardDescription className="mt-1">
                      Signals currently being monitored by the network.
                    </CardDescription>
                  </div>

                  <Link
                    href="/safety-map"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    View all
                    <ArrowUpRight className="size-4" />
                  </Link>
                </CardHeader>

                <CardContent className="space-y-3">
                  {recentSignals.map((signal) => (
                    <Link
                      key={signal.location}
                      href="/safety-map"
                      className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Map className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {signal.location}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {signal.type} · {signal.reports} community signals
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          signal.status === "Emerging"
                            ? "default"
                            : "secondary"
                        }
                        className="w-fit rounded-full"
                      >
                        {signal.status}
                      </Badge>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Quick actions</CardTitle>

                  <CardDescription>
                    Common actions available from your safety dashboard.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Link
                    href="/report"
                    className="flex w-full items-center rounded-xl border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <FileWarning className="size-4" />
                    </div>

                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium">
                        Report anonymously
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Flag an unsafe moment in seconds
                      </p>
                    </div>

                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
                  </Link>

                  <Link
                    href="/safety-map"
                    className="flex w-full items-center rounded-xl border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Map className="size-4" />
                    </div>

                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium">
                        Open safety map
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Explore nearby community signals
                      </p>
                    </div>

                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
                  </Link>

                  <Link
                    href="/emergency"
                    className="flex w-full items-center rounded-xl border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Siren className="size-4" />
                    </div>

                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium">
                        Emergency help
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Access emergency actions
                      </p>
                    </div>

                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
                  </Link>

                  <Link
                    href="/news"
                    className="flex w-full items-center rounded-xl border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Newspaper className="size-4" />
                    </div>

                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium">
                        Safety news
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Read the latest safety-related updates
                      </p>
                    </div>

                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            </section>

            {/* PRIVACY STRIP */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Privacy-first community safety
                    </p>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                      Reports are aggregated into coarse safety signals rather
                      than exposing exact individual locations or identities.
                    </p>
                  </div>
                </div>

                <Link
                  href="/report"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Report anonymously
                  <ArrowUpRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}