"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitRating } from "@/lib/actions/ratings";
import { SubmitButton } from "@/components/submit-button";

export function RatingForm({
  matchId,
  rateeId,
  rateeName,
}: {
  matchId: string;
  rateeId: string;
  rateeName: string;
}) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);

  return (
    <form
      action={submitRating}
      className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4"
    >
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="ratee_id" value={rateeId} />
      <input type="hidden" name="score" value={score} />

      <p className="text-sm font-medium text-stone-800">
        Calificá a {rateeName}
      </p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScore(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              className={`h-6 w-6 ${
                value <= (hovered || score)
                  ? "fill-amber-400 text-amber-400"
                  : "text-stone-300"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={2}
        placeholder="Comentario opcional..."
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30"
      />

      <SubmitButton
        disabled={score === 0}
        pendingText="Enviando..."
        className="self-start rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Enviar calificación
      </SubmitButton>
    </form>
  );
}
