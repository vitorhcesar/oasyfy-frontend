import type { TMinigameType } from "@/infra/http/services/api/modules/types/minigame.types";
import { RockPaperScissorsIcon } from "@/presentation/components/praca/RockPaperScissorsIcon";
import type { ComponentType } from "react";

export const MINIGAME_STAKE_MIN_REAIS = 20;
export const MINIGAME_STAKE_MAX_REAIS = 5000;

export interface IMinigameCatalogItem {
  type: TMinigameType;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

export const MINIGAME_CATALOG: IMinigameCatalogItem[] = [
  {
    type: "rock_paper_scissors",
    label: "Pedra, papel e tesoura",
    Icon: RockPaperScissorsIcon,
  },
];

export function getMinigameCatalogItem(
  type: TMinigameType,
): IMinigameCatalogItem | undefined {
  return MINIGAME_CATALOG.find((item) => item.type === type);
}
