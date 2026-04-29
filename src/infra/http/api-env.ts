/** Base URL da API (ex.: http://localhost:8080). Rotas REST ficam como `/api/v1/...`. */
export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL ?? "";
  if (import.meta.env.DEV && url === "") {
    console.warn("[api] VITE_API_URL não está definido.");
  }
  return url;
}
