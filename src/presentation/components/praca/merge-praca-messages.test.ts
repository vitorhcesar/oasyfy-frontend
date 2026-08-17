import { describe, expect, it } from "vitest";
import { mergePracaLivePage } from "./merge-praca-messages";
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

describe("mergePracaLivePage", () => {
  it("drops messages deleted from the live window", () => {
    const current = [msg(1), msg(2), msg(3)];
    const incoming = [msg(1), msg(3)];
    expect(mergePracaLivePage(current, incoming).map((item) => item.id)).toEqual(
      [1, 3],
    );
  });

  it("keeps older messages loaded via pagination", () => {
    const current = [msg(1), msg(2), msg(10), msg(11)];
    const incoming = [msg(10), msg(11)];
    expect(mergePracaLivePage(current, incoming).map((item) => item.id)).toEqual(
      [1, 2, 10, 11],
    );
  });

  it("updates quotedMessage from the server payload", () => {
    const current = [
      msg(2, {
        quotedMessage: {
          id: 1,
          body: "original",
          author: {
            id: 1,
            displayName: "Seller",
            role: "seller",
            avatarUrl: null,
          },
        },
      }),
    ];
    const incoming = [msg(2, { quotedMessage: null })];
    expect(mergePracaLivePage(current, incoming)[0]?.quotedMessage).toBeNull();
  });

  it("clears the feed when the server page is empty", () => {
    expect(mergePracaLivePage([msg(1), msg(2)], [])).toEqual([]);
  });
});
