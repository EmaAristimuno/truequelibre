import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Repeat, Navigation, Sparkles } from "lucide-react";
import { CONDITION_LABEL, type Item } from "@/lib/types";
import { formatDistanceKm } from "@/lib/distance";

export function ExploreItemCard({ item }: { item: Item }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[22px] border border-ink/10 bg-white shadow-[0_1px_0_rgba(35,40,31,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-18px_rgba(35,40,31,0.35)]">
      <Link
        href={`/items/${item.id}`}
        className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-pine/15 via-paper-dim to-gold/15 text-6xl"
      >
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

        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink/70 shadow-sm">
          {CONDITION_LABEL[item.condition]}
        </span>

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {item.featured && (
            <span className="flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
              <Sparkles className="h-3 w-3" />
              Destacado
            </span>
          )}
          {item.distanceKm !== undefined && (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-pine-dark shadow-sm">
              <Navigation className="h-3 w-3" />
              {formatDistanceKm(item.distanceKm)}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            <span aria-hidden className="h-1 w-1 rounded-full bg-clay" />
            {item.category}
          </span>
          <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink">
            <Link href={`/items/${item.id}`} className="hover:underline">
              {item.title}
            </Link>
          </h3>
        </div>

        <div className="flex items-start gap-2 text-sm text-ink/70">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/60 text-gold">
            <Repeat className="h-3 w-3" />
          </span>
          <div className="flex flex-wrap gap-1.5">
            {item.lookingFor.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-pine/10 px-2 py-0.5 text-xs font-medium text-pine-dark"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/10 text-xs font-semibold text-ink/70">
              {item.ownerName.charAt(0)}
            </span>
            <div className="text-xs">
              <p className="font-medium text-ink/80">{item.ownerName}</p>
              <p className="flex items-center gap-0.5 text-ink/50">
                <MapPin className="h-3 w-3" />
                {item.ownerLocation}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 font-data text-xs font-bold text-ink/70">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            {item.ownerRating.toFixed(1)}
          </span>
        </div>

        <Link
          href={`/items/${item.id}`}
          className="mt-1 block w-full rounded-xl bg-clay py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-clay-dark"
        >
          Proponer trueque
        </Link>
      </div>
    </article>
  );
}
