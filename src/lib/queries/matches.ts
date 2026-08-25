import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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

async function enrichLegs(
  supabase: SupabaseServerClient,
  legs: {
    item_id: string;
    giver_id: string;
    receiver_id: string;
    giver_confirmed: boolean;
    receiver_confirmed: boolean;
  }[],
): Promise<MatchLegView[]> {
  const itemIds = [...new Set(legs.map((leg) => leg.item_id))];
  const participantIds = [
    ...new Set(legs.flatMap((leg) => [leg.giver_id, leg.receiver_id])),
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

  return legs.map((leg) => ({
    itemId: leg.item_id,
    itemTitle: itemById.get(leg.item_id)?.title ?? "Objeto",
    itemCategory: itemById.get(leg.item_id)?.category ?? "",
    giverId: leg.giver_id,
    giverName: nameById.get(leg.giver_id) ?? "Usuario",
    receiverId: leg.receiver_id,
    receiverName: nameById.get(leg.receiver_id) ?? "Usuario",
    giverConfirmed: leg.giver_confirmed,
    receiverConfirmed: leg.receiver_confirmed,
  }));
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

  return Promise.all(
    matches.map(async (match) => ({
      id: match.id,
      status: match.status,
      legs: await enrichLegs(
        supabase,
        allLegs.filter((leg) => leg.match_id === match.id),
      ),
    })),
  );
}

export async function getMatchById(matchId: string): Promise<MatchView | null> {
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, status")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return null;

  const { data: legs } = await supabase
    .from("match_legs")
    .select("item_id, giver_id, receiver_id, giver_confirmed, receiver_confirmed")
    .eq("match_id", matchId);

  if (!legs || legs.length === 0) return null;

  return {
    id: match.id,
    status: match.status,
    legs: await enrichLegs(supabase, legs),
  };
}
