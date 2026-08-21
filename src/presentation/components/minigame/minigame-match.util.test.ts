import { describe, expect, test } from "vitest";
import type { IMinigameMatchDto } from "@/infra/http/services/api/modules/types/minigame.types";
import {
  mergeMinigameMatch,
  rpsWinsNeeded,
} from "./minigame-match.util";

function match(
  patch: Omit<Partial<IMinigameMatchDto>, "you" | "opponent"> & {
    you?: Partial<IMinigameMatchDto["you"]>;
    opponent?: Partial<IMinigameMatchDto["opponent"]>;
  } = {},
): IMinigameMatchDto {
  const { you, opponent, ...rest } = patch;
  return {
    id: 1,
    type: "rock_paper_scissors",
    status: "in_progress",
    stakeCents: 2000,
    potCents: 4000,
    feeCents: 0,
    gameConfig: { bestOf: 3 },
    you: {
      sellerId: 10,
      displayName: "Você",
      score: 0,
      avatarUrl: null,
      ...you,
    },
    opponent: {
      sellerId: 11,
      displayName: "Oponente",
      score: 0,
      avatarUrl: null,
      ...opponent,
    },
    currentRound: null,
    rounds: [],
    winnerSellerId: null,
    settlement: null,
    ...rest,
  };
}

describe("rpsWinsNeeded", () => {
  test("maps best-of to wins required", () => {
    expect(rpsWinsNeeded(3)).toBe(2);
    expect(rpsWinsNeeded(5)).toBe(3);
    expect(rpsWinsNeeded(7)).toBe(4);
  });
});

describe("mergeMinigameMatch", () => {
  test("keeps avatars from the previous snapshot when the next one omits them", () => {
    const previous = match({
      you: { avatarUrl: "https://cdn/you.webp" },
      opponent: { avatarUrl: "https://cdn/opp.webp" },
    });
    const next = match({ you: { score: 1, avatarUrl: null } });
    const merged = mergeMinigameMatch(previous, next);
    expect(merged.you.score).toBe(1);
    expect(merged.you.avatarUrl).toBe("https://cdn/you.webp");
    expect(merged.opponent.avatarUrl).toBe("https://cdn/opp.webp");
  });
});
