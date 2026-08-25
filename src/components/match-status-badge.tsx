const MATCH_STATUS_LABEL: Record<string, string> = {
  proposed: "Propuesto",
  accepted: "Aceptado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const MATCH_STATUS_CLASS: Record<string, string> = {
  proposed: "bg-stone-100 text-stone-600",
  accepted: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

export function MatchStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        MATCH_STATUS_CLASS[status] ?? "bg-stone-100 text-stone-600"
      }`}
    >
      {MATCH_STATUS_LABEL[status] ?? status}
    </span>
  );
}
