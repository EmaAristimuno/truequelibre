import { Upload, Sparkles, Handshake } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Publicá tu objeto",
    description:
      "Subí fotos, contá qué es y qué te gustaría recibir a cambio.",
  },
  {
    icon: Sparkles,
    title: "El algoritmo busca el match",
    description:
      "No solo cruza dos personas: si A quiere lo de B, B quiere lo de C y C quiere lo de A, detectamos esa cadena y armamos el trueque entre los tres.",
  },
  {
    icon: Handshake,
    title: "Coordinás la entrega",
    description:
      "Chat interno, punto de encuentro y confirmación doble antes de cerrar el trato.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-ink/10 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">
            El circuito
          </span>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
            Cómo funciona
          </h2>
        </div>

        <div className="relative mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-linear-to-r from-transparent via-moss to-transparent sm:block"
          />
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative text-center">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-pine bg-paper text-pine-dark">
                <step.icon className="h-6 w-6" />
              </div>
              <span className="mt-4 block font-data text-xs font-bold tracking-wide text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink/60">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
