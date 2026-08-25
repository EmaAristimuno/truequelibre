import { createClient } from "@/lib/supabase/server";
import { CATEGORY_EMOJI } from "@/lib/categories";
import { haversineKm } from "@/lib/distance";
import type { Item, ItemCondition } from "@/lib/types";

export async function getAvailableItems(): Promise<Item[]> {
  const supabase = await createClient();

  const { data: rawItems } = await supabase
    .from("items")
    .select(
      "id, title, category, condition, looking_for_categories, owner_id, images, featured_until",
    )
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (!rawItems || rawItems.length === 0) return [];

  const now = Date.now();
  const isFeatured = (item: (typeof rawItems)[number]) =>
    item.featured_until !== null && new Date(item.featured_until).getTime() > now;

  // Los destacados van primero; el resto conserva el orden por fecha de
  // creación (Array.prototype.sort es estable, así que devolver 0 alcanza).
  const items = [...rawItems].sort((a, b) => {
    const aFeatured = isFeatured(a);
    const bFeatured = isFeatured(b);
    if (aFeatured === bFeatured) return 0;
    return aFeatured ? -1 : 1;
  });

  const ownerIds = [...new Set(items.map((item) => item.owner_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, location, rating, latitude, longitude")
    .in("id", ownerIds);

  const profileById = new Map(profiles?.map((profile) => [profile.id, profile]));

  const { data: userData } = await supabase.auth.getUser();
  let viewerCoords: { lat: number; lng: number } | null = null;
  if (userData.user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("latitude, longitude")
      .eq("id", userData.user.id)
      .single();
    if (viewerProfile?.latitude != null && viewerProfile?.longitude != null) {
      viewerCoords = { lat: viewerProfile.latitude, lng: viewerProfile.longitude };
    }
  }

  return items.map((item) => {
    const profile = profileById.get(item.owner_id);
    const ownerCoords =
      profile?.latitude != null && profile?.longitude != null
        ? { lat: profile.latitude, lng: profile.longitude }
        : null;

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      emoji: CATEGORY_EMOJI[item.category] ?? "📦",
      imageUrl: item.images?.[0],
      condition: item.condition as ItemCondition,
      lookingFor: item.looking_for_categories,
      ownerName: profile?.username ?? "Usuario",
      ownerLocation: profile?.location ?? "Sin ubicación",
      ownerRating: profile?.rating ?? 0,
      distanceKm:
        viewerCoords && ownerCoords ? haversineKm(viewerCoords, ownerCoords) : undefined,
      featured: isFeatured(item),
    };
  });
}
