import { AppError } from "@/domain/errors/app.error";

export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (baseUrl === null) {
    throw new AppError("VITE_API_URL is not set", 500);
  }
  return baseUrl.trim();
}
