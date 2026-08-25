import "server-only";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function baseLayout(title: string, bodyHtml: string, ctaHref: string, ctaLabel: string): string {
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #292524;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
    <span style="display: inline-flex; height: 32px; width: 32px; align-items: center; justify-content: center; border-radius: 999px; background: #047857; color: white; font-weight: bold; font-size: 16px;">T</span>
    <span style="font-size: 18px; font-weight: bold;">Trueque<span style="color: #047857;">Libre</span></span>
  </div>
  <h1 style="font-size: 18px; margin: 0 0 12px;">${title}</h1>
  <div style="font-size: 14px; line-height: 1.6; color: #44403c;">${bodyHtml}</div>
  <a href="${ctaHref}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #f59e0b; color: white; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 12px;">${ctaLabel}</a>
  <p style="margin-top: 32px; font-size: 12px; color: #a8a29e;">TruequeLibre — intercambiá sin dinero, combatí el consumismo.</p>
</div>`;
}

export function matchProposedEmail(params: {
  recipientName: string;
  matchId: string;
  isChain: boolean;
}) {
  const { recipientName, matchId, isChain } = params;
  return {
    subject: isChain
      ? "¡Encontramos una cadena de trueque para vos!"
      : "¡Encontramos un trueque para vos!",
    html: baseLayout(
      isChain ? "Nueva cadena de trueque propuesta" : "Nuevo trueque propuesto",
      `<p>Hola ${recipientName},</p>
       <p>Nuestro algoritmo encontró ${isChain ? "una cadena de trueque entre varias personas" : "un trueque"} que incluye uno de tus objetos. Entrá a revisarlo y aceptá tu parte para avanzar.</p>`,
      `${SITE_URL}/matches/${matchId}`,
      "Ver el trueque",
    ),
  };
}

export function matchAcceptedEmail(params: { recipientName: string; matchId: string }) {
  const { recipientName, matchId } = params;
  return {
    subject: "Todas las partes aceptaron el trueque",
    html: baseLayout(
      "Trueque aceptado por todos",
      `<p>Hola ${recipientName},</p>
       <p>Todas las partes confirmaron el trueque. Coordiná la entrega por el chat y, cuando recibas tu objeto, confirmalo en la app para cerrarlo.</p>`,
      `${SITE_URL}/matches/${matchId}`,
      "Ir al chat",
    ),
  };
}

export function matchCompletedEmail(params: { recipientName: string; matchId: string }) {
  const { recipientName, matchId } = params;
  return {
    subject: "¡Trueque completado!",
    html: baseLayout(
      "Trueque completado",
      `<p>Hola ${recipientName},</p>
       <p>El trueque se completó. No te olvides de calificar a las otras partes para ayudar a construir confianza en la comunidad.</p>`,
      `${SITE_URL}/matches/${matchId}`,
      "Calificar ahora",
    ),
  };
}
