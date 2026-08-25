import { createClient } from "@/lib/supabase/server";

export interface PendingProposal {
  matchId: string;
  proposerUsername: string;
  offeredItemTitle: string;
  offeredItemImageUrl?: string;
  createdAt: string;
}

// Propuestas manuales pendientes de que el dueño de `itemId` elija una
// (ver selectProposal/rejectProposal en actions/matches.ts).
export async function getPendingProposalsForItem(itemId: string): Promise<PendingProposal[]> {
  const supabase = await createClient();

  const { data: myLeg } = await supabase
    .from("match_legs")
    .select("match_id")
    .eq("item_id", itemId);

  const matchIds = [...new Set(myLeg?.map((leg) => leg.match_id) ?? [])];
  if (matchIds.length === 0) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("id, initiated_by, created_at")
    .in("id", matchIds)
    .eq("status", "proposed")
    .not("initiated_by", "is", null);

  if (!matches || matches.length === 0) return [];

  const { data: legs } = await supabase
    .from("match_legs")
    .select("match_id, item_id, giver_id")
    .in(
      "match_id",
      matches.map((match) => match.id),
    );

  const proposerIds = matches.map((match) => match.initiated_by as string);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", proposerIds);
  const usernameById = new Map(profiles?.map((profile) => [profile.id, profile.username]));

  // El leg "ofrecido" en cada match es el que da quien propuso.
  const offeredLegByMatchId = new Map(
    (legs ?? [])
      .filter((leg) => matches.some((match) => match.id === leg.match_id && match.initiated_by === leg.giver_id))
      .map((leg) => [leg.match_id, leg]),
  );

  const { data: items } = await supabase
    .from("items")
    .select("id, title, images")
    .in("id", [...offeredLegByMatchId.values()].map((leg) => leg.item_id));
  const itemById = new Map(items?.map((item) => [item.id, item]));

  return matches.map((match) => {
    const offeredLeg = offeredLegByMatchId.get(match.id);
    const offeredItem = offeredLeg ? itemById.get(offeredLeg.item_id) : undefined;

    return {
      matchId: match.id,
      proposerUsername: usernameById.get(match.initiated_by as string) ?? "Usuario",
      offeredItemTitle: offeredItem?.title ?? "Objeto",
      offeredItemImageUrl: offeredItem?.images?.[0],
      createdAt: match.created_at,
    };
  });
}

export interface SentProposal {
  matchId: string;
  targetItemTitle: string;
  targetItemId: string;
  status: "pending" | "selected" | "rejected";
  createdAt: string;
}

export async function getMySentProposals(userId: string): Promise<SentProposal[]> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, status, created_at")
    .eq("initiated_by", userId)
    .order("created_at", { ascending: false });

  if (!matches || matches.length === 0) return [];

  const { data: legs } = await supabase
    .from("match_legs")
    .select("match_id, item_id, receiver_id")
    .in(
      "match_id",
      matches.map((match) => match.id),
    )
    .eq("receiver_id", userId);

  const targetItemIds = (legs ?? []).map((leg) => leg.item_id);
  const { data: items } = await supabase
    .from("items")
    .select("id, title, status")
    .in("id", targetItemIds);
  const itemById = new Map(items?.map((item) => [item.id, item]));

  return matches.map((match) => {
    const leg = legs?.find((l) => l.match_id === match.id);
    const item = leg ? itemById.get(leg.item_id) : undefined;

    let status: SentProposal["status"] = "pending";
    if (match.status === "cancelled") status = "rejected";
    else if (item?.status === "matched" || match.status !== "proposed") status = "selected";

    return {
      matchId: match.id,
      targetItemTitle: item?.title ?? "Objeto",
      targetItemId: leg?.item_id ?? "",
      status,
      createdAt: match.created_at,
    };
  });
}
