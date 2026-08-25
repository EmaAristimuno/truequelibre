import { haversineKm } from "@/lib/distance";

export interface MatchableItem {
  id: string;
  ownerId: string;
  category: string;
  lookingFor: string[];
  lat?: number;
  lng?: number;
  /** Radio máximo (km) que el dueño está dispuesto a viajar/aceptar. undefined = sin límite. */
  maxDistanceKm?: number;
}

export interface CycleLeg {
  giverId: string;
  receiverId: string;
  itemId: string;
  distanceKm?: number;
}

export interface TradeCycle {
  legs: CycleLeg[];
  /** Suma de distancias de todos los tramos, solo si TODAS son conocidas. */
  totalDistanceKm?: number;
}

const DEFAULT_MAX_CYCLE_LENGTH = 4;

function distanceBetween(a: MatchableItem, b: MatchableItem): number | undefined {
  if (a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) {
    return undefined;
  }
  return haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
}

/**
 * Un tramo giver -> receiver es válido por distancia si ninguno de los dos
 * puso un radio máximo, o si la distancia entra dentro de ambos límites.
 * Si alguno puso un límite pero no se puede calcular la distancia (falta
 * ubicación), se descarta el tramo: no podemos garantizar su preferencia.
 */
function withinAllowedDistance(
  giver: MatchableItem,
  receiver: MatchableItem,
  distanceKm: number | undefined,
): boolean {
  const giverLimit = giver.maxDistanceKm;
  const receiverLimit = receiver.maxDistanceKm;
  if (giverLimit === undefined && receiverLimit === undefined) return true;
  if (distanceKm === undefined) return false;
  if (giverLimit !== undefined && distanceKm > giverLimit) return false;
  if (receiverLimit !== undefined && distanceKm > receiverLimit) return false;
  return true;
}

/**
 * Grafo dirigido: arista item_A -> item_B si la categoría de A satisface
 * lo que busca B (B.lookingFor incluye A.category), no son del mismo dueño,
 * y la distancia entre ambos respeta el radio máximo de quien lo haya
 * seteado. Un ciclo A -> B -> C -> A significa: A le da su objeto a B, B a
 * C, C a A. Longitud 2 es un trueque bilateral; 3+ es una cadena/triangulación.
 *
 * Por defecto, entre varios ciclos posibles siempre se prioriza el de menor
 * distancia total (cercanía), y recién como desempate el de menos personas.
 */
export function findTradeCycles(
  items: MatchableItem[],
  maxLength: number = DEFAULT_MAX_CYCLE_LENGTH,
): TradeCycle[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const adjacency = new Map<string, string[]>();
  const edgeDistance = new Map<string, number | undefined>();

  for (const giver of items) {
    const targets: string[] = [];
    for (const receiver of items) {
      if (receiver.id === giver.id || receiver.ownerId === giver.ownerId) continue;
      if (!receiver.lookingFor.includes(giver.category)) continue;

      const distanceKm = distanceBetween(giver, receiver);
      if (!withinAllowedDistance(giver, receiver, distanceKm)) continue;

      targets.push(receiver.id);
      edgeDistance.set(`${giver.id}>${receiver.id}`, distanceKm);
    }
    adjacency.set(giver.id, targets);
  }

  const seenSignatures = new Set<string>();
  const cycles: TradeCycle[] = [];

  function recordCycle(path: string[]) {
    const minId = path.reduce((min, id) => (id < min ? id : min), path[0]);
    const minIndex = path.indexOf(minId);
    const rotated = [...path.slice(minIndex), ...path.slice(0, minIndex)];
    const signature = rotated.join(">");
    if (seenSignatures.has(signature)) return;
    seenSignatures.add(signature);

    const legs: CycleLeg[] = rotated.map((itemId, index) => {
      const giverItem = itemsById.get(itemId)!;
      const receiverItemId = rotated[(index + 1) % rotated.length];
      const receiverItem = itemsById.get(receiverItemId)!;
      return {
        giverId: giverItem.ownerId,
        receiverId: receiverItem.ownerId,
        itemId: giverItem.id,
        distanceKm: edgeDistance.get(`${itemId}>${receiverItemId}`),
      };
    });

    const totalDistanceKm = legs.every((leg) => leg.distanceKm !== undefined)
      ? legs.reduce((sum, leg) => sum + (leg.distanceKm ?? 0), 0)
      : undefined;

    cycles.push({ legs, totalDistanceKm });
  }

  function dfs(start: string, current: string, path: string[], visitedOwners: Set<string>) {
    if (path.length >= maxLength) return;
    for (const next of adjacency.get(current) ?? []) {
      if (next === start) {
        if (path.length >= 2) recordCycle(path);
        continue;
      }
      const nextItem = itemsById.get(next)!;
      if (path.includes(next) || visitedOwners.has(nextItem.ownerId)) continue;
      visitedOwners.add(nextItem.ownerId);
      dfs(start, next, [...path, next], visitedOwners);
      visitedOwners.delete(nextItem.ownerId);
    }
  }

  for (const item of items) {
    dfs(item.id, item.id, [item.id], new Set([item.ownerId]));
  }

  return cycles.sort((a, b) => {
    const distanceA = a.totalDistanceKm ?? Infinity;
    const distanceB = b.totalDistanceKm ?? Infinity;
    if (distanceA !== distanceB) return distanceA - distanceB;
    return a.legs.length - b.legs.length;
  });
}
