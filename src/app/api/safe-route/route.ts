import { NextResponse } from "next/server";
import { z } from "zod";

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const routeSchema = z.object({
  start: coordinateSchema,
  destination: coordinateSchema,
});

type OsrmResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      type?: string;
      coordinates?: Array<
        [number, number]
      >;
    };
  }>;
};

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const parsed =
      routeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid start or destination coordinates.",
        },
        { status: 400 },
      );
    }

    const {
      start,
      destination,
    } = parsed.data;

    const coordinates =
      `${start.longitude},${start.latitude};` +
      `${destination.longitude},${destination.latitude}`;

    const url =
      `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
      `?overview=full&geometries=geojson`;

    const response =
      await fetch(url, {
        cache: "no-store",
      });

    if (!response.ok) {
      throw new Error(
        `Routing service returned HTTP ${response.status}.`,
      );
    }

    const data =
      (await response.json()) as OsrmResponse;

    if (
      data.code !== "Ok" ||
      !data.routes?.[0]?.geometry
        ?.coordinates?.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            data.message ??
            "No road route could be found between these points.",
        },
        { status: 422 },
      );
    }

    const route =
      data.routes[0];

    return NextResponse.json({
      success: true,

      distanceMeters:
        route.distance ?? 0,

      durationSeconds:
        route.duration ?? 0,

      geometry: route.geometry,
    });
  } catch (error) {
    console.error(
      "Safe route request failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to calculate the route right now.",
      },
      { status: 500 },
    );
  }
}