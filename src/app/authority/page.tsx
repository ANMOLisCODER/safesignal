"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AlertSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

type AlertStatus =
  | "new"
  | "acknowledged"
  | "investigating"
  | "resolved"
  | "dismissed";

type AuthorityAction =
  | "acknowledge"
  | "investigate"
  | "resolve"
  | "dismiss";

type AuthorityAlert = {
  id: string;
  locationHash: string;
  title: string;
  description: string | null;
  severity: AlertSeverity;
  confidenceScore: number;
  reportCount: number;
  distinctReporterCount: number;
  distinctTimeWindowCount: number;
  status: AlertStatus;
  firstDetectedAt: string;
  lastUpdatedAt: string;
};

type AlertsResponse = {
  success: boolean;
  alerts?: AuthorityAlert[];
  error?: string;
};

type ActionResponse = {
  success: boolean;
  error?: string;
};

type ExplanationResponse = {
  success: boolean;
  explanation?: string | null;
  cached?: boolean;
  error?: string;
};

function severityClass(
  severity: AlertSeverity,
) {
  switch (severity) {
    case "critical":
      return "border-destructive/30 bg-destructive/10 text-destructive";

    case "high":
      return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400";

    case "medium":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function statusClass(
  status: AlertStatus,
) {
  switch (status) {
    case "new":
      return "border-primary/30 bg-primary/10 text-primary";

    case "acknowledged":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";

    case "investigating":
      return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400";

    case "resolved":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400";

    case "dismissed":
      return "border-border bg-muted text-muted-foreground";
  }
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function getActionButtons(
  status: AlertStatus,
) {
  switch (status) {
    case "new":
      return [
        {
          action:
            "acknowledge" as AuthorityAction,
          label: "Acknowledge",
          variant:
            "default" as const,
        },
        {
          action:
            "dismiss" as AuthorityAction,
          label: "Dismiss",
          variant:
            "outline" as const,
        },
      ];

    case "acknowledged":
      return [
        {
          action:
            "investigate" as AuthorityAction,
          label: "Start investigation",
          variant:
            "default" as const,
        },
        {
          action:
            "dismiss" as AuthorityAction,
          label: "Dismiss",
          variant:
            "outline" as const,
        },
      ];

    case "investigating":
      return [
        {
          action:
            "resolve" as AuthorityAction,
          label: "Mark resolved",
          variant:
            "default" as const,
        },
        {
          action:
            "dismiss" as AuthorityAction,
          label: "Dismiss",
          variant:
            "outline" as const,
        },
      ];

    case "resolved":
    case "dismissed":
      return [];
  }
}

export default function AuthorityDashboardPage() {
  const [alerts, setAlerts] = useState<
    AuthorityAlert[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [activeAction, setActiveAction] =
    useState<string | null>(null);

    const [explanations, setExplanations] =
  useState<Record<string, string>>({});

const [loadingExplanation, setLoadingExplanation] =
  useState<string | null>(null);

const [explanationError, setExplanationError] =
  useState<string | null>(null);

  const loadAlerts = useCallback(
    async () => {
      try {
        setError(null);

        const response =
          await fetch(
            "/api/authority/alerts",
            {
              cache: "no-store",
            },
          );

        const result =
          (await response.json()) as AlertsResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              "Unable to load authority alerts.",
          );
        }

        setAlerts(
          result.alerts ?? [],
        );
      } catch (requestError) {
        console.error(
          "Authority dashboard load failed:",
          requestError,
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load authority alerts.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  async function handleAction(
    alertId: string,
    action: AuthorityAction,
  ) {
    const actionKey =
      `${alertId}:${action}`;

    setActiveAction(actionKey);
    setActionError(null);

    try {
      const response =
        await fetch(
          `/api/authority/alerts/${alertId}/actions`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action,
              notes:
                action === "acknowledge"
                  ? "Pattern reviewed and acknowledged from the authority dashboard."
                  : action ===
                      "investigate"
                    ? "Investigation started from the authority dashboard."
                    : action === "resolve"
                      ? "Pattern investigation marked resolved from the authority dashboard."
                      : "Pattern alert dismissed from the authority dashboard.",
            }),
          },
        );

      const result =
        (await response.json()) as ActionResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            "Unable to update alert.",
        );
      }

      await loadAlerts();
    } catch (requestError) {
      console.error(
        "Authority action failed:",
        requestError,
      );

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update alert.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleExplanation(
  alertId: string,
) {
  setLoadingExplanation(alertId);
  setExplanationError(null);

  try {
    const response = await fetch(
      `/api/authority/alerts/${alertId}/explanation`,
      {
        method: "POST",
      },
    );

    const result =
      (await response.json()) as ExplanationResponse;

    if (
      !response.ok ||
      !result.success ||
      !result.explanation
    ) {
      throw new Error(
        result.error ??
          "Unable to generate AI explanation.",
      );
    }

    setExplanations(
      (current) => ({
        ...current,
        [alertId]:
          result.explanation!,
      }),
    );
  } catch (requestError) {
    console.error(
      "AI explanation request failed:",
      requestError,
    );

    setExplanationError(
      requestError instanceof Error
        ? requestError.message
        : "Unable to generate AI explanation.",
    );
  } finally {
    setLoadingExplanation(null);
  }
}

  const activeAlerts =
    alerts.filter(
      (alert) =>
        alert.status !==
          "resolved" &&
        alert.status !==
          "dismissed",
    ).length;

  const investigatingAlerts =
    alerts.filter(
      (alert) =>
        alert.status ===
        "investigating",
    ).length;

  const resolvedAlerts =
    alerts.filter(
      (alert) =>
        alert.status ===
        "resolved",
    ).length;

  const totalReports =
    alerts.reduce(
      (sum, alert) =>
        sum + alert.reportCount,
      0,
    );

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />

              <span className="text-sm font-medium text-primary">
                SafeSignal Authority
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Safety intelligence dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review emerging safety patterns,
              understand their supporting signals,
              and track authority actions.
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              setIsLoading(true);
              void loadAlerts();
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`size-4 ${
                isLoading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </Button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <AlertTriangle className="size-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Active alerts
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {activeAlerts}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                <TrendingUp className="size-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Investigating
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {investigatingAlerts}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <CheckCircle2 className="size-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Resolved
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {resolvedAlerts}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="size-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Signals represented
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {totalReports}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Pattern alerts
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Signals grouped by location,
                time and reporter diversity.
              </p>
            </div>

            <Badge variant="secondary">
              {alerts.length} total
            </Badge>
          </div>

          {error && (
            <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
              <CardContent className="p-5">
                <p className="font-medium text-destructive">
                  Unable to load alerts
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {error}
                </p>
              </CardContent>
            </Card>
          )}

          {actionError && (
            <Card className="mb-4 rounded-2xl border-destructive/30 bg-destructive/5">
              <CardContent className="p-5">
                <p className="font-medium text-destructive">
                  Action failed
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {actionError}
                </p>
              </CardContent>
            </Card>
          )}

          {explanationError && (
  <Card className="mb-4 rounded-2xl border-destructive/30 bg-destructive/5">
    <CardContent className="p-5">
      <p className="font-medium text-destructive">
        AI explanation failed
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {explanationError}
      </p>
    </CardContent>
  </Card>
)}



          {isLoading && !error && (
            <div className="grid gap-4">
              {[1, 2].map(
                (item) => (
                  <Card
                    key={item}
                    className="rounded-2xl"
                  >
                    <CardContent className="p-6">
                      <div className="h-5 w-48 animate-pulse rounded bg-muted" />

                      <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />

                      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          )}

          {!isLoading &&
            !error &&
            alerts.length === 0 && (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <ShieldAlert className="size-7 text-muted-foreground" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    No pattern alerts yet
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    New alerts will appear here when
                    SafeSignal detects enough diverse
                    signals to identify an emerging
                    pattern.
                  </p>
                </CardContent>
              </Card>
            )}

          {!isLoading &&
            !error &&
            alerts.length > 0 && (
              <div className="grid gap-4">
                {alerts.map(
                  (alert) => {
                    const actionButtons =
                      getActionButtons(
                        alert.status,
                      );

                    return (
                      <Card
                        key={alert.id}
                        className="rounded-2xl"
                      >
                        <CardHeader className="gap-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={severityClass(
                                    alert.severity,
                                  )}
                                >
                                  {alert.severity}
                                </Badge>

                                <Badge
                                  variant="outline"
                                  className={statusClass(
                                    alert.status,
                                  )}
                                >
                                  {alert.status}
                                </Badge>
                              </div>

                              <CardTitle className="mt-3 text-lg">
                                {alert.title}
                              </CardTitle>
                            </div>

                            <div className="shrink-0 text-left sm:text-right">
                              <p className="text-2xl font-semibold">
                                {Math.round(
                                  alert.confidenceScore *
                                    100,
                                )}
                                %
                              </p>

                              <p className="text-xs text-muted-foreground">
                                confidence
                              </p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          {alert.description && (
                            <p className="text-sm leading-6 text-muted-foreground">
                              {alert.description}
                            </p>
                          )}

                          <div className="mt-5 rounded-2xl border bg-muted/20 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium">
                                  AI pattern explanation
                                </p>

                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  Explain why SafeSignal detected this pattern
                                  using the calculated safety signals.
                                </p>
                              </div>

                              {!explanations[alert.id] && (
                                <Button
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() =>
                                    void handleExplanation(alert.id)
                                  }
                                  disabled={
                                    loadingExplanation !== null
                                  }
                                >
                                  {loadingExplanation === alert.id
                                    ? "Generating..."
                                    : "Explain with AI"}
                                </Button>
                              )}
                            </div>

                            {explanations[alert.id] && (
                              <div className="mt-4 rounded-xl border bg-background p-4">
                                <div className="flex items-center gap-2">
                                  <span className="size-2 rounded-full bg-primary" />

                                  <p className="text-sm font-medium">
                                    Why this alert was raised
                                  </p>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                  {explanations[alert.id]}
                                </p>

                                <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                                  Generated from SafeSignal's calculated pattern
                                  metrics. The pattern engine remains the source
                                  of truth.
                                </p>
                              </div>
                            )}
                          </div>

                          <Separator className="my-5" />

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Reports
                              </p>

                              <p className="mt-1 font-semibold">
                                {alert.reportCount}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Distinct reporters
                              </p>

                              <p className="mt-1 font-semibold">
                                {alert.distinctReporterCount}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Time periods
                              </p>

                              <p className="mt-1 font-semibold">
                                {alert.distinctTimeWindowCount}
                              </p>
                            </div>
                          </div>

                          <Separator className="my-5" />

                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2">
                                <Clock3 className="size-4" />

                                <span>
                                  Detected{" "}
                                  {formatDate(
                                    alert.firstDetectedAt,
                                  )}
                                </span>
                              </div>

                              <span className="truncate">
                                Zone:{" "}
                                {alert.locationHash}
                              </span>
                            </div>

                            {actionButtons.length > 0 && (
                              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                                {actionButtons.map(
                                  (button) => {
                                    const actionKey =
                                      `${alert.id}:${button.action}`;

                                    const isActive =
                                      activeAction ===
                                      actionKey;

                                    return (
                                      <Button
                                        key={
                                          button.action
                                        }
                                        variant={
                                          button.variant
                                        }
                                        className="rounded-xl"
                                        disabled={
                                          activeAction !==
                                          null
                                        }
                                        onClick={() =>
                                          void handleAction(
                                            alert.id,
                                            button.action,
                                          )
                                        }
                                      >
                                        {isActive
                                          ? "Updating..."
                                          : button.label}
                                      </Button>
                                    );
                                  },
                                )}
                              </div>
                            )}

                            {(alert.status ===
                              "resolved" ||
                              alert.status ===
                                "dismissed") && (
                              <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                                This alert is{" "}
                                {alert.status} and is
                                now read-only.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  },
                )}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}