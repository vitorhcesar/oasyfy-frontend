import { AppError } from "@/domain/errors/app.error";

export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    throw new AppError("VITE_API_URL is not set", 500);
  }
  return baseUrl.trim();
}

export function getPracaLiveWsUrl(): string {
  const url = new URL("/api/v1/praca/live", `${getApiBaseUrl()}/`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function getMinigameLobbyWsUrl(): string {
  const url = new URL("/api/v1/praca/minigames/live", `${getApiBaseUrl()}/`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function getMinigameMatchWsUrl(minigameId: number): string {
  const url = new URL(
    `/api/v1/praca/minigames/${minigameId}/live`,
    `${getApiBaseUrl()}/`,
  );
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
