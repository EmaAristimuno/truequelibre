"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export function ChatPanel({
  matchId,
  currentUserId,
  participantNames,
  initialMessages,
}: {
  matchId: string;
  currentUserId: string;
  participantNames: Record<string, string>;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`match-${matchId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };
          setMessages((prev) =>
            prev.some((message) => message.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    senderId: row.sender_id,
                    body: row.body,
                    createdAt: row.created_at,
                  },
                ],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setText("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: currentUserId, body })
      .select("id, sender_id, body, created_at")
      .single();

    if (!error && data) {
      setMessages((prev) =>
        prev.some((message) => message.id === data.id)
          ? prev
          : [
              ...prev,
              {
                id: data.id,
                senderId: data.sender_id,
                body: data.body,
                createdAt: data.created_at,
              },
            ],
      );
    }

    setSending(false);
  }

  return (
    <div className="mt-6 flex flex-col rounded-2xl border border-stone-200 bg-white">
      <div className="border-b border-stone-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-900">
          Chat del trueque
        </h2>
      </div>

      <div className="flex h-72 flex-col gap-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-stone-400">
            Sin mensajes todavía. Coordiná acá el punto de encuentro.
          </p>
        )}
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              <span className="mb-0.5 text-[11px] text-stone-400">
                {isMine ? "Vos" : (participantNames[message.senderId] ?? "Usuario")}
              </span>
              <span
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  isMine
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-100 text-stone-800"
                }`}
              >
                {message.body}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-stone-100 p-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribí un mensaje..."
          className="flex-1 rounded-full border border-stone-200 px-4 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition-colors hover:bg-emerald-800 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
