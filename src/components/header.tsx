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
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-paper">
            <Recycle className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Trueque<span className="text-clay">Libre</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/60 sm:flex">
          <Link href="/explorar" className="hover:text-ink">
            Explorar
          </Link>
          <Link href="/#como-funciona" className="hover:text-ink">
            Cómo funciona
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu username={username ?? "Mi perfil"} isAdmin={isAdmin} />
          ) : (
            <Link
              href="/login"
              className="hidden text-sm font-medium text-ink/60 hover:text-ink sm:inline"
            >
              Iniciar sesión
            </Link>
          )}

          <Link
            href="/publicar"
            className="flex items-center gap-1.5 rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-clay/30 transition-colors hover:bg-clay-dark"
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
