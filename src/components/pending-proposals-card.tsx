import Image from "next/image";
import { Inbox } from "lucide-react";
import { selectProposal, rejectProposal } from "@/lib/actions/matches";
import type { PendingProposal } from "@/lib/queries/proposals";
import { SubmitButton } from "@/components/submit-button";

export function PendingProposalsCard({ proposals }: { proposals: PendingProposal[] }) {
  if (proposals.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
        <Inbox className="h-4 w-4 text-emerald-700" />
        Propuestas recibidas ({proposals.length})
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {proposals.map((proposal) => (
          <div
            key={proposal.matchId}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 text-xl">
              {proposal.offeredItemImageUrl ? (
                <Image
                  src={proposal.offeredItemImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                "📦"
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-stone-800">
                <span className="font-semibold">{proposal.proposerUsername}</span> te ofrece{" "}
                <span className="font-semibold">{proposal.offeredItemTitle}</span>
              </p>
            </div>
            <form action={selectProposal}>
              <input type="hidden" name="match_id" value={proposal.matchId} />
              <SubmitButton
                pendingText="..."
                className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aceptar
              </SubmitButton>
            </form>
            <form action={rejectProposal}>
              <input type="hidden" name="match_id" value={proposal.matchId} />
              <SubmitButton
                pendingText="..."
                className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Rechazar
              </SubmitButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
