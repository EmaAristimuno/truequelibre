"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ExploreItemCard } from "@/components/explore-item-card";
import { CATEGORIES } from "@/lib/categories";
import type { Item } from "@/lib/types";

const RADIUS_OPTIONS = [
  { value: "", label: "Cualquier distancia" },
  { value: "1", label: "Hasta 1 km" },
  { value: "5", label: "Hasta 5 km" },
  { value: "10", label: "Hasta 10 km" },
  { value: "25", label: "Hasta 25 km" },
  { value: "50", label: "Hasta 50 km" },
];

const RATING_OPTIONS = [
  { value: "0", label: "Cualquier calificación" },
  { value: "3", label: "3.0 o más" },
  { value: "3.5", label: "3.5 o más" },
  { value: "4", label: "4.0 o más" },
  { value: "4.5", label: "4.5 o más" },
  { value: "5", label: "5.0" },
];

function ChainLink() {
  return (
    <div
      aria-hidden
      className="hidden shrink-0 items-center text-gold/70 lg:flex"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="h-px w-5 bg-current" />
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </div>
  );
}

const selectClass =
  "w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-paper outline-none transition-colors focus:border-gold/60 focus:bg-white/15 [&>option]:text-ink";

export function ExploreFeed({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [minRating, setMinRating] = useState("0");

  const filtered = useMemo(() => {
    const radius = radiusKm ? Number(radiusKm) : null;
    const rating = Number(minRating);

    return items.filter((item) => {
      const matchesQuery = item.title.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = category ? item.category === category : true;
      const matchesRadius =
        radius === null ? true : item.distanceKm !== undefined && item.distanceKm <= radius;
      const matchesRating = item.ownerRating >= rating;
      return matchesQuery && matchesCategory && matchesRadius && matchesRating;
    });
  }, [items, query, category, radiusKm, minRating]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">
          La cadena completa
        </span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
          Todos los trueques
        </h1>
        <p className="mt-2 text-ink/60">
          Filtrá por lo que buscás, cuán cerca lo tenés, y con quién confiás — cada filtro es
          un eslabón más para encontrar tu cadena de trueque.
        </p>
      </div>

      <div className="mt-7 rounded-3xl bg-pine-dark px-5 py-5 shadow-[0_20px_40px_-24px_rgba(28,70,58,0.6)] sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/50" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="¿Qué estás buscando?"
              className="w-full rounded-full border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-paper outline-none placeholder:text-paper/50 focus:border-gold/60 focus:bg-white/15"
            />
          </div>

          <ChainLink />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={`${selectClass} lg:w-56`}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <ChainLink />

          <select
            value={radiusKm}
            onChange={(event) => setRadiusKm(event.target.value)}
            className={`${selectClass} lg:w-48`}
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChainLink />

          <select
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            className={`${selectClass} lg:w-48`}
          >
            {RATING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-5 font-data text-xs uppercase tracking-wide text-ink/40">
        {filtered.length} {filtered.length === 1 ? "objeto" : "objetos"} disponibles
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <ExploreItemCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-ink/50">
          No encontramos objetos que coincidan. Probá aflojar algún filtro.
        </p>
      )}
    </section>
  );
}
