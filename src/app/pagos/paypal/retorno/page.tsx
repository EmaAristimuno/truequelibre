import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { captureFeatureOrder } from "@/lib/actions/payments";

export default async function PayPalRetornoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; item_id?: string }>;
}) {
  const { token, item_id: itemId } = await searchParams;

  const result =
    token && itemId
      ? await captureFeatureOrder(itemId, token)
      : { ok: false as const, error: "Faltan datos del pago" };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      {result.ok ? (
        <>
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-xl font-bold text-stone-900">
            ¡Publicación destacada!
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Tu objeto va a aparecer primero en el feed durante los próximos días.
          </p>
        </>
      ) : (
        <>
          <XCircle className="h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-stone-900">
            No se pudo confirmar el pago
          </h1>
          <p className="mt-1 text-sm text-stone-600">{result.error}</p>
        </>
      )}

      {itemId && (
        <Link
          href={`/items/${itemId}`}
          className="mt-6 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
        >
          Ver publicación
        </Link>
      )}
    </div>
  );
}
