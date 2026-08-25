import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import {
  matchProposedEmail,
  matchAcceptedEmail,
  matchCompletedEmail,
} from "@/lib/email/templates";

interface Contact {
  id: string;
  email: string;
  username: string;
}

async function getParticipantContacts(participantIds: string[]): Promise<Contact[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || participantIds.length === 0) return [];

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username")
    .in("id", participantIds);
  const usernameById = new Map(profiles?.map((p) => [p.id, p.username]));

  const contacts = await Promise.all(
    participantIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      const email = data.user?.email;
      if (!email) return null;
      return { id, email, username: usernameById.get(id) ?? "Usuario" };
    }),
  );

  return contacts.filter((contact): contact is Contact => contact !== null);
}

export async function notifyMatchProposed(
  matchId: string,
  participantIds: string[],
  isChain: boolean,
): Promise<void> {
  const contacts = await getParticipantContacts(participantIds);
  await Promise.all(
    contacts.map((contact) => {
      const { subject, html } = matchProposedEmail({
        recipientName: contact.username,
        matchId,
        isChain,
      });
      return sendEmail({ to: contact.email, subject, html });
    }),
  );
}

export async function notifyMatchAccepted(
  matchId: string,
  participantIds: string[],
): Promise<void> {
  const contacts = await getParticipantContacts(participantIds);
  await Promise.all(
    contacts.map((contact) => {
      const { subject, html } = matchAcceptedEmail({
        recipientName: contact.username,
        matchId,
      });
      return sendEmail({ to: contact.email, subject, html });
    }),
  );
}

export async function notifyMatchCompleted(
  matchId: string,
  participantIds: string[],
): Promise<void> {
  const contacts = await getParticipantContacts(participantIds);
  await Promise.all(
    contacts.map((contact) => {
      const { subject, html } = matchCompletedEmail({
        recipientName: contact.username,
        matchId,
      });
      return sendEmail({ to: contact.email, subject, html });
    }),
  );
}
