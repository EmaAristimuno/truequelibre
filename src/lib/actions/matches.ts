"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyMatchAccepted, notifyMatchCompleted, notifyMatchProposed } from "@/lib/email/notify";

export async function proposeTrade(formData: FormData) {
  const targetItemId = String(formData.get("target_item_id") ?? "");
  const offeredItemId = String(formData.get("offered_item_id") ?? "");

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect(`/login?next=/items/${targetItemId}`);
  }

  if (!offeredItemId) {
    redirect(
      `/items/${targetItemId}?error=${encodeURIComponent("Elegí qué objeto ofrecés a cambio")}`,
    );
  }

  const { data: targetItem } = await supabase
    .from("items")
    .select("id, owner_id, status")
    .eq("id", targetItemId)
    .single();

  if (!targetItem || targetItem.status !== "available" || targetItem.owner_id === user.id) {
    redirect(
      `/items/${targetItemId}?error=${encodeURIComponent("Esta publicación ya no está disponible")}`,
    );
  }

  const { data: offeredItem } = await supabase
    .from("items")
    .select("id, owner_id, status")
    .eq("id", offeredItemId)
    .single();

  if (!offeredItem || offeredItem.owner_id !== user.id || offeredItem.status !== "available") {
    redirect(
      `/items/${targetItemId}?error=${encodeURIComponent(
        "El objeto que elegiste para ofrecer ya no está disponible",
      )}`,
    );
  }

  // Igual que el algoritmo automático (ver run-matching.ts): crear un match
  // entre dos personas requiere escribir legs de alguien que no es quien
  // dispara la acción, así que usamos el cliente admin. A diferencia del
  // algoritmo, acá NO reservamos los items: una propuesta manual no le saca
  // el objeto a nadie hasta que el dueño elige una entre las que le lleguen
  // (ver selectProposal). `initiated_by` marca que este match es una
  // propuesta manual pendiente de selección, y quién la mandó.
  const admin = createAdminClient();

  const { data: match, error: matchError } = await admin
    .from("matches")
    .insert({ status: "proposed", initiated_by: user.id })
    .select("id")
    .single();

  if (matchError || !match) {
    redirect(
      `/items/${targetItemId}?error=${encodeURIComponent("No se pudo crear la propuesta")}`,
    );
  }

  const { error: legsError } = await admin.from("match_legs").insert([
    {
      match_id: match.id,
      giver_id: user.id,
      receiver_id: targetItem.owner_id,
      item_id: offeredItem.id,
    },
    {
      match_id: match.id,
      giver_id: targetItem.owner_id,
      receiver_id: user.id,
      item_id: targetItem.id,
    },
  ]);

  if (legsError) {
    await admin.from("matches").delete().eq("id", match.id);
    redirect(
      `/items/${targetItemId}?error=${encodeURIComponent("No se pudo crear la propuesta")}`,
    );
  }

  // Solo avisamos al dueño del objeto pedido: es quien tiene que revisar y
  // decidir. Quien propone ya sabe que acaba de proponer.
  await notifyMatchProposed(match.id, [targetItem.owner_id], false);

  revalidatePath(`/items/${targetItemId}`);
  redirect(`/items/${targetItemId}?proposed=1`);
}

export async function selectProposal(formData: FormData) {
  const matchId = String(formData.get("match_id") ?? "");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const { data: match } = await supabase
    .from("matches")
    .select("id, status, initiated_by")
    .eq("id", matchId)
    .single();

  const { data: legs } = await supabase
    .from("match_legs")
    .select("item_id, giver_id, receiver_id")
    .eq("match_id", matchId);

  // El dueño que decide es quien RECIBE el objeto ofrecido por quien
  // propuso (el otro leg es "el dueño le da su objeto a quien propuso").
  const targetLeg = legs?.find(
    (leg) => leg.giver_id === match?.initiated_by && leg.receiver_id === user.id,
  );

  if (
    !match ||
    match.status !== "proposed" ||
    !match.initiated_by ||
    match.initiated_by === user.id ||
    !legs ||
    !targetLeg
  ) {
    redirect("/perfil");
  }

  const itemIds = legs.map((leg) => leg.item_id);
  const targetItemId = legs.find((leg) => leg.giver_id === user.id)?.item_id ?? "";

  const admin = createAdminClient();

  const { data: freshItems } = await admin
    .from("items")
    .select("id, status")
    .in("id", itemIds);

  if (!freshItems || freshItems.some((item) => item.status !== "available")) {
    redirect(
      `/items/${targetItemId}?error=${encodeURIComponent(
        "Uno de los objetos de esta propuesta ya no está disponible",
      )}`,
    );
  }

  await admin.from("items").update({ status: "matched" }).in("id", itemIds);

  // Cualquier otra propuesta pendiente para estos mismos objetos queda sin
  // efecto: ya se comprometieron con esta.
  const { data: competingLegs } = await admin
    .from("match_legs")
    .select("match_id")
    .in("item_id", itemIds)
    .neq("match_id", matchId);

  const competingMatchIds = [...new Set(competingLegs?.map((leg) => leg.match_id) ?? [])];
  if (competingMatchIds.length > 0) {
    await admin
      .from("matches")
      .update({ status: "cancelled" })
      .in("id", competingMatchIds)
      .eq("status", "proposed");
  }

  revalidatePath("/matches");
  revalidatePath(`/items/${targetItemId}`);
  redirect(`/matches/${matchId}?selected=1`);
}

export async function rejectProposal(formData: FormData) {
  const matchId = String(formData.get("match_id") ?? "");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const { data: match } = await supabase
    .from("matches")
    .select("id, status, initiated_by")
    .eq("id", matchId)
    .single();

  const { data: legs } = await supabase
    .from("match_legs")
    .select("item_id, giver_id, receiver_id")
    .eq("match_id", matchId);

  const targetLeg = legs?.find(
    (leg) => leg.giver_id === match?.initiated_by && leg.receiver_id === user.id,
  );
  const targetItemId = legs?.find((leg) => leg.giver_id === user.id)?.item_id ?? "";

  if (!match || match.status !== "proposed" || !match.initiated_by || !targetLeg) {
    redirect("/perfil");
  }

  const admin = createAdminClient();
  await admin.from("matches").update({ status: "cancelled" }).eq("id", matchId);

  revalidatePath(`/items/${targetItemId}`);
  redirect(`/items/${targetItemId}?rejected=1`);
}

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
