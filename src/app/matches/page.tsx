import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyMatches } from "@/lib/queries/matches";
import { MatchActions } from "@/components/match-actions";
import { MatchLegList } from "@/components/match-leg-list";
import { MatchStatusBadge } from "@/components/match-status-badge";

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
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Repeat className="h-7 w-7" />
          </span>
          <p className="max-w-xs text-sm text-stone-500">
            Todavía no tenés trueques propuestos. Publicá un objeto para que
            el algoritmo busque matches, incluso en cadena con otras
            personas.
          </p>
          <Link
            href="/publicar"
            className="mt-1 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Publicar mi objeto
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <Repeat className="h-3.5 w-3.5" />
                {match.legs.length === 2
                  ? "Trueque bilateral"
                  : `Cadena de ${match.legs.length}`}
              </span>
              <MatchStatusBadge status={match.status} />
            </div>

            <MatchLegList legs={match.legs} />

            <div className="mt-4 flex items-center gap-4">
              <MatchActions match={match} userId={user.id} />
              <Link
                href={`/matches/${match.id}`}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir chat
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
