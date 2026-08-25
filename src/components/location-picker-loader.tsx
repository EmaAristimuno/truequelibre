"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () => import("@/components/location-picker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm text-stone-400">
        Cargando mapa...
      </div>
    ),
  },
);

export function LocationPickerLoader(props: {
  initialLocation: string | null;
  initialLat: number | null;
  initialLng: number | null;
  initialMaxDistanceKm: number | null;
}) {
  return <LocationPicker {...props} />;
}
