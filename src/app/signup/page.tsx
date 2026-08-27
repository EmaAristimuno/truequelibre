import Link from "next/link";
import { Recycle } from "lucide-react";
import { signup } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
            Creá tu cuenta en TruequeLibre
          </h1>
        </div>

        {params.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        )}

        <form action={signup} className="flex flex-col gap-3">
          <input
            type="text"
            name="username"
            required
            minLength={3}
            placeholder="Nombre de usuario"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          />
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
            minLength={6}
            placeholder="Contraseña (mín. 6 caracteres)"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
          />
          <SubmitButton
            pendingText="Creando cuenta..."
            className="mt-1 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Crear cuenta
          </SubmitButton>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-emerald-700">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
