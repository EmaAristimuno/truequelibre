import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin, getFinanceSummary } from "@/lib/queries/admin";

const STATUS_LABEL: Record<string, string> = {
  completed: "Completado",
  created: "Pendiente",
  failed: "Fallido",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  created: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
};

export default async function AdminFinanzasPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?next=/admin/finanzas");
  }

  if (!(await isCurrentUserAdmin())) {
    notFound();
  }

  const summary = await getFinanceSummary();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Finanzas</h1>
      <p className="mt-1 text-sm text-stone-600">
        Pagos por destacar publicaciones (PayPal).
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <DollarSign className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xl font-bold text-stone-900">
            US${summary.totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-stone-500">Ingresos totales</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xl font-bold text-stone-900">{summary.completedCount}</p>
          <p className="text-xs text-stone-500">Pagos completados</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xl font-bold text-stone-900">{summary.pendingCount}</p>
          <p className="text-xs text-stone-500">Pendientes</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xl font-bold text-stone-900">{summary.failedCount}</p>
          <p className="text-xs text-stone-500">Fallidos</p>
        </div>
      </div>

      <h2 className="mt-8 text-base font-semibold text-stone-900">Todos los pagos</h2>

      {summary.payments.length === 0 && (
        <p className="mt-3 text-sm text-stone-500">Todavía no hay pagos registrados.</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3 font-medium">Publicación</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {summary.payments.map((payment) => (
              <tr key={payment.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/items/${payment.itemId}`}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    {payment.itemTitle}
                  </Link>
                </td>
                <td className="px-4 py-3 text-stone-700">{payment.username}</td>
                <td className="px-4 py-3 text-stone-700">
                  {payment.currency} {payment.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_BADGE_CLASS[payment.status] ?? "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {STATUS_LABEL[payment.status] ?? payment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {new Date(payment.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
