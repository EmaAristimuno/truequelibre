import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  return profile?.is_admin === true;
}

export interface FinancePayment {
  id: string;
  itemId: string;
  itemTitle: string;
  username: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface FinanceSummary {
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  payments: FinancePayment[];
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  // Requiere haber verificado isCurrentUserAdmin() antes de llamar a esto:
  // acá se usa el cliente admin para ver pagos de todos los usuarios,
  // saltando la RLS que normalmente limita cada uno a ver solo los suyos.
  const admin = createAdminClient();

  const { data: payments } = await admin
    .from("payments")
    .select("id, item_id, user_id, amount, currency, status, created_at")
    .order("created_at", { ascending: false });

  const rows = payments ?? [];

  const itemIds = [...new Set(rows.map((p) => p.item_id))];
  const userIds = [...new Set(rows.map((p) => p.user_id))];

  const [{ data: items }, { data: profiles }] = await Promise.all([
    itemIds.length > 0
      ? admin.from("items").select("id, title").in("id", itemIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    userIds.length > 0
      ? admin.from("profiles").select("id, username").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; username: string }[] }),
  ]);

  const itemTitleById = new Map(items?.map((item) => [item.id, item.title]));
  const usernameById = new Map(profiles?.map((profile) => [profile.id, profile.username]));

  const financePayments: FinancePayment[] = rows.map((payment) => ({
    id: payment.id,
    itemId: payment.item_id,
    itemTitle: itemTitleById.get(payment.item_id) ?? "(publicación eliminada)",
    username: usernameById.get(payment.user_id) ?? "Usuario",
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.created_at,
  }));

  return {
    totalRevenue: financePayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0),
    completedCount: financePayments.filter((p) => p.status === "completed").length,
    pendingCount: financePayments.filter((p) => p.status === "created").length,
    failedCount: financePayments.filter((p) => p.status === "failed").length,
    payments: financePayments,
  };
}
