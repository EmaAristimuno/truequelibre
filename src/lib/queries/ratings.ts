import { createClient } from "@/lib/supabase/server";

export async function getRatedUserIds(
  matchId: string,
  raterId: string,
): Promise<Set<string>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("ratings")
    .select("ratee_id")
    .eq("match_id", matchId)
    .eq("rater_id", raterId);

  return new Set(data?.map((rating) => rating.ratee_id) ?? []);
}
