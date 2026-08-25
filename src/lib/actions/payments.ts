"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrder, captureOrder } from "@/lib/paypal";
import { BOOST_PRICE_USD, BOOST_DURATION_DAYS } from "@/lib/boost";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function createFeatureOrder(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect(`/login?next=/items/${itemId}`);
  }

  const { data: item } = await supabase
    .from("items")
    .select("id, owner_id, title, status")
    .eq("id", itemId)
    .single();

  if (!item || item.owner_id !== user.id) {
    redirect("/perfil");
  }

  if (item.status !== "available") {
    redirect(
      `/items/${itemId}?error=${encodeURIComponent(
        "Solo se pueden destacar publicaciones disponibles",
      )}`,
    );
  }

  let order: Awaited<ReturnType<typeof createOrder>>;

  try {
    order = await createOrder({
      amount: BOOST_PRICE_USD,
      currency: "USD",
      description: `Destacar publicación: ${item.title}`,
      referenceId: item.id,
      returnUrl: `${SITE_URL}/pagos/paypal/retorno?item_id=${item.id}`,
      cancelUrl: `${SITE_URL}/items/${item.id}?boost=cancelado`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo iniciar el pago";
    redirect(`/items/${itemId}?error=${encodeURIComponent(message)}`);
  }

  await supabase.from("payments").insert({
    item_id: item.id,
    user_id: user.id,
    provider: "paypal",
    provider_order_id: order.id,
    purpose: "featured_listing",
    amount: Number(BOOST_PRICE_USD),
    currency: "USD",
    status: "created",
  });

  redirect(order.approveUrl);
}

export type CapturePaymentResult =
  | { ok: true }
  | { ok: false; error: string };

export async function captureFeatureOrder(
  itemId: string,
  orderId: string,
): Promise<CapturePaymentResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { ok: false, error: "Necesitás iniciar sesión" };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, item_id, user_id, status")
    .eq("provider_order_id", orderId)
    .single();

  if (!payment || payment.user_id !== user.id || payment.item_id !== itemId) {
    return { ok: false, error: "No se encontró el pago" };
  }

  if (payment.status === "completed") {
    return { ok: true };
  }

  let captureStatus: string;
  try {
    const result = await captureOrder(orderId);
    captureStatus = result.status;
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo confirmar el pago";
    await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return { ok: false, error: message };
  }

  if (captureStatus !== "COMPLETED") {
    await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return { ok: false, error: "PayPal no completó el pago" };
  }

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + BOOST_DURATION_DAYS);

  await supabase.from("payments").update({ status: "completed" }).eq("id", payment.id);
  await supabase
    .from("items")
    .update({ featured_until: featuredUntil.toISOString() })
    .eq("id", itemId);

  return { ok: true };
}
