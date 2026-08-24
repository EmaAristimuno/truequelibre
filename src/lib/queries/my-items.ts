import { createClient } from "@/lib/supabase/server";
import { CATEGORY_EMOJI } from "@/lib/categories";
import type { ItemCondition, ItemStatus } from "@/lib/types";

export interface MyItem {
  id: string;
  title: string;
  category: string;
  emoji: string;
  imageUrl?: string;
  condition: ItemCondition;
  status: ItemStatus;
  lookingFor: string[];
  createdAt: string;
}

export async function getMyItems(userId: string): Promise<MyItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("items")
    .select(
      "id, title, category, condition, status, looking_for_categories, created_at, images",
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    emoji: CATEGORY_EMOJI[item.category] ?? "📦",
    imageUrl: item.images?.[0],
    condition: item.condition as ItemCondition,
    status: item.status as ItemStatus,
    lookingFor: item.looking_for_categories,
    createdAt: item.created_at,
  }));
}
