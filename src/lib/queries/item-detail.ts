import { createClient } from "@/lib/supabase/server";
import type { ItemCondition, ItemStatus } from "@/lib/types";

export interface ItemDetail {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  condition: ItemCondition;
  images: string[];
  lookingForCategories: string[];
  lookingForDescription: string;
  status: ItemStatus;
  featuredUntil: string | null;
}

export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("items")
    .select(
      "id, owner_id, title, description, category, condition, images, looking_for_categories, looking_for_description, status, featured_until",
    )
    .eq("id", id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    ownerId: data.owner_id,
    title: data.title,
    description: data.description ?? "",
    category: data.category,
    condition: data.condition as ItemCondition,
    images: data.images ?? [],
    lookingForCategories: data.looking_for_categories ?? [],
    lookingForDescription: data.looking_for_description ?? "",
    status: data.status as ItemStatus,
    featuredUntil: data.featured_until,
  };
}
