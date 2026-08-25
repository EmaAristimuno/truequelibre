import { Rocket } from "lucide-react";
import { createFeatureOrder } from "@/lib/actions/payments";
import { BOOST_PRICE_USD, BOOST_DURATION_DAYS } from "@/lib/boost";

export function BoostItemCard({
  itemId,
  status,
  featuredUntil,
}: {
  itemId: string;
  status: string;
  featuredUntil: string | null;
}) {
  const isFeatured = featuredUntil !== null && new Date(featuredUntil) > new Date();

  return (
    <div className="mt-6 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
        <Rocket className="h-5 w-5" />
      </span>

      <div className="flex-1">
        <p className="text-sm font-semibold text-stone-900">Destacar publicación</p>
        {isFeatured ? (
          <p className="text-xs text-stone-600">
            Destacada hasta el{" "}
            {new Date(featuredUntil!).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        ) : (
          <p className="text-xs text-stone-600">
            Aparece primero en el feed por {BOOST_DURATION_DAYS} días · US${BOOST_PRICE_USD}
          </p>
        )}
      </div>

      {!isFeatured && status === "available" && (
        <form action={createFeatureOrder}>
          <input type="hidden" name="item_id" value={itemId} />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Destacar
          </button>
        </form>
      )}
    </div>
  );
}
