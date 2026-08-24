import { createClient } from "@/lib/supabase/server";

export interface MatchLegView {
  itemId: string;
  itemTitle: string;
  itemCategory: string;
  giverId: string;
  giverName: string;
  receiverId: string;
  receiverName: string;
  giverConfirmed: boolean;
  receiverConfirmed: boolean;
}

export interface MatchView {
  id: string;
  status: string;
  legs: MatchLegView[];
}

export async function getMyMatches(userId: string): Promise<MatchView[]> {
  const supabase = await createClient();

  const { data: myLegs } = await supabase
    .from("match_legs")
    .select("match_id")
    .or(`giver_id.eq.${userId},receiver_id.eq.${userId}`);

  const matchIds = [...new Set(myLegs?.map((leg) => leg.match_id) ?? [])];
  if (matchIds.length === 0) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("id, status")
    .in("id", matchIds)
    .order("created_at", { ascending: false });

  const { data: allLegs } = await supabase
    .from("match_legs")
    .select(
      "match_id, item_id, giver_id, receiver_id, giver_confirmed, receiver_confirmed",
    )
    .in("match_id", matchIds);

  if (!matches || !allLegs) return [];

  const itemIds = [...new Set(allLegs.map((leg) => leg.item_id))];
  const participantIds = [
    ...new Set(allLegs.flatMap((leg) => [leg.giver_id, leg.receiver_id])),
  ];

  const { data: items } = await supabase
    .from("items")
    .select("id, title, category")
    .in("id", itemIds);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", participantIds);

  const itemById = new Map(items?.map((item) => [item.id, item]));
  const nameById = new Map(profiles?.map((profile) => [profile.id, profile.username]));

  return matches.map((match) => ({
    id: match.id,
    status: match.status,
    legs: allLegs
      .filter((leg) => leg.match_id === match.id)
      .map((leg) => ({
        itemId: leg.item_id,
        itemTitle: itemById.get(leg.item_id)?.title ?? "Objeto",
        itemCategory: itemById.get(leg.item_id)?.category ?? "",
        giverId: leg.giver_id,
        giverName: nameById.get(leg.giver_id) ?? "Usuario",
        receiverId: leg.receiver_id,
        receiverName: nameById.get(leg.receiver_id) ?? "Usuario",
        giverConfirmed: leg.giver_confirmed,
        receiverConfirmed: leg.receiver_confirmed,
      })),
  }));
}
