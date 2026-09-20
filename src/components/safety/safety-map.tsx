"use client";

import { useEffect, useState } from "react";
import {
  Circle,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type SafetyZone = {
  latitude: number;
  longitude: number;
  reportCount: number;
  severity:
    | "low"
    | "medium"
    | "high"
    | "critical";
  confidenceScore: number;
  status:
    | "new"
    | "acknowledged"
    | "investigating";
};

type ZonesResponse = {
  success: boolean;
  zones?: SafetyZone[];
  error?: string;
};

function getZoneColor(
  severity: SafetyZone["severity"],
) {
  switch (severity) {
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

    const bounds = zones.map((zone) => [
      zone.latitude,
      zone.longitude,
    ] as [number, number]);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
      animate: true,
    });
  }, [map, zones]);

  return null;
}

export function SafetyMap() {
  const [zones, setZones] =
    useState<SafetyZone[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadZones() {
      try {
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

        if (!cancelled) {
          setZones(
            result.zones ?? [],
          );
        }
      } catch (requestError) {
        console.error(
          "Safety map load failed:",
          requestError,
        );

        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load safety zones.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadZones();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-muted/20">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom
        className="h-105 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoFocus zones={zones} />

        {zones.map((zone) => {
          const color =
            getZoneColor(
              zone.severity,
            );

          return (
            <Circle
              key={`${zone.latitude}-${zone.longitude}`}
              center={[
                zone.latitude,
                zone.longitude,
              ]}
              radius={300}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.25,
                weight: 2,
              }}
            >
              <Popup>
                <div className="min-w-45">
                  <p className="font-semibold">
                    Safety signal zone
                  </p>

                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      Reports:{" "}
                      <strong>
                        {zone.reportCount}
                      </strong>
                    </p>

                    <p>
                      Severity:{" "}
                      <strong>
                        {zone.severity}
                      </strong>
                    </p>

                    <p>
                      Confidence:{" "}
                      <strong>
                        {Math.round(
                          zone.confidenceScore *
                            100,
                        )}
                        %
                      </strong>
                    </p>

                    <p>
                      Status:{" "}
                      <strong>
                        {zone.status}
                      </strong>
                    </p>
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>

      {isLoading && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="rounded-xl border bg-background px-4 py-3 text-sm shadow-sm">
            Loading safety zones...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-1000 rounded-xl border border-destructive/30 bg-background/95 p-4 text-sm shadow-lg">
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
        zones.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-1000 flex items-center justify-center">
            <div className="rounded-2xl border bg-background/90 px-5 py-4 text-center shadow-lg backdrop-blur">
              <p className="font-medium">
                No public safety zones yet
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Zones appear only after enough
                aggregated signals are available.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}