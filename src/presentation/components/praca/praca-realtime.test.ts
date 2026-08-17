import { describe, expect, it } from "vitest";
import {
  applyPracaRealtimeEvent,
  parsePracaRealtimeEvent,
} from "./praca-realtime";
import type { IPracaMessageDto } from "@/infra/http/services/api/modules/types/praca.types";

function msg(
  id: number,
  overrides: Partial<IPracaMessageDto> = {},
): IPracaMessageDto {
  return {
    id,
    body: `m${id}`,
    createdAt: new Date("2026-08-17T12:00:00.000Z").toISOString(),
    author: {
      id: 1,
      displayName: "Seller",
      role: "seller",
      avatarUrl: null,
    },
    quotedMessage: null,
    ...overrides,
  };
}

describe("applyPracaRealtimeEvent", () => {
  it("appends a created message", () => {
    const next = applyPracaRealtimeEvent([msg(1)], {
      type: "message.created",
      message: msg(2),
    });
    expect(next.map((item) => item.id)).toEqual([1, 2]);
  });

  it("removes a deleted message and clears quotes of it", () => {
    const quoted = {
      id: 1,
      body: "original",
      author: {
        id: 1,
        displayName: "Seller",
        role: "seller" as const,
        avatarUrl: null,
      },
    };
    const current = [msg(1), msg(2, { quotedMessage: quoted })];
    const next = applyPracaRealtimeEvent(current, {
      type: "message.deleted",
      messageId: 1,
    });
    expect(next).toEqual([msg(2)]);
  });

  it("removes every message from a purged author", () => {
    const current = [
      msg(1, { author: { ...msg(1).author, id: 10 } }),
      msg(2, { author: { ...msg(2).author, id: 20 } }),
    ];
    const next = applyPracaRealtimeEvent(current, {
      type: "messages.purged",
      authorUserId: 10,
    });
    expect(next.map((item) => item.id)).toEqual([2]);
  });
});

describe("parsePracaRealtimeEvent", () => {
  it("accepts a delete payload", () => {
    expect(
      parsePracaRealtimeEvent({ type: "message.deleted", messageId: 9 }),
    ).toEqual({ type: "message.deleted", messageId: 9 });
  });

  it("ignores pong and unknown payloads", () => {
    expect(parsePracaRealtimeEvent({ type: "pong" })).toBeNull();
    expect(parsePracaRealtimeEvent("ping")).toBeNull();
  });
});
