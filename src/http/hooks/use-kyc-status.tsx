import { apiService } from "@/infra/http/services/api/api.service";
import { useAuthStore } from "@/http/stores/useAuthStore";
import { useEffect, useState } from "react";

export function useKycStatus() {
  const { user } = useAuthStore();
  const [kycApproved, setKycApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setKycApproved(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    apiService.kycSubmission
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
  }, [user]);

  return { kycApproved, loading };
}
