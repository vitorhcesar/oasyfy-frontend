import { BrazilZipCodeService } from "@/infra/http/services/brazil-zip-code/brazil-zip-code.service";
import { useMemo } from "react";

export function useBrazilZipCodeService() {
  const brazilZipCodeService = useMemo(() => new BrazilZipCodeService(), []);
  return brazilZipCodeService;
}
