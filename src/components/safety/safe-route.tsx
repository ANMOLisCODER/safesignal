"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type RiskLevel =
  | "low"
  |  "medium"
  |  "high"
  |  "critical";

type SafetyZone = {
  latitude: number;
  longitude: number;
  reportCount: number;
  recentReportCount: number;
  distinctReporterCount: number;
  distinctTimeWindowCount: number;
  confidenceScore: number;
  severity:
    | "low"
    | "medium"
    | "high"
    | "critical";
  risk: RiskLevel;
  trendDirection:
    | "rising"
    | "falling"
    | "stable";
};

type ZonesResponse = {
  success: boolean;
  zones?: SafetyZone[];
  error?: string;
};

type RouteResponse = {
  success: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
  geometry?: {
    type: string;
    coordinates: Array<
      [number, number]
    >;
  };
  error?: string;
};

type RouteRisk = {
  level: RiskLevel;
  nearbyZones: SafetyZone[];
  risingZones: number;
  highRiskZones: number;
};

function MapClickHandler({
  start,
  destination,
  onStart,
  onDestination,
}: {
  start: Coordinate | null;
  destination: Coordinate | null;
  onStart: (
    coordinate: Coordinate,
  ) => void;
  onDestination: (
    coordinate: Coordinate,
  ) => void;
}) {
  useMapEvents({
    click(event) {
      const coordinate = {
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      };

      if (!start) {
        onStart(coordinate);
        return;
      }

      if (!destination) {
        onDestination(coordinate);
        return;
      }

      /*
       * Once both points exist, a new click
       * starts a fresh route.
       */
      onStart(coordinate);
      onDestination({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function getRiskRank(
  risk: RiskLevel,
) {
  switch (risk) {
    case "critical":
      return 4;

    case "high":
      return 3;

    case "medium":
      return 2;

    default:
      return 1;
  }
}

function getRiskLabel(
  risk: RiskLevel,
) {
  switch (risk) {
    case "critical":
      return "High";

    case "high":
      return "Elevated";

    case "medium":
      return "Moderate";

    default:
      return "Lower";
  }
}

function getRiskDescription(
  risk: RiskLevel,
) {
  switch (risk) {
    case "critical":
      return "The route passes close to a critical aggregated safety signal.";

    case "high":
      return "The route passes close to one or more higher-risk aggregated safety zones.";

    case "medium":
      return "The route passes close to emerging or moderate safety signals.";

    default:
      return "No higher-risk aggregated safety zones were detected near this route.";
  }
}

function distanceToRoute(
  point: Coordinate,
  route: Array<
    [number, number]
  >,
) {
  let minimumDistance =
    Number.POSITIVE_INFINITY;

  for (
    let index = 0;
    index < route.length - 1;
    index += 1
  ) {
    const first = route[index];
    const second =
      route[index + 1];

    /*
     * Equirectangular approximation.
     * Accurate enough for the small
     * safety-zone distances used here.
     */

    const latitudeScale =
      111_320;

    const longitudeScale =
      111_320 *
      Math.cos(
        (point.latitude *
          Math.PI) /
          180,
      );

    const px =
      point.longitude *
      longitudeScale;

    const py =
      point.latitude *
      latitudeScale;

    const ax =
      first[0] *
      longitudeScale;

    const ay =
      first[1] *
      latitudeScale;

    const bx =
      second[0] *
      longitudeScale;

    const by =
      second[1] *
      latitudeScale;

    const dx = bx - ax;
    const dy = by - ay;

    const lengthSquared =
      dx * dx + dy * dy;

    let t = 0;

    if (lengthSquared > 0) {
      t =
        ((px - ax) * dx +
          (py - ay) * dy) /
        lengthSquared;

      t = Math.max(
        0,
        Math.min(1, t),
      );
    }

    const closestX =
      ax + t * dx;

    const closestY =
      ay + t * dy;

    const distance = Math.sqrt(
      (px - closestX) ** 2 +
        (py - closestY) ** 2,
    );

    minimumDistance =
      Math.min(
        minimumDistance,
        distance,
      );
  }

  return minimumDistance;
}

function calculateRouteRisk(
  zones: SafetyZone[],
  route: Array<
    [number, number]
  >,
): RouteRisk {
  /*
   * We intentionally use a generous corridor
   * around coarse zones.
   *
   * This does NOT expose exact reports.
   */
  const nearbyZones =
    zones.filter((zone) => {
      const distance =
        distanceToRoute(
          {
            latitude:
              zone.latitude,
            longitude:
              zone.longitude,
          },
          route,
        );

      return distance <= 700;
    });

  const highRiskZones =
    nearbyZones.filter(
      (zone) =>
        zone.risk ===
          "high" ||
        zone.risk ===
          "critical",
    ).length;

  const risingZones =
    nearbyZones.filter(
      (zone) =>
        zone.trendDirection ===
        "rising",
    ).length;

  let highestRisk: RiskLevel =
    "low";

  for (const zone of nearbyZones) {
    if (
      getRiskRank(zone.risk) >
      getRiskRank(highestRisk)
    ) {
      highestRisk = zone.risk;
    }
  }

  if (
    highestRisk ===
    "critical"
  ) {
    return {
      level: "critical",
      nearbyZones,
      risingZones,
      highRiskZones,
    };
  }

  if (
    highestRisk === "high"
  ) {
    return {
      level: "high",
      nearbyZones,
      risingZones,
      highRiskZones,
    };
  }

  if (
    highestRisk ===
      "medium" ||
    risingZones >= 2
  ) {
    return {
      level: "medium",
      nearbyZones,
      risingZones,
      highRiskZones,
    };
  }

  return {
    level: "low",
    nearbyZones,
    risingZones,
    highRiskZones,
  };
}

function formatDistance(
  meters: number,
) {
  if (meters < 1000) {
    return `${Math.round(
      meters,
    )} m`;
  }

  return `${(
    meters / 1000
  ).toFixed(1)} km`;
}

function formatDuration(
  seconds: number,
) {
  const minutes = Math.round(
    seconds / 60,
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  const remaining =
    minutes % 60;

  return `${hours}h ${remaining}m`;
}

function MapResizeHandler() {
  useMapEvents({});

  return null;
}

export function SafeRoute() {
  const [start, setStart] =
    useState<Coordinate | null>(
      null,
    );

  const [
    destination,
    setDestination,
  ] =
    useState<Coordinate | null>(
      null,
    );

  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState<
    Array<[number, number]>
  >([]);

  const [distance, setDistance] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [zones, setZones] =
    useState<SafetyZone[]>([]);

  const [isRouting, setIsRouting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const routeRisk =
    useMemo(() => {
      if (
        routeCoordinates.length <
        2
      ) {
        return null;
      }

      return calculateRouteRisk(
        zones,
        routeCoordinates,
      );
    }, [
      zones,
      routeCoordinates,
    ]);

  useEffect(() => {
    async function loadZones() {
      try {
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
          response.ok &&
          result.success
        ) {
          setZones(
            result.zones ?? [],
          );
        }
      } catch (requestError) {
        console.error(
          "Route safety zones load failed:",
          requestError,
        );
      }
    }

    void loadZones();
  }, []);

  async function calculateRoute() {
    if (
      !start ||
      !destination
    ) {
      return;
    }

    try {
      setIsRouting(true);
      setError(null);

      const response =
        await fetch(
          "/api/safe-route",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              start,
              destination,
            }),
          },
        );

      const result =
        (await response.json()) as RouteResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.geometry
      ) {
        throw new Error(
          result.error ??
            "Unable to calculate route.",
        );
      }

      const coordinates =
        result.geometry.coordinates.map(
          ([longitude, latitude]) =>
            [
              latitude,
              longitude,
            ] as [
              number,
              number,
            ],
        );

      setRouteCoordinates(
        coordinates,
      );

      setDistance(
        result.distanceMeters ??
          0,
      );

      setDuration(
        result.durationSeconds ??
          0,
      );
    } catch (requestError) {
      console.error(
        "Route calculation failed:",
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to calculate route.",
      );
    } finally {
      setIsRouting(false);
    }
  }

  function resetRoute() {
    setStart(null);
    setDestination(null);
    setRouteCoordinates([]);
    setDistance(0);
    setDuration(0);
    setError(null);
  }

  function useCurrentLocation() {
    if (
      !navigator.geolocation
    ) {
      setError(
        "Geolocation is not available in this browser.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStart({
          latitude:
            position.coords
              .latitude,
          longitude:
            position.coords
              .longitude,
        });

        setError(null);
      },
      () => {
        setError(
          "Location permission was not available. You can select the start point manually.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={
              useCurrentLocation
            }
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Use current location
          </button>

          <button
            type="button"
            onClick={resetRoute}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              Start
            </p>

            <p className="mt-1 font-medium">
              {start
                ? "Selected"
                : "Click map to select"}
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              Destination
            </p>

            <p className="mt-1 font-medium">
              {destination
                ? "Selected"
                : "Click map to select"}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Select a start point and destination on the
          map. SafeSignal checks only coarse aggregated
          safety zones near the resulting route.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border bg-muted/20">
        <MapContainer
          center={[
            19.076,
            72.8777,
          ]}
          zoom={11}
          scrollWheelZoom
          className="h-[560px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapResizeHandler />

          <MapClickHandler
            start={start}
            destination={
              destination
            }
            onStart={
              setStart
            }
            onDestination={
              setDestination
            }
          />

          {start && (
            <CircleMarker
              center={[
                start.latitude,
                start.longitude,
              ]}
              radius={9}
              pathOptions={{
                color:
                  "#2563eb",
                fillColor:
                  "#2563eb",
                fillOpacity: 0.9,
              }}
            />
          )}

          {destination && (
            <CircleMarker
              center={[
                destination.latitude,
                destination.longitude,
              ]}
              radius={9}
              pathOptions={{
                color:
                  "#7c3aed",
                fillColor:
                  "#7c3aed",
                fillOpacity: 0.9,
              }}
            />
          )}

          {zones.map(
            (zone) => {
              const isNearby =
                routeRisk?.nearbyZones.includes(
                  zone,
                );

              if (
                !isNearby
              ) {
                return null;
              }

              return (
                <CircleMarker
                  key={`${zone.latitude}-${zone.longitude}`}
                  center={[
                    zone.latitude,
                    zone.longitude,
                  ]}
                  radius={10}
                  pathOptions={{
                    color:
                      zone.risk ===
                      "critical"
                        ? "#ef4444"
                        : zone.risk ===
                          "high"
                        ? "#f97316"
                        : zone.risk ===
                          "medium"
                        ? "#eab308"
                        : "#22c55e",
                    fillOpacity:
                      0.75,
                  }}
                />
              );
            },
          )}

          {routeCoordinates.length >
            1 && (
            <Polyline
              positions={
                routeCoordinates
              }
              pathOptions={{
                color:
                  "#2563eb",
                weight: 6,
                opacity: 0.8,
              }}
            />
          )}
        </MapContainer>

        {isRouting && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="rounded-xl border bg-background px-4 py-3 text-sm shadow-lg">
              Calculating route...
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">
            Route unavailable
          </p>

          <p className="mt-1 text-muted-foreground">
            {error}
          </p>
        </div>
      )}

      {start &&
        destination &&
        routeCoordinates.length ===
          0 && (
          <button
            type="button"
            onClick={
              calculateRoute
            }
            disabled={isRouting}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isRouting
              ? "Calculating..."
              : "Calculate safe route"}
          </button>
        )}

      {routeCoordinates.length >
        1 &&
        routeRisk && (
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  Route safety context
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  {getRiskLabel(
                    routeRisk.level,
                  )}
                </h2>

                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {getRiskDescription(
                    routeRisk.level,
                  )}
                </p>
              </div>

              <span className="rounded-full border px-3 py-1.5 text-xs font-semibold capitalize">
                {routeRisk.level}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Distance
                </p>

                <p className="mt-1 font-semibold">
                  {formatDistance(
                    distance,
                  )}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Estimated time
                </p>

                <p className="mt-1 font-semibold">
                  {formatDuration(
                    duration,
                  )}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Nearby zones
                </p>

                <p className="mt-1 font-semibold">
                  {
                    routeRisk
                      .nearbyZones
                      .length
                  }
                </p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Rising zones
                </p>

                <p className="mt-1 font-semibold">
                  {
                    routeRisk.risingZones
                  }
                </p>
              </div>
            </div>

            {routeRisk
              .nearbyZones
              .length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium">
                  Aggregated safety signals near route
                </p>

                <div className="mt-2 space-y-2">
                  {routeRisk.nearbyZones.map(
                    (
                      zone,
                    ) => (
                      <div
                        key={`${zone.latitude}-${zone.longitude}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {zone.reportCount} aggregated reports
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {
                              zone.distinctReporterCount
                            }{" "}
                            reporters ·{" "}
                            {
                              zone.distinctTimeWindowCount
                            }{" "}
                            time periods ·{" "}
                            {zone.trendDirection}
                          </p>
                        </div>

                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                          {zone.risk}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {routeRisk
              .nearbyZones
              .length === 0 && (
              <div className="mt-5 rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">
                  No nearby aggregated safety zones
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  This does not mean a route is guaranteed
                  to be safe. It only means SafeSignal has
                  no qualifying aggregated zones near this
                  route.
                </p>
              </div>
            )}

            <p className="mt-5 text-[11px] leading-5 text-muted-foreground">
              SafeSignal route risk is an informational
              signal based on aggregated community reports.
              It is not a guarantee of safety and does not
              replace emergency services or personal judgment.
            </p>
          </div>
        )}
    </div>
  );
}