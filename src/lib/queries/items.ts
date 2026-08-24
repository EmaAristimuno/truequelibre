import { createClient } from "@/lib/supabase/server";
import { CATEGORY_EMOJI } from "@/lib/categories";
import type { Item, ItemCondition } from "@/lib/types";

export async function getAvailableItems(): Promise<Item[]> {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("items")
    .select("id, title, category, condition, looking_for_categories, owner_id, images")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (!items || items.length === 0) return [];

  const ownerIds = [...new Set(items.map((item) => item.owner_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, location, rating")
    .in("id", ownerIds);

  const profileById = new Map(profiles?.map((profile) => [profile.id, profile]));

  return items.map((item) => {
    const profile = profileById.get(item.owner_id);
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
    };
  });
}
