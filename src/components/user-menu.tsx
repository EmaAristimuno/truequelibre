"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, ChevronDown, Repeat, ShieldCheck, LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function UserMenu({
  username,
  isAdmin,
}: {
  username: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine/15 text-pine-dark">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{username}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-ink/80 hover:bg-paper"
          >
            <User className="h-4 w-4 text-ink/40" />
            Mi perfil
          </Link>
          <Link
            href="/matches"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-ink/80 hover:bg-paper"
          >
            <Repeat className="h-4 w-4 text-ink/40" />
            Mis trueques
          </Link>
          {isAdmin && (
            <Link
              href="/admin/finanzas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-ink/80 hover:bg-paper"
            >
              <ShieldCheck className="h-4 w-4 text-ink/40" />
              Admin
            </Link>
          )}
          <div className="my-1 border-t border-ink/10" />
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink/80 hover:bg-paper"
            >
              <LogOut className="h-4 w-4 text-ink/40" />
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
