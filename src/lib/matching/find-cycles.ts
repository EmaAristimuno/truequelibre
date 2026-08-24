export interface MatchableItem {
  id: string;
  ownerId: string;
  category: string;
  lookingFor: string[];
}

export interface CycleLeg {
  giverId: string;
  receiverId: string;
  itemId: string;
}

const DEFAULT_MAX_CYCLE_LENGTH = 4;

/**
 * Grafo dirigido: arista item_A -> item_B si la categoría de A satisface
 * lo que busca B (B.lookingFor incluye A.category) y no son del mismo dueño.
 * Un ciclo A -> B -> C -> A significa: A le da su objeto a B, B a C, C a A.
 * Un ciclo de longitud 2 es un trueque bilateral simple; de 3+ es triangulación.
 */
export function findTradeCycles(
  items: MatchableItem[],
  maxLength: number = DEFAULT_MAX_CYCLE_LENGTH,
): CycleLeg[][] {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const adjacency = new Map<string, string[]>();
  for (const giver of items) {
    const targets = items
      .filter(
        (receiver) =>
          receiver.id !== giver.id &&
          receiver.ownerId !== giver.ownerId &&
          receiver.lookingFor.includes(giver.category),
      )
      .map((receiver) => receiver.id);
    adjacency.set(giver.id, targets);
  }

  const seenSignatures = new Set<string>();
  const cycles: CycleLeg[][] = [];

  function recordCycle(path: string[]) {
    const minId = path.reduce((min, id) => (id < min ? id : min), path[0]);
    const minIndex = path.indexOf(minId);
    const rotated = [...path.slice(minIndex), ...path.slice(0, minIndex)];
    const signature = rotated.join(">");
    if (seenSignatures.has(signature)) return;
    seenSignatures.add(signature);

    cycles.push(
      rotated.map((itemId, index) => {
        const giverItem = itemsById.get(itemId)!;
        const receiverItem = itemsById.get(rotated[(index + 1) % rotated.length])!;
        return {
          giverId: giverItem.ownerId,
          receiverId: receiverItem.ownerId,
          itemId: giverItem.id,
        };
      }),
    );
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

  return cycles;
}
