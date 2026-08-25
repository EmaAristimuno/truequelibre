import "server-only";
import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "TruequeLibre <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY no está configurada; se omite el envío de email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  } catch (error) {
    // Un email que falla nunca debe romper el flujo principal (matching,
    // aceptar trueque, etc.) — solo lo registramos.
    console.error("Error enviando email:", error);
  }
}
