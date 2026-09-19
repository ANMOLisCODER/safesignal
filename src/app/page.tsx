import {
  ArrowUpRight,
  FileWarning,
  Map,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" />
                Live safety network
              </Badge>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Good evening.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Monitor community safety signals, discover emerging patterns,
              and help make public spaces safer.
            </p>
          </div>

          <Button className="rounded-xl" size="lg">
            <FileWarning className="size-4" />
            Report a safety issue
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.title} className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardDescription>{stat.title}</CardDescription>

                  <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-4.5 text-muted-foreground" />
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

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Emerging safety patterns</CardTitle>
                <CardDescription className="mt-1">
                  Signals currently being monitored by the network.
                </CardDescription>
              </div>

              <Button variant="ghost" size="sm" className="rounded-lg">
                View all
                <ArrowUpRight className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-3">
              {recentSignals.map((signal) => (
                <div
                  key={signal.location}
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
                      signal.status === "Emerging" ? "default" : "secondary"
                    }
                    className="w-fit rounded-full"
                  >
                    {signal.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>
                Common actions available from your safety dashboard.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="h-auto w-full justify-start rounded-xl p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <FileWarning className="size-4" />
                </div>

                <div className="ml-3 text-left">
                  <p className="text-sm font-medium">Report anonymously</p>
                  <p className="text-xs text-muted-foreground">
                    Flag an unsafe moment in seconds
                  </p>
                </div>

                <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                className="h-auto w-full justify-start rounded-xl p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Map className="size-4" />
                </div>

                <div className="ml-3 text-left">
                  <p className="text-sm font-medium">Open safety map</p>
                  <p className="text-xs text-muted-foreground">
                    Explore nearby community signals
                  </p>
                </div>

                <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                className="h-auto w-full justify-start rounded-xl p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Siren className="size-4" />
                </div>

                <div className="ml-3 text-left">
                  <p className="text-sm font-medium">Emergency help</p>
                  <p className="text-xs text-muted-foreground">
                    Access emergency actions
                  </p>
                </div>

                <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}