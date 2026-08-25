"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateItem, deleteItem } from "@/lib/actions/items";
import { CATEGORIES } from "@/lib/categories";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/types";
import { ImageUploader } from "@/components/image-uploader";
import type { ItemDetail } from "@/lib/queries/item-detail";

export function EditItemForm({ item }: { item: ItemDetail }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateItem, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Publicación actualizada");
    } else {
      toast.error(state.error ?? "No se pudo guardar la publicación");
    }
  }, [state]);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) {
      return;
    }
    const formData = new FormData();
    formData.set("item_id", item.id);
    await deleteItem(formData);
    router.push("/perfil?deleted=1");
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="item_id" value={item.id} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Fotos</label>
        <ImageUploader existingImages={item.images} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Título
        </label>
        <input
          type="text"
          name="title"
          required
          defaultValue={item.title}
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
          defaultValue={item.description}
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Categoría
          </label>
          <select
            name="category"
            required
            defaultValue={item.category}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          >
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
            defaultValue={item.condition}
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
                defaultChecked={item.lookingForCategories.includes(cat)}
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
          defaultValue={item.lookingForDescription}
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
        />
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>

        {item.status === "available" && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Eliminar
          </button>
        )}
      </div>

      {item.status !== "available" && (
        <p className="text-xs text-stone-400">
          Esta publicación está {STATUS_LABEL[item.status].toLowerCase()} y no se puede
          eliminar desde acá.
        </p>
      )}
    </form>
  );
}
