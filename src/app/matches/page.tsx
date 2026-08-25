import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyMatches } from "@/lib/queries/matches";
import { acceptMatch } from "@/lib/actions/matches";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ found?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/matches");
  }

  const matches = await getMyMatches(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Mis trueques</h1>

      {params.found && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ¡Encontramos un posible trueque para tu objeto! Revisalo abajo.
        </p>
      )}

      {matches.length === 0 && (
        <p className="mt-8 text-sm text-stone-500">
          Todavía no tenés trueques propuestos. Publicá un objeto para que el
          algoritmo busque matches, incluso en cadena con otras personas.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {matches.map((match) => {
          const myLegs = match.legs.filter(
            (leg) => leg.giverId === user.id || leg.receiverId === user.id,
          );
          const iAlreadyConfirmed = myLegs.every(
            (leg) =>
              (leg.giverId !== user.id || leg.giverConfirmed) &&
              (leg.receiverId !== user.id || leg.receiverConfirmed),
          );

          return (
            <div
              key={match.id}
              className="rounded-2xl border border-stone-200 bg-white p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {match.legs.length === 2
                    ? "Trueque bilateral"
                    : `Cadena de ${match.legs.length}`}
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                  {match.status === "proposed"
                    ? "Propuesto"
                    : match.status === "accepted"
                      ? "Aceptado"
                      : match.status}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {match.legs.map((leg) => (
                  <div
                    key={leg.itemId}
                    className="flex items-center gap-2 text-sm text-stone-700"
                  >
                    <span className="font-medium">{leg.giverName}</span>
                    <ArrowRight className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{leg.receiverName}</span>
                    <span className="text-stone-400">·</span>
                    <span>{leg.itemTitle}</span>
                    {leg.giverConfirmed && leg.receiverConfirmed && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                {match.status === "proposed" && !iAlreadyConfirmed && (
                  <form action={acceptMatch}>
                    <input type="hidden" name="match_id" value={match.id} />
                    <button className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">
                      Aceptar trueque
                    </button>
                  </form>
                )}
                {iAlreadyConfirmed && match.status === "proposed" && (
                  <p className="text-sm text-stone-500">
                    Ya confirmaste. Esperando al resto de las partes.
                  </p>
                )}
                <Link
                  href={`/matches/${match.id}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir chat
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
