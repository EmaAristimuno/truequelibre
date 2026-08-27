import { CheckCircle2, XCircle } from "lucide-react";
import { acceptMatch, confirmDelivery, cancelMatch } from "@/lib/actions/matches";
import type { MatchView } from "@/lib/queries/matches";
import { SubmitButton } from "@/components/submit-button";

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

  const cancelButton = (
    <form action={cancelMatch}>
      <input type="hidden" name="match_id" value={match.id} />
      <SubmitButton
        pendingText="Rechazando..."
        className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <XCircle className="h-4 w-4" />
        Rechazar
      </SubmitButton>
    </form>
  );

  if (match.status === "proposed") {
    return (
      <div className="flex items-center gap-4">
        {iAlreadyConfirmed ? (
          <p className="text-sm text-stone-500">
            Ya confirmaste. Esperando al resto de las partes.
          </p>
        ) : (
          <form action={acceptMatch}>
            <input type="hidden" name="match_id" value={match.id} />
            <SubmitButton
              pendingText="Confirmando..."
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Aceptar trueque
            </SubmitButton>
          </form>
        )}
        {cancelButton}
      </div>
    );
  }

  if (match.status === "accepted") {
    return (
      <div className="flex items-center gap-4">
        {iAlreadyReceived ? (
          <p className="text-sm text-stone-500">
            Confirmaste la entrega. Esperando al resto de las partes.
          </p>
        ) : (
          <form action={confirmDelivery}>
            <input type="hidden" name="match_id" value={match.id} />
            <SubmitButton
              pendingText="Confirmando..."
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirmar que recibí mi objeto
            </SubmitButton>
          </form>
        )}
        {cancelButton}
      </div>
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

  if (match.status === "cancelled") {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-stone-500">
        <XCircle className="h-4 w-4" />
        Trueque rechazado
      </p>
    );
  }

  return null;
}
