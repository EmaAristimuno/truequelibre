import { createClient } from "@/lib/supabase/server";

export interface MyPayment {
  id: string;
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export async function getMyPayments(userId: string): Promise<MyPayment[]> {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, item_id, amount, currency, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!payments || payments.length === 0) return [];

  const itemIds = [...new Set(payments.map((p) => p.item_id))];
  const { data: items } = await supabase.from("items").select("id, title").in("id", itemIds);
  const titleById = new Map(items?.map((item) => [item.id, item.title]));

  return payments.map((payment) => ({
    id: payment.id,
    itemId: payment.item_id,
    itemTitle: titleById.get(payment.item_id) ?? "(publicación eliminada)",
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.created_at,
  }));
}
