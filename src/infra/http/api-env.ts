/**
 * Origem da API REST + Better Auth (`/api/v1`, `/api/auth`).
 * - Produção: `VITE_API_URL` explícito (ex.: https://api.seudominio.com).
 * - Dev com proxy Vite em `/api`: deixe `VITE_API_URL` vazio para usar `window.location.origin`.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim() ?? "";
  if (raw !== "") return raw.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
