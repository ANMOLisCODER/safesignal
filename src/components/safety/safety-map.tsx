"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Circle,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

type TrendDirection =
  | "rising"
  | "falling"
  | "stable";

type SafetyZone = {
  latitude: number;
  longitude: number;

  reportCount: number;

  recentReportCount: number;

  previousReportCount: number;

  distinctReporterCount: number;

  distinctTimeWindowCount: number;

  confidenceScore: number;

  severity:
    | "low"
    | "medium"
    | "high"
    | "critical";

  risk: RiskLevel;

  trendDirection: TrendDirection;

  status:
    | "new"
    | "acknowledged"
    | "investigating";

  categories: string[];

  latestReportAt:
    | string
    | null;

  firstReportAt:
    | string
    | null;

  alertTitle:
    | string
    | null;

  alertDescription:
    | string
    | null;
};

type ZonesResponse = {
  success: boolean;

  zones?: SafetyZone[];

  zoneCount?: number;

  generatedAt?: string;

  error?: string;
};

type Filter =
  | "all"
  | "active"
  | "high-risk";

function getRiskColor(
  risk: RiskLevel,
) {
  switch (risk) {
    case "critical":
      return "#ef4444";

    case "high":
      return "#f97316";

    case "medium":
      return "#eab308";

    default:
      return "#22c55e";
  }
}

function getRiskLabel(
  risk: RiskLevel,
) {
  switch (risk) {
    case "critical":
      return "Critical";

    case "high":
      return "High";

    case "medium":
      return "Medium";

    default:
      return "Low";
  }
}

function getTrendLabel(
  trend: TrendDirection,
) {
  switch (trend) {
    case "rising":
      return "Rising";

    case "falling":
      return "Falling";

    default:
      return "Stable";
  }
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "No recent activity";
  }

  return new Date(
    value,
  ).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MapAutoFocus({
  zones,
}: {
  zones: SafetyZone[];
}) {
  const map = useMap();

  useEffect(() => {
    if (zones.length === 0) {
      return;
    }

    if (zones.length === 1) {
      map.setView(
        [
          zones[0].latitude,
          zones[0].longitude,
        ],
        14,
        {
          animate: true,
        },
      );

      return;
    }

    const bounds =
      zones.map(
        (zone) =>
          [
            zone.latitude,
            zone.longitude,
          ] as [number, number],
      );

    map.fitBounds(
      bounds,
      {
        padding: [40, 40],
        maxZoom: 14,
        animate: true,
      },
    );
  }, [map, zones]);

  return null;
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2">
      <p className="text-[11px] text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-semibold capitalize">
        {value}
      </p>
    </div>
  );
}

export function SafetyMap() {
  const [zones, setZones] =
    useState<SafetyZone[]>([]);

  const [filter, setFilter] =
    useState<Filter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadZones() {
    try {
      setIsLoading(true);
      setError(null);

      const response =
        await fetch(
          "/api/safety/zones",
          {
            cache: "no-store",
          },
        );

      const result =
        (await response.json()) as ZonesResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            "Unable to load safety zones.",
        );
      }

      setZones(
        result.zones ?? [],
      );
    } catch (requestError) {
      console.error(
        "Safety map load failed:",
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load safety zones.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadZones();
  }, []);

  const filteredZones =
    useMemo(() => {
      switch (filter) {
        case "active":
          return zones.filter(
            (zone) =>
              zone.status !==
              "new" ||
              zone.risk !==
                "low",
          );

        case "high-risk":
          return zones.filter(
            (zone) =>
              zone.risk ===
                "high" ||
              zone.risk ===
                "critical",
          );

        default:
          return zones;
      }
    }, [filter, zones]);

  const summary =
    useMemo(() => {
      return {
        total: zones.length,

        highRisk:
          zones.filter(
            (zone) =>
              zone.risk ===
                "high" ||
              zone.risk ===
                "critical",
          ).length,

        rising:
          zones.filter(
            (zone) =>
              zone.trendDirection ===
              "rising",
          ).length,

        reports:
          zones.reduce(
            (total, zone) =>
              total +
              zone.reportCount,
            0,
          ),
      };
    }, [zones]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Safety zones
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.total}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            High / critical
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.highRisk}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Rising signals
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.rising}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Aggregated reports
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.reports}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium">
          Show:
        </span>

        {[
          ["all", "All zones"],
          ["active", "Active signals"],
          ["high-risk", "High risk"],
        ].map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setFilter(
                  value as Filter,
                )
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() =>
            void loadZones()
          }
          className="ml-auto rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border bg-muted/20">
        <MapContainer
          center={[
            20.5937,
            78.9629,
          ]}
          zoom={5}
          scrollWheelZoom
          className="h-[520px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapAutoFocus
            zones={filteredZones}
          />

          {filteredZones.map(
            (zone) => {
              const color =
                getRiskColor(
                  zone.risk,
                );

              return (
                <Circle
                  key={`${zone.latitude}-${zone.longitude}`}
                  center={[
                    zone.latitude,
                    zone.longitude,
                  ]}
                  radius={350}
                  pathOptions={{
                    color,
                    fillColor:
                      color,
                    fillOpacity:
                      zone.risk ===
                      "critical"
                        ? 0.35
                        : 0.24,
                    weight:
                      zone.risk ===
                      "critical"
                        ? 3
                        : 2,
                  }}
                >
                  <Popup>
                    <div className="w-[280px] max-w-[80vw]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            Safety signal zone
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Aggregated area
                          </p>
                        </div>

                        <span
                          className="rounded-full px-2 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor:
                              `${color}20`,
                            color,
                          }}
                        >
                          {getRiskLabel(
                            zone.risk,
                          )}
                        </span>
                      </div>

                      {zone.alertTitle && (
                        <div className="mt-3 rounded-lg border p-2.5">
                          <p className="text-xs font-semibold">
                            {zone.alertTitle}
                          </p>

                          {zone.alertDescription && (
                            <p className="mt-1 text-xs leading-4 text-gray-600">
                              {
                                zone.alertDescription
                              }
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Stat
                          label="Reports"
                          value={
                            zone.reportCount
                          }
                        />

                        <Stat
                          label="Recent 24h"
                          value={
                            zone.recentReportCount
                          }
                        />

                        <Stat
                          label="Reporters"
                          value={
                            zone.distinctReporterCount
                          }
                        />

                        <Stat
                          label="Time periods"
                          value={
                            zone.distinctTimeWindowCount
                          }
                        />

                        <Stat
                          label="Confidence"
                          value={`${Math.round(
                            zone.confidenceScore *
                              100,
                          )}%`}
                        />

                        <Stat
                          label="Trend"
                          value={getTrendLabel(
                            zone.trendDirection,
                          )}
                        />
                      </div>

                      {zone.categories
                        .length >
                        0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold">
                            Signal types
                          </p>

                          <div className="mt-1 flex flex-wrap gap-1">
                            {zone.categories
                              .slice(
                                0,
                                4,
                              )
                              .map(
                                (
                                  category,
                                ) => (
                                  <span
                                    key={
                                      category
                                    }
                                    className="rounded-full bg-gray-100 px-2 py-1 text-[11px] capitalize"
                                  >
                                    {category.replace(
                                      /_/g,
                                      " ",
                                    )}
                                  </span>
                                ),
                              )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 border-t pt-3 text-[11px] text-gray-500">
                        <p>
                          Latest activity:{" "}
                          {formatDate(
                            zone.latestReportAt,
                          )}
                        </p>

                        <p className="mt-1">
                          First activity:{" "}
                          {formatDate(
                            zone.firstReportAt,
                          )}
                        </p>
                      </div>

                      <p className="mt-3 text-[10px] leading-4 text-gray-500">
                        This map shows a coarse
                        aggregated zone, not an
                        individual report or exact
                        location.
                      </p>
                    </div>
                  </Popup>
                </Circle>
              );
            },
          )}
        </MapContainer>

        {isLoading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="rounded-xl border bg-background px-4 py-3 text-sm shadow-sm">
              Loading safety intelligence...
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl border border-destructive/30 bg-background/95 p-4 text-sm shadow-lg">
            <p className="font-medium text-destructive">
              Unable to load safety map
            </p>

            <p className="mt-1 text-muted-foreground">
              {error}
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          filteredZones.length ===
            0 && (
            <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
              <div className="rounded-2xl border bg-background/90 px-5 py-4 text-center shadow-lg backdrop-blur">
                <p className="font-medium">
                  No zones match this filter
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  More aggregated signals will
                  appear here as they are detected.
                </p>
              </div>
            </div>
          )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border bg-card p-4 text-xs">
        {[
          ["#22c55e", "Low"],
          ["#eab308", "Medium"],
          ["#f97316", "High"],
          ["#ef4444", "Critical"],
        ].map(
          ([color, label]) => (
            <div
              key={label}
              className="flex items-center gap-2"
            >
              <span
                className="size-3 rounded-full"
                style={{
                  backgroundColor:
                    color,
                }}
              />

              <span>
                {label} signal
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}