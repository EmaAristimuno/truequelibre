"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyMatchAccepted, notifyMatchCompleted } from "@/lib/email/notify";

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
    .select("giver_id, giver_confirmed, receiver_confirmed")
    .eq("match_id", matchId);

  const allConfirmed = legs?.every(
    (leg) => leg.giver_confirmed && leg.receiver_confirmed,
  );

  if (legs && allConfirmed) {
    await supabase.from("matches").update({ status: "accepted" }).eq("id", matchId);
    const participantIds = [...new Set(legs.map((leg) => leg.giver_id))];
    await notifyMatchAccepted(matchId, participantIds);
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
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
    .select("item_id, giver_id, giver_received, receiver_received")
    .eq("match_id", matchId);

  const allReceived = legs?.every(
    (leg) => leg.giver_received && leg.receiver_received,
  );

  if (legs && allReceived) {
    // El match y los items pueden pertenecer a más de un dueño distinto del
    // que dispara esta acción: usamos el cliente admin para poder cerrar
    // el trueque para TODAS las partes, no solo la propia.
    const admin = createAdminClient();
    await admin.from("matches").update({ status: "completed" }).eq("id", matchId);
    await admin
      .from("items")
      .update({ status: "completed" })
      .in(
        "id",
        legs.map((leg) => leg.item_id),
      );

    const participantIds = [...new Set(legs.map((leg) => leg.giver_id))];
    await notifyMatchCompleted(matchId, participantIds);
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
}

export async function cancelMatch(formData: FormData) {
  const matchId = String(formData.get("match_id") ?? "");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/matches");
  }

  // RLS en match_legs solo deja ver legs de matches donde el usuario
  // participa: si esto viene vacío, no es parte del trueque y no hacemos nada.
  const { data: legs } = await supabase
    .from("match_legs")
    .select("item_id")
    .eq("match_id", matchId);

  if (legs && legs.length > 0) {
    const admin = createAdminClient();
    await admin.from("matches").update({ status: "cancelled" }).eq("id", matchId);
    await admin
      .from("items")
      .update({ status: "available" })
      .in(
        "id",
        legs.map((leg) => leg.item_id),
      );
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  redirect("/matches");
}
