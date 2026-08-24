"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES } from "@/lib/categories";
import type { Item } from "@/lib/types";

export function FeedSection({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = item.title
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      const matchesCategory = category ? item.category === category : true;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, category]);

  return (
    <section id="feed" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Dale una segunda vida a lo que ya no usás
        </h1>
        <p className="mt-3 text-stone-600">
          Intercambiá objetos directamente con otras personas. Sin dinero, sin
          intermediarios — nuestro algoritmo encuentra el trueque perfecto,
          incluso en cadena.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="¿Qué estás buscando? Ej: bicicleta, consola, ropa..."
            className="w-full rounded-full border border-stone-200 bg-white py-3.5 pl-12 pr-4 text-sm text-stone-900 shadow-sm outline-none ring-emerald-600/30 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2"
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === null
                ? "bg-emerald-700 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-stone-500">
          No encontramos objetos que coincidan. Probá otra búsqueda.
        </p>
      )}
    </section>
  );
}
