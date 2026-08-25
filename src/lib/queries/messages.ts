import { createClient } from "@/lib/supabase/server";

export interface MessageView {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export async function getMatchMessages(matchId: string): Promise<MessageView[]> {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  return (messages ?? []).map((message) => ({
    id: message.id,
    senderId: message.sender_id,
    body: message.body,
    createdAt: message.created_at,
  }));
}
