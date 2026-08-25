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
        className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-stone-700">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{username}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            <User className="h-4 w-4 text-stone-400" />
            Mi perfil
          </Link>
          <Link
            href="/matches"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            <Repeat className="h-4 w-4 text-stone-400" />
            Mis trueques
          </Link>
          {isAdmin && (
            <Link
              href="/admin/finanzas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <ShieldCheck className="h-4 w-4 text-stone-400" />
              Admin
            </Link>
          )}
          <div className="my-1 border-t border-stone-100" />
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
            >
              <LogOut className="h-4 w-4 text-stone-400" />
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
