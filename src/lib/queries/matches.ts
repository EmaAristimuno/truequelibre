import { createClient } from "@/lib/supabase/server";
import { CATEGORY_EMOJI } from "@/lib/categories";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface MatchLegView {
  itemId: string;
  itemTitle: string;
  itemCategory: string;
  itemEmoji: string;
  itemImageUrl?: string;
  giverId: string;
  giverName: string;
  receiverId: string;
  receiverName: string;
  giverConfirmed: boolean;
  receiverConfirmed: boolean;
  giverReceived: boolean;
  receiverReceived: boolean;
  distanceKm?: number;
}

export interface MatchView {
  id: string;
  status: string;
  legs: MatchLegView[];
}

// Una propuesta manual (initiated_by no nulo) todavía no reserva los items:
// mientras el dueño no elige una, no es "un trueque real" y no debe
// aparecer en /matches (ver selectProposal en actions/matches.ts).
async function isUnselectedProposal(
  supabase: SupabaseServerClient,
  match: { status: string; initiated_by: string | null },
  itemIds: string[],
): Promise<boolean> {
  if (!match.initiated_by || match.status !== "proposed") return false;

  const { data: items } = await supabase.from("items").select("status").in("id", itemIds);
  return (items ?? []).some((item) => item.status === "available");
}

async function enrichLegs(
  supabase: SupabaseServerClient,
  legs: {
    item_id: string;
    giver_id: string;
    receiver_id: string;
    giver_confirmed: boolean;
    receiver_confirmed: boolean;
    giver_received: boolean;
    receiver_received: boolean;
    distance_km: number | null;
  }[],
): Promise<MatchLegView[]> {
  const itemIds = [...new Set(legs.map((leg) => leg.item_id))];
  const participantIds = [
    ...new Set(legs.flatMap((leg) => [leg.giver_id, leg.receiver_id])),
  ];

  const { data: items } = await supabase
    .from("items")
    .select("id, title, category, images")
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
    itemEmoji: CATEGORY_EMOJI[itemById.get(leg.item_id)?.category ?? ""] ?? "📦",
    itemImageUrl: itemById.get(leg.item_id)?.images?.[0],
    giverId: leg.giver_id,
    giverName: nameById.get(leg.giver_id) ?? "Usuario",
    receiverId: leg.receiver_id,
    receiverName: nameById.get(leg.receiver_id) ?? "Usuario",
    giverConfirmed: leg.giver_confirmed,
    receiverConfirmed: leg.receiver_confirmed,
    giverReceived: leg.giver_received,
    receiverReceived: leg.receiver_received,
    distanceKm: leg.distance_km ?? undefined,
  }));
}

const LEG_COLUMNS =
  "item_id, giver_id, receiver_id, giver_confirmed, receiver_confirmed, giver_received, receiver_received, distance_km";

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
    .select("id, status, initiated_by")
    .in("id", matchIds)
    .order("created_at", { ascending: false });

  const { data: allLegs } = await supabase
    .from("match_legs")
    .select(`match_id, ${LEG_COLUMNS}`)
    .in("match_id", matchIds);

  if (!matches || !allLegs) return [];

  const visible = await Promise.all(
    matches.map(async (match) => {
      const legs = allLegs.filter((leg) => leg.match_id === match.id);
      const unselected = await isUnselectedProposal(
        supabase,
        match,
        legs.map((leg) => leg.item_id),
      );
      return unselected ? null : { match, legs };
    }),
  );

  return Promise.all(
    visible
      .filter((entry): entry is { match: (typeof matches)[number]; legs: typeof allLegs } =>
        entry !== null,
      )
      .map(async ({ match, legs }) => ({
        id: match.id,
        status: match.status,
        legs: await enrichLegs(supabase, legs),
      })),
  );
}

export async function getMatchById(matchId: string): Promise<MatchView | null> {
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, status, initiated_by")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return null;

  const { data: legs } = await supabase
    .from("match_legs")
    .select(LEG_COLUMNS)
    .eq("match_id", matchId);

  if (!legs || legs.length === 0) return null;

  if (await isUnselectedProposal(supabase, match, legs.map((leg) => leg.item_id))) {
    return null;
  }

  return {
    id: match.id,
    status: match.status,
    legs: await enrichLegs(supabase, legs),
  };
}
