"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { runMatching } from "@/lib/matching/run-matching";
import type { ItemCondition } from "@/lib/types";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

  const images = await uploadImages(supabase, user.id, formData);

  const { error } = await supabase.from("items").insert({
    owner_id: user.id,
    title,
    description,
    category,
    condition,
    images,
    looking_for_categories: lookingForCategories,
    looking_for_description: lookingForDescription,
  });

  if (error) {
    redirect(`/publicar?error=${encodeURIComponent(error.message)}`);
  }

  const { createdMatches } = await runMatching();

  redirect(createdMatches > 0 ? "/matches?found=1" : "/?published=1");
}
