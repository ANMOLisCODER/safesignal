"use client";

import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationPickerProps = {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
};

function MapClickHandler({ onChange }: LocationPickerProps) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export function LocationPicker({
  value,
  onChange,
}: LocationPickerProps) {
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([
    20.5937,
    78.9629,
  ]);

  useEffect(() => {
    if (value) {
      setDefaultCenter([value.latitude, value.longitude]);
    }
  }, [value]);

  return (
    <div className="overflow-hidden rounded-2xl border">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom
        className="h-80 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler value={value} onChange={onChange} />

        {value && (
          <CircleMarker
            center={[value.latitude, value.longitude]}
            radius={10}
            pathOptions={{
              fillOpacity: 0.8,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}