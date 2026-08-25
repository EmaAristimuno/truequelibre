import { CheckCircle2 } from "lucide-react";
import { acceptMatch, confirmDelivery } from "@/lib/actions/matches";
import type { MatchView } from "@/lib/queries/matches";

export function MatchActions({
  match,
  userId,
}: {
  match: MatchView;
  userId: string;
}) {
  const myLegs = match.legs.filter(
    (leg) => leg.giverId === userId || leg.receiverId === userId,
  );

  const iAlreadyConfirmed = myLegs.every(
    (leg) =>
      (leg.giverId !== userId || leg.giverConfirmed) &&
      (leg.receiverId !== userId || leg.receiverConfirmed),
  );

  const iAlreadyReceived = myLegs.every(
    (leg) =>
      (leg.giverId !== userId || leg.giverReceived) &&
      (leg.receiverId !== userId || leg.receiverReceived),
  );

  if (match.status === "proposed") {
    if (iAlreadyConfirmed) {
      return (
        <p className="text-sm text-stone-500">
          Ya confirmaste. Esperando al resto de las partes.
        </p>
      );
    }
    return (
      <form action={acceptMatch}>
        <input type="hidden" name="match_id" value={match.id} />
        <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">
          Aceptar trueque
        </button>
      </form>
    );
  }

  if (match.status === "accepted") {
    if (iAlreadyReceived) {
      return (
        <p className="text-sm text-stone-500">
          Confirmaste la entrega. Esperando al resto de las partes.
        </p>
      );
    }
    return (
      <form action={confirmDelivery}>
        <input type="hidden" name="match_id" value={match.id} />
        <button className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600">
          Confirmar que recibí mi objeto
        </button>
      </form>
    );
  }

  if (match.status === "completed") {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Trueque completado
      </p>
    );
  }

  return null;
}
