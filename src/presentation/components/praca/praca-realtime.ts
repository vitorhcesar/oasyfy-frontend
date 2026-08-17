import type { IPracaMessageDto } from "@/infra/http/services/api/modules/types/praca.types";

export type TPracaRealtimeEvent =
  | { type: "message.created"; message: IPracaMessageDto }
  | { type: "message.deleted"; messageId: number }
  | { type: "messages.purged"; authorUserId: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPracaMessageDto(value: unknown): value is IPracaMessageDto {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "number" || typeof value.body !== "string") {
    return false;
  }
  if (typeof value.createdAt !== "string" || !isRecord(value.author)) {
    return false;
  }
  return typeof value.author.id === "number";
}

export function parsePracaRealtimeEvent(
  raw: unknown,
): TPracaRealtimeEvent | null {
  if (!isRecord(raw) || typeof raw.type !== "string") return null;
  if (raw.type === "message.created" && isPracaMessageDto(raw.message)) {
    return { type: "message.created", message: raw.message };
  }
  if (raw.type === "message.deleted" && typeof raw.messageId === "number") {
    return { type: "message.deleted", messageId: raw.messageId };
  }
  if (
    raw.type === "messages.purged" &&
    typeof raw.authorUserId === "number"
  ) {
    return { type: "messages.purged", authorUserId: raw.authorUserId };
  }
  return null;
}

function clearQuote(
  messages: IPracaMessageDto[],
  shouldClear: (quotedId: number, quotedAuthorId: number) => boolean,
): IPracaMessageDto[] {
  return messages.map((item) => {
    if (!item.quotedMessage) return item;
    if (!shouldClear(item.quotedMessage.id, item.quotedMessage.author.id)) {
      return item;
    }
    return { ...item, quotedMessage: null };
  });
}

export function applyPracaRealtimeEvent(
  current: IPracaMessageDto[],
  event: TPracaRealtimeEvent,
): IPracaMessageDto[] {
  if (event.type === "message.created") {
    const exists = current.some((item) => item.id === event.message.id);
    if (exists) {
      return current.map((item) =>
        item.id === event.message.id ? event.message : item,
      );
    }
    return [...current, event.message].sort((a, b) => a.id - b.id);
  }

  if (event.type === "message.deleted") {
    return clearQuote(
      current.filter((item) => item.id !== event.messageId),
      (quotedId) => quotedId === event.messageId,
    );
  }

  return clearQuote(
    current.filter((item) => item.author.id !== event.authorUserId),
    (_quotedId, quotedAuthorId) => quotedAuthorId === event.authorUserId,
  );
}
