import { apiService } from "@/infra/http/services/api/api.service";
import { useMemo } from "react";

export function useApiService() {
  return useMemo(() => apiService, []);
}
