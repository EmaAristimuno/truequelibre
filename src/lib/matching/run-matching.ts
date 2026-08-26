import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { findTradeCycles, type MatchableItem } from "@/lib/matching/find-cycles";
import { notifyMatchProposed } from "@/lib/email/notify";

/**
 * Corre el algoritmo contra todos los items disponibles y persiste cada
 * ciclo encontrado como un match ("proposed") + sus legs. Los items NO se
 * reservan (siguen "available") hasta que el trueque sea aceptado por
 * todas las partes (ver acceptMatch en actions/matches.ts): mientras el
 * match está solo propuesto, el objeto sigue visible y ofrecible por
 * cualquier otra persona.
 *
 * La cercanía entre los dueños es siempre el criterio de orden principal
 * (findTradeCycles ya devuelve los ciclos ordenados por distancia total),
 * y el radio máximo que cada usuario haya configurado actúa como filtro
 * duro: ese ciclo directamente no se genera si lo excede.
 */
export async function runMatching(): Promise<{ createdMatches: number }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY no está configurada; se omite el matching.");
    return { createdMatches: 0 };
  }

  const supabase = createAdminClient();

  const { data: allItems, error: itemsError } = await supabase
    .from("items")
    .select("id, owner_id, category, looking_for_categories")
    .eq("status", "available");

  if (itemsError || !allItems || allItems.length < 2) {
    return { createdMatches: 0 };
  }

  // Un objeto sigue "available" (visible y ofrecible por otros) mientras su
  // trueque no esté confirmado por ambas partes — pero no por eso el
  // algoritmo debe volver a proponerlo: si ya tiene un match pendiente o
  // aceptado, lo sacamos del pool para no generar ciclos duplicados o en
  // conflicto en cada corrida.
  const { data: activeMatches } = await supabase
    .from("matches")
    .select("id")
    .in("status", ["proposed", "accepted"]);

  const activeMatchIds = (activeMatches ?? []).map((match) => match.id);
  let alreadyMatchedItemIds = new Set<string>();
  if (activeMatchIds.length > 0) {
    const { data: activeLegs } = await supabase
      .from("match_legs")
      .select("item_id")
      .in("match_id", activeMatchIds);
    alreadyMatchedItemIds = new Set((activeLegs ?? []).map((leg) => leg.item_id));
  }

  const items = allItems.filter((item) => !alreadyMatchedItemIds.has(item.id));
  if (items.length < 2) {
    return { createdMatches: 0 };
  }

  const ownerIds = [...new Set(items.map((item) => item.owner_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, latitude, longitude, max_distance_km")
    .in("id", ownerIds);

  const profileById = new Map(profiles?.map((profile) => [profile.id, profile]));

  const matchable: MatchableItem[] = items.map((item) => {
    const profile = profileById.get(item.owner_id);
    return {
      id: item.id,
      ownerId: item.owner_id,
      category: item.category,
      lookingFor: item.looking_for_categories,
      lat: profile?.latitude ?? undefined,
      lng: profile?.longitude ?? undefined,
      maxDistanceKm: profile?.max_distance_km ?? undefined,
    };
  });

  // Ya vienen ordenados por cercanía primero, cantidad de personas después.
  const cycles = findTradeCycles(matchable);

  const reservedItemIds = new Set<string>();
  let createdMatches = 0;

  for (const cycle of cycles) {
    const { legs } = cycle;
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
        distance_km: leg.distanceKm ?? null,
      })),
    );

    if (legsError) {
      await supabase.from("matches").delete().eq("id", match.id);
      continue;
    }

    legs.forEach((leg) => reservedItemIds.add(leg.itemId));
    createdMatches += 1;

    const participantIds = [...new Set(legs.map((leg) => leg.giverId))];
    await notifyMatchProposed(match.id, participantIds, legs.length > 2);
  }

  return { createdMatches };
}
