import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMatchById } from "@/lib/queries/matches";
import { getMatchMessages } from "@/lib/queries/messages";
import { getRatedUserIds } from "@/lib/queries/ratings";
import { MatchActions } from "@/components/match-actions";
import { MatchLegList } from "@/components/match-leg-list";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { ChatPanel } from "@/components/chat-panel";
import { RatingForm } from "@/components/rating-form";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ selected?: string; found?: string }>;
}) {
  const { id } = await params;
  const { selected, found } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect(`/login?next=/matches/${id}`);
  }

  const match = await getMatchById(id);
  if (!match) {
    notFound();
  }

  const messages = await getMatchMessages(id);

  const participantNames: Record<string, string> = {};
  match.legs.forEach((leg) => {
    participantNames[leg.giverId] = leg.giverName;
    participantNames[leg.receiverId] = leg.receiverName;
  });

  const otherParticipantIds = Object.keys(participantNames).filter(
    (participantId) => participantId !== user.id,
  );

  const ratedUserIds =
    match.status === "completed"
      ? await getRatedUserIds(id, user.id)
      : new Set<string>();

  const pendingRatings = otherParticipantIds.filter(
    (participantId) => !ratedUserIds.has(participantId),
  );

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link
        href="/matches"
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis trueques
      </Link>

      {found && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ¡Encontramos un posible trueque para tu objeto! Revisalo acá abajo.
        </p>
      )}

      {selected && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ¡Aceptaste la propuesta! Confirmá el trueque para avanzar.
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
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

        <div className="mt-4">
          <MatchActions match={match} userId={user.id} />
        </div>
      </div>

      {match.status === "completed" && pendingRatings.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {pendingRatings.map((participantId) => (
            <RatingForm
              key={participantId}
              matchId={id}
              rateeId={participantId}
              rateeName={participantNames[participantId]}
            />
          ))}
        </div>
      )}

      <ChatPanel
        matchId={id}
        currentUserId={user.id}
        participantNames={participantNames}
        initialMessages={messages}
      />
    </div>
  );
}
