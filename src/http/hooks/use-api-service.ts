import { apiService } from "@/infra/http";
import { useMemo } from "react";

export function useApiService() {
  return useMemo(() => apiService, []);
}
