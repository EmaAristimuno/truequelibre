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
    <section
      id="como-funciona"
      className="border-t border-stone-200 bg-white py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-stone-900">
          Cómo funciona
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <step.icon className="h-7 w-7" />
              </div>
              <span className="mt-3 block text-xs font-semibold text-amber-600">
                Paso {index + 1}
              </span>
              <h3 className="mt-1 text-base font-semibold text-stone-900">
                {step.title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-stone-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
