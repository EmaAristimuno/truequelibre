"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitRating(formData: FormData) {
  const matchId = String(formData.get("match_id") ?? "");
  const rateeId = String(formData.get("ratee_id") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/matches");
  }

  if (score < 1 || score > 5) {
    revalidatePath(`/matches/${matchId}`);
    return;
  }

  const { error } = await supabase.from("ratings").insert({
    match_id: matchId,
    rater_id: userData.user.id,
    ratee_id: rateeId,
    score,
    comment: comment || null,
  });

  if (!error) {
    // Recalcular el promedio del calificado requiere escribir en un perfil
    // ajeno: se hace con el cliente admin, análogo al motor de matching.
    const admin = createAdminClient();
    const { data: allRatings } = await admin
      .from("ratings")
      .select("score")
      .eq("ratee_id", rateeId);

    if (allRatings && allRatings.length > 0) {
      const average =
        allRatings.reduce((sum, rating) => sum + rating.score, 0) / allRatings.length;
      await admin
        .from("profiles")
        .update({ rating: average, rating_count: allRatings.length })
        .eq("id", rateeId);
    }
  }

  revalidatePath(`/matches/${matchId}`);
}
