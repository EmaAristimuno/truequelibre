export type ItemCondition = "nuevo" | "como_nuevo" | "usado" | "para_repuestos";

export const CONDITION_LABEL: Record<ItemCondition, string> = {
  nuevo: "Nuevo",
  como_nuevo: "Como nuevo",
  usado: "Usado",
  para_repuestos: "Para repuestos",
};

export type ItemStatus = "available" | "matched" | "completed" | "cancelled";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  available: "Disponible",
  matched: "En trueque",
  completed: "Completado",
  cancelled: "Cancelado",
};

export interface Item {
  id: string;
  title: string;
  category: string;
  emoji: string;
  imageUrl?: string;
  condition: ItemCondition;
  lookingFor: string[];
  ownerName: string;
  ownerLocation: string;
  ownerRating: number;
}
