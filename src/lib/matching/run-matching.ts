import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { findTradeCycles, type MatchableItem } from "@/lib/matching/find-cycles";

/**
 * Corre el algoritmo contra todos los items disponibles y persiste cada
 * ciclo encontrado como un match + sus legs, reservando (status: 'matched')
 * los items involucrados para que no entren en otro ciclo a la vez.
 */
export async function runMatching(): Promise<{ createdMatches: number }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY no está configurada; se omite el matching.");
    return { createdMatches: 0 };
  }

  const supabase = createAdminClient();

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id, owner_id, category, looking_for_categories")
    .eq("status", "available");

  if (itemsError || !items || items.length < 2) {
    return { createdMatches: 0 };
  }

  const matchable: MatchableItem[] = items.map((item) => ({
    id: item.id,
    ownerId: item.owner_id,
    category: item.category,
    lookingFor: item.looking_for_categories,
  }));

  // Priorizamos ciclos más cortos (bilaterales) antes que cadenas largas.
  const cycles = findTradeCycles(matchable).sort((a, b) => a.length - b.length);

  const reservedItemIds = new Set<string>();
  let createdMatches = 0;

  for (const legs of cycles) {
    if (legs.some((leg) => reservedItemIds.has(leg.itemId))) continue;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({ status: "proposed" })
      .select("id")
      .single();

    if (matchError || !match) continue;

    const { error: legsError } = await supabase.from("match_legs").insert(
      legs.map((leg) => ({
        match_id: match.id,
        giver_id: leg.giverId,
        receiver_id: leg.receiverId,
        item_id: leg.itemId,
      })),
    );

    if (legsError) {
      await supabase.from("matches").delete().eq("id", match.id);
      continue;
    }

    await supabase
      .from("items")
      .update({ status: "matched" })
      .in(
        "id",
        legs.map((leg) => leg.itemId),
      );

    legs.forEach((leg) => reservedItemIds.add(leg.itemId));
    createdMatches += 1;
  }

  return { createdMatches };
}
