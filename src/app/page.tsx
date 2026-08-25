import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExploreItemCard } from "@/components/explore-item-card";
import { HowItWorks } from "@/components/how-it-works";
import { getAvailableItems } from "@/lib/queries/items";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const params = await searchParams;
  const items = await getAvailableItems();
  const preview = items.slice(0, 8);

  return (
    <>
      <main className="flex-1">
        <section className="relative overflow-hidden bg-pine-dark">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, var(--color-gold) 0, transparent 45%), radial-gradient(circle at 85% 75%, var(--color-clay) 0, transparent 40%)",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Sin dinero de por medio
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-paper sm:text-6xl">
              Lo tuyo que no usás,{" "}
              <span className="italic text-gold">es lo que otro busca.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-paper/70">
              Intercambiá objetos directamente con otras personas. Nuestro algoritmo arma la
              cadena de trueque perfecta, incluso entre tres o más personas.
            </p>

            {params.published && (
              <p className="mx-auto mt-6 max-w-md rounded-full bg-white/10 px-4 py-2 text-sm text-paper">
                ¡Tu objeto fue publicado! Ya está visible en el feed.
              </p>
            )}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/explorar"
                className="flex items-center gap-2 rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-clay-dark"
              >
                Ver todos los trueques
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/publicar"
                className="rounded-full border border-paper/25 px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-white/10"
              >
                Publicar mi objeto
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">
                Recién publicados
              </span>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
                Lo último para intercambiar
              </h2>
            </div>
            <Link
              href="/explorar"
              className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-pine-dark hover:underline sm:flex"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {preview.length === 0 ? (
            <p className="mt-10 text-center text-ink/50">
              Todavía no hay objetos disponibles. ¡Sé el primero en publicar uno!
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {preview.map((item) => (
                <ExploreItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <Link
            href="/explorar"
            className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-pine-dark hover:underline sm:hidden"
          >
            Ver todos los trueques
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <HowItWorks />
      </main>
      <footer className="border-t border-ink/10 bg-paper-dim py-6 text-center text-sm text-ink/50">
        TruequeLibre — intercambiá sin dinero, combatí el consumismo.
      </footer>
    </>
  );
}
