import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ArrowLeftRight } from "lucide-react";
import { proposeTrade } from "@/lib/actions/matches";
import { CONDITION_LABEL } from "@/lib/types";
import { SubmitButton } from "@/components/submit-button";
import type { ItemDetail } from "@/lib/queries/item-detail";
import type { MyItem } from "@/lib/queries/my-items";

export function PublicItemView({
  item,
  myAvailableItems,
}: {
  item: ItemDetail;
  myAvailableItems: MyItem[];
}) {
  return (
    <div>
      {item.images.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          <div className="relative col-span-4 h-64 overflow-hidden rounded-2xl bg-stone-100 sm:h-80">
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              sizes="(min-width: 640px) 576px, 100vw"
              className="object-cover"
            />
          </div>
          {item.images.slice(1).map((url) => (
            <div key={url} className="relative h-16 overflow-hidden rounded-lg bg-stone-100">
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100 text-7xl sm:h-80">
          📦
        </div>
      )}

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {item.category}
          </span>
          <h1 className="mt-0.5 text-xl font-bold text-stone-900">{item.title}</h1>
        </div>
        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
          {CONDITION_LABEL[item.condition]}
        </span>
      </div>

      {item.description && (
        <p className="mt-3 text-sm text-stone-600">{item.description}</p>
      )}

      <div className="mt-4 flex items-start gap-1.5 text-sm text-stone-600">
        <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="flex flex-wrap gap-1.5">
          <span className="text-stone-500">Busca:</span>
          {item.lookingForCategories.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {item.lookingForDescription && (
        <p className="mt-1.5 text-sm text-stone-500">{item.lookingForDescription}</p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-4 text-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
          {item.ownerUsername.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-medium text-stone-800">{item.ownerUsername}</p>
          <p className="flex items-center gap-0.5 text-xs text-stone-500">
            <MapPin className="h-3 w-3" />
            {item.ownerLocation}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-stone-700">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {item.ownerRating.toFixed(1)}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold text-stone-900">Proponer trueque</p>

        {myAvailableItems.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">
            Necesitás tener algún objeto disponible para ofrecer a cambio.{" "}
            <Link href="/publicar" className="font-medium text-emerald-700 hover:underline">
              Publicá uno
            </Link>
            .
          </p>
        ) : (
          <form action={proposeTrade} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="target_item_id" value={item.id} />
            <select
              name="offered_item_id"
              required
              defaultValue=""
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="" disabled>
                ¿Qué le ofrecés a cambio?
              </option>
              {myAvailableItems.map((mine) => (
                <option key={mine.id} value={mine.id}>
                  {mine.title}
                </option>
              ))}
            </select>
            <SubmitButton
              pendingText="Enviando..."
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proponer trueque
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
