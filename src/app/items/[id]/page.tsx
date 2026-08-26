import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getItemDetail } from "@/lib/queries/item-detail";
import { getMyItems } from "@/lib/queries/my-items";
import { getPendingProposalsForItem } from "@/lib/queries/proposals";
import { getActiveMatchIdForItem } from "@/lib/queries/matches";
import { EditItemForm } from "@/components/edit-item-form";
import { BoostItemCard } from "@/components/boost-item-card";
import { PublicItemView } from "@/components/public-item-view";
import { PendingProposalsCard } from "@/components/pending-proposals-card";

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; boost?: string; proposed?: string; rejected?: string }>;
}) {
  const { id } = await params;
  const { error, boost, proposed, rejected } = await searchParams;
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

  const isOwner = item.ownerId === user.id;

  if (!isOwner) {
    const myItems = await getMyItems(user.id);
    const myAvailableItems = myItems.filter((mine) => mine.status === "available");

    return (
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al feed
        </Link>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {proposed && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            ¡Propuesta enviada! Le avisamos al dueño para que la revise.
          </p>
        )}

        <div className="mt-4">
          <PublicItemView item={item} myAvailableItems={myAvailableItems} />
        </div>
      </div>
    );
  }

  const activeMatchId = await getActiveMatchIdForItem(item.id);

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
      {rejected && (
        <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
          Rechazaste esa propuesta.
        </p>
      )}

      {activeMatchId && (
        <Link
          href={`/matches/${activeMatchId}`}
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:border-emerald-300"
        >
          <span className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            ¡Encontramos un trueque para este objeto!
          </span>
          <span>Ver trueque →</span>
        </Link>
      )}

      <PendingProposalsCard proposals={await getPendingProposalsForItem(item.id)} />

      <BoostItemCard
        itemId={item.id}
        status={item.status}
        featuredUntil={item.featuredUntil}
      />

      <EditItemForm item={item} />
    </div>
  );
}
