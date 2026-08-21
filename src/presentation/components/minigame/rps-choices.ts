import type { TRpsChoice } from "@/infra/http/services/api/modules/types/minigame.types";

export const RPS_CHOICES: Array<{
  value: TRpsChoice;
  label: string;
  emoji: string;
}> = [
  { value: "rock", label: "Pedra", emoji: "✊" },
  { value: "paper", label: "Papel", emoji: "✋" },
  { value: "scissors", label: "Tesoura", emoji: "✌️" },
];

export function rpsEmoji(choice: TRpsChoice | null | undefined): string {
  return RPS_CHOICES.find((item) => item.value === choice)?.emoji ?? "";
}

export function rpsLabel(choice: TRpsChoice | null | undefined): string {
  return RPS_CHOICES.find((item) => item.value === choice)?.label ?? "";
}

export function shortPlayerName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
}

export function initialsFromName(name: string): string {
  const parts = shortPlayerName(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}
