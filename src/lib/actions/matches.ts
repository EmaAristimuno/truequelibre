"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptMatch(formData: FormData) {
  const matchId = String(formData.get("match_id") ?? "");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/matches");
  }
  const userId = userData.user.id;

  await supabase
    .from("match_legs")
    .update({ giver_confirmed: true })
    .eq("match_id", matchId)
    .eq("giver_id", userId);

  await supabase
    .from("match_legs")
    .update({ receiver_confirmed: true })
    .eq("match_id", matchId)
    .eq("receiver_id", userId);

  const { data: legs } = await supabase
    .from("match_legs")
    .select("giver_confirmed, receiver_confirmed")
    .eq("match_id", matchId);

  const allConfirmed = legs?.every(
    (leg) => leg.giver_confirmed && leg.receiver_confirmed,
  );

  if (allConfirmed) {
    await supabase.from("matches").update({ status: "accepted" }).eq("id", matchId);
  }

  revalidatePath("/matches");
}

export async function confirmDelivery(formData: FormData) {
  const matchId = String(formData.get("match_id") ?? "");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/matches");
  }
  const userId = userData.user.id;

  await supabase
    .from("match_legs")
    .update({ giver_received: true })
    .eq("match_id", matchId)
    .eq("giver_id", userId);

  await supabase
    .from("match_legs")
    .update({ receiver_received: true })
    .eq("match_id", matchId)
    .eq("receiver_id", userId);

  const { data: legs } = await supabase
    .from("match_legs")
    .select("item_id, giver_received, receiver_received")
    .eq("match_id", matchId);

  const allReceived = legs?.every(
    (leg) => leg.giver_received && leg.receiver_received,
  );

  if (legs && allReceived) {
    await supabase.from("matches").update({ status: "completed" }).eq("id", matchId);
    await supabase
      .from("items")
      .update({ status: "completed" })
      .in("id", legs.map((leg) => leg.item_id));
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
}
