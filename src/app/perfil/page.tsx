import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyItems } from "@/lib/queries/my-items";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/types";
import { LocationPickerLoader } from "@/components/location-picker-loader";

const STATUS_BADGE_CLASS: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  matched: "bg-amber-50 text-amber-700",
  completed: "bg-stone-200 text-stone-600",
  cancelled: "bg-red-50 text-red-600",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, location, latitude, longitude, rating, rating_count, created_at")
    .eq("id", user.id)
    .single();

  const items = await getMyItems(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white">
          <User className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            {profile?.username ?? "Mi perfil"}
          </h1>
          <p className="text-sm text-stone-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm text-stone-600">
        <span>
          <strong className="text-stone-900">{items.length}</strong> objetos
          publicados
        </span>
        <span>
          <strong className="text-stone-900">
            {profile?.rating?.toFixed(1) ?? "0.0"}
          </strong>{" "}
          ★ ({profile?.rating_count ?? 0} calificaciones)
        </span>
        <Link href="/matches" className="font-medium text-emerald-700">
          Ver mis trueques →
        </Link>
      </div>

      <div className="mt-6">
        <LocationPickerLoader
          initialLocation={profile?.location ?? null}
          initialLat={profile?.latitude ?? null}
          initialLng={profile?.longitude ?? null}
        />
      </div>

      <h2 className="mt-8 text-base font-semibold text-stone-900">
        Mis publicaciones
      </h2>

      {items.length === 0 && (
        <p className="mt-3 text-sm text-stone-500">
          Todavía no publicaste ningún objeto.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"
          >
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-2xl">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
              ) : (
                item.emoji
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900">
                {item.title}
              </p>
              <p className="text-xs text-stone-500">
                {item.category} · {CONDITION_LABEL[item.condition]}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                STATUS_BADGE_CLASS[item.status] ?? "bg-stone-100 text-stone-600"
              }`}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
