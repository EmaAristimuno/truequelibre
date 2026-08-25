import Link from "next/link";
import { Recycle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";

export async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let username: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, is_admin")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
    isAdmin = profile?.is_admin === true;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white">
            <Recycle className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-stone-900">
            Trueque<span className="text-emerald-700">Libre</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 sm:flex">
          <a href="#feed" className="hover:text-stone-900">
            Explorar
          </a>
          <a href="#como-funciona" className="hover:text-stone-900">
            Cómo funciona
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu username={username ?? "Mi perfil"} isAdmin={isAdmin} />
          ) : (
            <Link
              href="/login"
              className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 sm:inline"
            >
              Iniciar sesión
            </Link>
          )}

          <Link
            href="/publicar"
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-colors hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Publicar mi Objeto</span>
            <span className="sm:hidden">Publicar</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
