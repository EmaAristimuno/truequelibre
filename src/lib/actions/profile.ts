"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateLocation(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/perfil");
  }

  const location = String(formData.get("location") ?? "").trim();
  const latitudeRaw = String(formData.get("latitude") ?? "").trim();
  const longitudeRaw = String(formData.get("longitude") ?? "").trim();
  const latitude = latitudeRaw === "" ? null : Number(latitudeRaw);
  const longitude = longitudeRaw === "" ? null : Number(longitudeRaw);

  await supabase
    .from("profiles")
    .update({
      location: location || null,
      latitude: latitude !== null && Number.isFinite(latitude) ? latitude : null,
      longitude: longitude !== null && Number.isFinite(longitude) ? longitude : null,
    })
    .eq("id", userData.user.id);

  revalidatePath("/perfil");
}
