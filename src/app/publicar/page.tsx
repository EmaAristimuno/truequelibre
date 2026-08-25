import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createItem } from "@/lib/actions/items";
import { CATEGORIES } from "@/lib/categories";
import { CONDITION_LABEL } from "@/lib/types";
import { ImageUploader } from "@/components/image-uploader";

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?next=/publicar");
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Publicar mi objeto</h1>
      <p className="mt-1 text-sm text-stone-600">
        Contá qué ofrecés y qué te gustaría recibir a cambio. Nuestro
        algoritmo va a buscar el mejor trueque, incluso en cadena con otras
        personas.
      </p>

      {params.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <form action={createItem} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Título
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ej: Bicicleta rodado 26, poco uso"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Descripción
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Estado, detalles, motivo del trueque..."
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Fotos (hasta 4, opcional)
          </label>
          <ImageUploader />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Categoría
            </label>
            <select
              name="category"
              required
              defaultValue=""
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="" disabled>
                Elegí una
              </option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Condición
            </label>
            <select
              name="condition"
              defaultValue="usado"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
            >
              {Object.entries(CONDITION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            ¿Qué te gustaría recibir a cambio? (elegí una o más)
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800"
              >
                <input
                  type="checkbox"
                  name="looking_for_categories"
                  value={cat}
                  className="accent-emerald-700"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Detalle de lo que buscás (opcional)
          </label>
          <textarea
            name="looking_for_description"
            rows={2}
            placeholder="Ej: prefiero algo de tecnología en buen estado"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Publicar objeto
        </button>
      </form>
    </div>
  );
}
