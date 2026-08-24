import Link from "next/link";
import { Recycle } from "lucide-react";
import { login } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-stone-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white">
            <Recycle className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-stone-900">
            Iniciar sesión en TruequeLibre
          </h1>
        </div>

        {params.message && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {params.message}
          </p>
        )}
        {params.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        )}

        <form action={login} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          />
          <input
            type="password"
            name="password"
            required
            placeholder="Contraseña"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          />
          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Entrar
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500">
          ¿No tenés cuenta?{" "}
          <Link href="/signup" className="font-medium text-emerald-700">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
