import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMatchById } from "@/lib/queries/matches";
import { getMatchMessages } from "@/lib/queries/messages";
import { getRatedUserIds } from "@/lib/queries/ratings";
import { MatchActions } from "@/components/match-actions";
import { ChatPanel } from "@/components/chat-panel";
import { RatingForm } from "@/components/rating-form";

const STATUS_LABEL: Record<string, string> = {
  proposed: "Propuesto",
  accepted: "Aceptado",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {match.legs.length === 2
              ? "Trueque bilateral"
              : `Cadena de ${match.legs.length}`}
          </span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
            {STATUS_LABEL[match.status] ?? match.status}
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
              {leg.giverReceived && leg.receiverReceived && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
            </div>
          ))}
        </div>

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
