"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { LocateFixed, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { updateLocation } from "@/lib/actions/profile";

// Se usan los assets del CDN (en vez del import estático del paquete) porque
// el pipeline de imágenes de Next/Turbopack no resuelve iconUrl de forma
// consistente para los íconos default de Leaflet.
const markerIconDefault = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]; // Buenos Aires

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom() < 12 ? 13 : map.getZoom());
  }, [position, map]);
  return null;
}

function ClickToPin({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  initialLocation,
  initialLat,
  initialLng,
}: {
  initialLocation: string | null;
  initialLat: number | null;
  initialLng: number | null;
}) {
  const [position, setPosition] = useState<[number, number]>(
    initialLat !== null && initialLng !== null
      ? [initialLat, initialLng]
      : DEFAULT_CENTER,
  );
  const [address, setAddress] = useState(initialLocation ?? "");
  const [searchText, setSearchText] = useState(initialLocation ?? "");
  const [loading, setLoading] = useState<"search" | "geo" | "reverse" | null>(
    null,
  );
  const [hasPin, setHasPin] = useState(initialLat !== null && initialLng !== null);

  async function reverseGeocode(lat: number, lng: number) {
    setLoading("reverse");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data: NominatimResult = await res.json();
      if (data.display_name) setAddress(data.display_name);
    } catch {
      // si falla el reverse geocoding, el usuario igual puede escribir la dirección a mano
    } finally {
      setLoading(null);
    }
  }

  function handlePick(lat: number, lng: number) {
    setPosition([lat, lng]);
    setHasPin(true);
    reverseGeocode(lat, lng);
  }

  async function handleSearch() {
    if (!searchText.trim()) return;
    setLoading("search");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchText)}`,
      );
      const results: NominatimResult[] = await res.json();
      if (results[0]) {
        const lat = Number(results[0].lat);
        const lng = Number(results[0].lon);
        setPosition([lat, lng]);
        setHasPin(true);
        setAddress(results[0].display_name);
      }
    } catch {
      // sin resultados o sin conexión: no hacemos nada, el usuario puede reintentar
    } finally {
      setLoading(null);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLoading("geo");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePick(pos.coords.latitude, pos.coords.longitude);
        setLoading(null);
      },
      () => setLoading(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-sm font-semibold text-stone-900">Mi ubicación</p>
      <p className="text-xs text-stone-500">
        Se usa para mostrar cercanía con otros objetos. Podés buscar tu
        dirección, usar tu ubicación actual, o tocar el mapa para marcar el
        punto.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Buscar dirección, barrio o ciudad..."
          className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading === "search"}
          className="flex items-center gap-1.5 rounded-xl bg-stone-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-900 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={loading === "geo"}
          title="Usar mi ubicación actual"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      <div className="h-64 w-full overflow-hidden rounded-xl border border-stone-200">
        <MapContainer
          center={position}
          zoom={hasPin ? 14 : 4}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPin && <Marker position={position} icon={markerIconDefault} />}
          <ClickToPin onPick={handlePick} />
          <RecenterMap position={position} />
        </MapContainer>
      </div>

      <form action={updateLocation} className="flex flex-col gap-2">
        <input type="hidden" name="latitude" value={hasPin ? position[0] : ""} />
        <input type="hidden" name="longitude" value={hasPin ? position[1] : ""} />
        <input
          type="text"
          name="location"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Dirección (se completa sola al marcar el mapa)"
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
        />
        <button
          type="submit"
          className="self-start rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
        >
          Guardar ubicación
        </button>
      </form>
    </div>
  );
}
