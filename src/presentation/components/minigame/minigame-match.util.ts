import type { IMinigameMatchDto } from "@/infra/http/services/api/modules/types/minigame.types";
import type { TRpsBestOf } from "@/infra/http/services/api/modules/types/minigame.types";

export function rpsWinsNeeded(bestOf: TRpsBestOf): number {
  return (bestOf + 1) / 2;
}

export function mergeMinigameMatch(
  previous: IMinigameMatchDto | null,
  next: IMinigameMatchDto,
): IMinigameMatchDto {
  return {
    ...next,
    you: {
      ...next.you,
      avatarUrl: next.you.avatarUrl ?? previous?.you.avatarUrl ?? null,
    },
    opponent: {
      ...next.opponent,
      avatarUrl: next.opponent.avatarUrl ?? previous?.opponent.avatarUrl ?? null,
    },
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
