import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { MatchLegView } from "@/lib/queries/matches";

export function MatchLegList({ legs }: { legs: MatchLegView[] }) {
  return (
    <div className="flex flex-col gap-2">
      {legs.map((leg) => (
        <div
          key={leg.itemId}
          className="flex items-center gap-3 rounded-xl bg-stone-50 p-2.5"
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-xl">
            {leg.itemImageUrl ? (
              <Image
                src={leg.itemImageUrl}
                alt={leg.itemTitle}
                fill
                className="object-cover"
              />
            ) : (
              leg.itemEmoji
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-900">
              {leg.itemTitle}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="font-medium text-stone-700">{leg.giverName}</span>
              <ArrowRight className="h-3 w-3 text-amber-500" />
              <span className="font-medium text-stone-700">{leg.receiverName}</span>
            </p>
          </div>

          {leg.giverReceived && leg.receiverReceived && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
        </div>
      ))}
    </div>
  );
}
