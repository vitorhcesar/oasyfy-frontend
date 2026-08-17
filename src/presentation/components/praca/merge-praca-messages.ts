import type { IPracaMessageDto } from "@/infra/http/services/api/modules/types/praca.types";

const OPTIMISTIC_KEEP_MS = 10_000;

export function mergePracaLivePage(
  current: IPracaMessageDto[],
  incoming: IPracaMessageDto[],
  now = Date.now(),
): IPracaMessageDto[] {
  if (incoming.length === 0) {
    return current.filter(
      (item) => now - new Date(item.createdAt).getTime() < OPTIMISTIC_KEEP_MS,
    );
  }

  const incomingById = new Map(incoming.map((item) => [item.id, item]));
  const minIncomingId = Math.min(...incoming.map((item) => item.id));
  const maxIncomingId = Math.max(...incoming.map((item) => item.id));
  const merged = new Map(incomingById);

  for (const item of current) {
    if (incomingById.has(item.id)) continue;
    if (item.id < minIncomingId) {
      merged.set(item.id, item);
      continue;
    }
    const isOptimistic =
      item.id > maxIncomingId &&
      now - new Date(item.createdAt).getTime() < OPTIMISTIC_KEEP_MS;
    if (isOptimistic) {
      merged.set(item.id, item);
    }
  }

  return [...merged.values()].sort((a, b) => a.id - b.id);
}
