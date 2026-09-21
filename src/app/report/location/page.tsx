"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LocateFixed,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const LocationPicker = dynamic(
  () =>
    import("@/components/report/location-picker").then(
      (module) => module.LocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 w-full items-center justify-center rounded-2xl border bg-muted/30 text-sm text-muted-foreground">
        Loading map...
      </div>
    ),
  },
);

type LocationMethod = "current" | "manual" | null;

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function ReportLocationPage() {
  const router = useRouter();

  const [category, setCategory] = useState<string | null>(null);

  const [locationMethod, setLocationMethod] =
    useState<LocationMethod>(null);

  const [coordinates, setCoordinates] =
    useState<Coordinates | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] =
    useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(params.get("category"));
  }, []);

  const canContinue =
    locationMethod !== null &&
    Boolean(category) &&
    (locationMethod === "manual" || coordinates !== null);

  function handleCurrentLocation() {
    setLocationMethod("current");
    setCoordinates(null);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError(
        "Location services are not supported by this browser.",
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setIsLocating(false);
      },
      (error) => {
        setCoordinates(null);
        setIsLocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location permission was denied. Please allow location access or choose a location manually.",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Your location could not be determined. Please try again or choose a location manually.",
            );
            break;

          case error.TIMEOUT:
            setLocationError(
              "Location request timed out. Please try again.",
            );
            break;

          default:
            setLocationError(
              "Unable to determine your location. Please try again.",
            );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  function handleManualLocation() {
    setLocationMethod("manual");
    setCoordinates(null);
    setLocationError(null);
  }

  function handleContinue() {
    if (!canContinue || !category || !locationMethod) {
      return;
    }

    if (!coordinates) {
      return;
    }

    sessionStorage.setItem(
      "safesignal-report-draft",
      JSON.stringify({
        category,
        locationMethod,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }),
    );

    router.push("/report/details");
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-10">
          <Link
            href="/report"
            className="-ml-3 inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <div className="flex-1">
          <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <MapPin className="size-6" />
          </div>

          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Step 2 of 3
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Where did it happen?
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            A general location helps SafeSignal identify patterns. Choose how
            you want to describe where the incident happened.
          </p>

          <div className="mt-10 space-y-4">
            <Card
              className={[
                "rounded-2xl transition-all",
                locationMethod === "current"
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/40",
              ].join(" ")}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  aria-pressed={locationMethod === "current"}
                  className="flex min-h-24 w-full items-center gap-4 p-5 text-left"
                >
                  <div
                    className={[
                      "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      locationMethod === "current"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    ].join(" ")}
                  >
                    {locationMethod === "current" ? (
                      <Check className="size-5" />
                    ) : (
                      <LocateFixed className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Use my current location
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {isLocating
                        ? "Getting your approximate location..."
                        : coordinates &&
                            locationMethod === "current"
                          ? "Location detected successfully."
                          : "Share your approximate location for this safety signal."}
                    </p>
                  </div>

                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>

            <Card
              className={[
                "rounded-2xl transition-all",
                locationMethod === "manual"
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/40",
              ].join(" ")}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={handleManualLocation}
                  aria-pressed={locationMethod === "manual"}
                  className="flex min-h-24 w-full items-center gap-4 p-5 text-left"
                >
                  <div
                    className={[
                      "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      locationMethod === "manual"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    ].join(" ")}
                  >
                    {locationMethod === "manual" ? (
                      <Check className="size-5" />
                    ) : (
                      <MapPin className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      Choose location manually
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Select a nearby area without sharing your exact
                      position.
                    </p>
                  </div>

                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </div>

          {locationMethod === "manual" && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">
                Select the approximate area
              </p>

              <LocationPicker
                value={coordinates}
                onChange={(nextCoordinates) => {
                  setCoordinates(nextCoordinates);
                  setLocationError(null);
                }}
              />

              {coordinates && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Area selected. SafeSignal will convert this into a
                  privacy-safe safety zone before storing it.
                </p>
              )}
            </div>
          )}

          {locationError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {locationError}
            </div>
          )}

          {coordinates && locationMethod === "current" && (
            <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">
                Approximate location detected
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Your exact coordinates will be converted into a
                privacy-safe safety area before being used for pattern
                detection.
              </p>
            </div>
          )}

          <div className="mt-8">
            <Button
              size="lg"
              className="w-full rounded-xl"
              disabled={!canContinue || isLocating}
              onClick={handleContinue}
            >
              {isLocating ? "Getting location..." : "Continue"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-10 border-t pt-5">
          <p className="text-xs leading-5 text-muted-foreground">
            SafeSignal is designed to use location for aggregated safety
            patterns. Avoid including personally identifying information in
            your report.
          </p>
        </div>
      </div>
    </main>
  );
}