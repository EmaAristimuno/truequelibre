"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runMatching } from "@/lib/matching/run-matching";
import { getActiveMatchIdForItem } from "@/lib/queries/matches";
import { MAX_IMAGES, MAX_IMAGE_BYTES } from "@/lib/image-limits";
import type { ItemCondition } from "@/lib/types";

// El uploader deja marcada una imagen como "principal" (cover) mediante un
// token "existing:<url>" o "new:<índice>" — acá se resuelve a la posición 0.
function reorderWithCover(
  existingKept: string[],
  newUrls: string[],
  coverToken: string,
): string[] {
  let cover: string | undefined;

  if (coverToken.startsWith("existing:")) {
    const url = coverToken.slice("existing:".length);
    if (existingKept.includes(url)) cover = url;
  } else if (coverToken.startsWith("new:")) {
    const index = Number(coverToken.slice("new:".length));
    if (Number.isInteger(index) && newUrls[index] !== undefined) cover = newUrls[index];
  }

  const rest = [...existingKept, ...newUrls].filter((url) => url !== cover);
  return (cover ? [cover, ...rest] : rest).slice(0, MAX_IMAGES);
}

async function uploadImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
): Promise<string[]> {
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .filter((file) => file.type.startsWith("image/") && file.size <= MAX_IMAGE_BYTES)
    .slice(0, MAX_IMAGES);

  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("item-images").upload(path, file, {
      contentType: file.type,
    });

    if (!error) {
      const { data } = supabase.storage.from("item-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }

  return urls;
}

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login?next=/publicar");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const condition = String(formData.get("condition") ?? "usado") as ItemCondition;
  const lookingForDescription = String(
    formData.get("looking_for_description") ?? "",
  ).trim();
  const lookingForCategories = formData.getAll("looking_for_categories").map(String);

  if (!title || !category || lookingForCategories.length === 0) {
    redirect(
      `/publicar?error=${encodeURIComponent("Completá título, categoría y qué buscás a cambio")}`,
    );
  }

  const newImages = await uploadImages(supabase, user.id, formData);
  const coverToken = String(formData.get("cover") ?? "");
  const images = reorderWithCover([], newImages, coverToken);

  const { data: newItem, error } = await supabase
    .from("items")
    .insert({
      owner_id: user.id,
      title,
      description,
      category,
      condition,
      images,
      looking_for_categories: lookingForCategories,
      looking_for_description: lookingForDescription,
    })
    .select("id")
    .single();

  if (error || !newItem) {
    redirect(`/publicar?error=${encodeURIComponent(error?.message ?? "Error al publicar")}`);
  }

  const { createdMatches } = await runMatching();

  if (createdMatches > 0) {
    const matchId = await getActiveMatchIdForItem(newItem.id);
    redirect(matchId ? `/matches/${matchId}?found=1` : "/matches?found=1");
  }

  redirect("/?published=1");
}

export type UpdateItemState = { success: boolean; error?: string } | null;

export async function updateItem(
  _prevState: UpdateItemState,
  formData: FormData,
): Promise<UpdateItemState> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const itemId = String(formData.get("item_id") ?? "");

  const { data: existing } = await supabase
    .from("items")
    .select("owner_id")
    .eq("id", itemId)
    .single();

  if (!existing || existing.owner_id !== user.id) {
    return { success: false, error: "No podés editar esta publicación" };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const condition = String(formData.get("condition") ?? "usado") as ItemCondition;
  const lookingForDescription = String(
    formData.get("looking_for_description") ?? "",
  ).trim();
  const lookingForCategories = formData.getAll("looking_for_categories").map(String);

  if (!title || !category || lookingForCategories.length === 0) {
    return {
      success: false,
      error: "Completá título, categoría y qué buscás a cambio",
    };
  }

  const keptImages = formData.getAll("keep_images").map(String);
  const newImages = await uploadImages(supabase, user.id, formData);
  const coverToken = String(formData.get("cover") ?? "");
  const images = reorderWithCover(keptImages, newImages, coverToken);

  const { error } = await supabase
    .from("items")
    .update({
      title,
      description,
      category,
      condition,
      images,
      looking_for_categories: lookingForCategories,
      looking_for_description: lookingForDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/perfil");
  revalidatePath(`/items/${itemId}`);
  return { success: true };
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const itemId = String(formData.get("item_id") ?? "");

  const { data: existing } = await supabase
    .from("items")
    .select("owner_id, status")
    .eq("id", itemId)
    .single();

  if (!existing || existing.owner_id !== user.id || existing.status !== "available") {
    redirect(`/items/${itemId}`);
  }

  await supabase.from("items").delete().eq("id", itemId);

  revalidatePath("/perfil");
  redirect("/perfil?deleted=1");
}
