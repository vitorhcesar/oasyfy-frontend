import { useAuthStore } from "@/http/stores/useAuthStore";
import { useEffect, useState } from "react";
import { useApiService } from "./use-api-service";

export function useKycStatus() {
  const { user } = useAuthStore();

  const apiService = useApiService();

  const [kycApproved, setKycApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setKycApproved(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    apiService.modules.kycSubmission
      .getSellerSubmission()
      .then(({ submission }) => {
        if (!cancelled) {
          setKycApproved(submission?.status === "approved");
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setKycApproved(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, apiService]);

  return { kycApproved, loading };
}
