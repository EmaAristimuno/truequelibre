import Image from "next/image";
import { MapPin, Star, ArrowLeftRight, Navigation } from "lucide-react";
import { CONDITION_LABEL, type Item } from "@/lib/types";

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-amber-100 text-6xl">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          item.emoji
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm">
          {CONDITION_LABEL[item.condition]}
        </span>
        {item.distanceKm !== undefined && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm">
            <Navigation className="h-3 w-3" />
            {formatDistance(item.distanceKm)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Ofrece · {item.category}
          </span>
          <h3 className="mt-0.5 text-base font-semibold text-stone-900">
            {item.title}
          </h3>
        </div>

        <div className="flex items-start gap-1.5 text-sm text-stone-600">
          <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex flex-wrap gap-1.5">
            <span className="text-stone-500">Busca:</span>
            {item.lookingFor.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
              {item.ownerName.charAt(0)}
            </span>
            <div className="text-xs">
              <p className="font-medium text-stone-800">{item.ownerName}</p>
              <p className="flex items-center gap-0.5 text-stone-500">
                <MapPin className="h-3 w-3" />
                {item.ownerLocation}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-stone-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {item.ownerRating.toFixed(1)}
          </span>
        </div>

        <button className="mt-1 w-full rounded-xl bg-emerald-700 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">
          Proponer trueque
        </button>
      </div>
    </article>
  );
}
