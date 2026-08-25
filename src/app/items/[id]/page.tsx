import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getItemDetail } from "@/lib/queries/item-detail";
import { EditItemForm } from "@/components/edit-item-form";
import { BoostItemCard } from "@/components/boost-item-card";

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; boost?: string }>;
}) {
  const { id } = await params;
  const { error, boost } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect(`/login?next=/items/${id}`);
  }

  const item = await getItemDetail(id);
  if (!item) {
    notFound();
  }

  if (item.ownerId !== user.id) {
    // Por ahora la vista de detalle solo está resuelta para el dueño de la
    // publicación (ver "Mis publicaciones" en /perfil).
    redirect("/perfil");
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <Link
        href="/perfil"
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Mi perfil
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-stone-900">Editar publicación</h1>
      <p className="mt-1 text-sm text-stone-600">
        Actualizá los datos de tu objeto o eliminalo si ya no querés ofrecerlo.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {boost === "cancelado" && (
        <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
          Cancelaste el pago para destacar la publicación.
        </p>
      )}

      <BoostItemCard
        itemId={item.id}
        status={item.status}
        featuredUntil={item.featuredUntil}
      />

      <EditItemForm item={item} />
    </div>
  );
}
