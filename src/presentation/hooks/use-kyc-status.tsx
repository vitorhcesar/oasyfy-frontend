import { supabase } from "@/infra/integrations/supabase/client";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { useEffect, useState } from "react";

export function useKycStatus() {
  const { user } = useAuthStore();
  const [kycApproved, setKycApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("kyc_submissions")
      .select("status")
      .eq("user_id", user.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        setKycApproved(data?.status === "approved");
        setLoading(false);
      });
  }, [user]);

  return { kycApproved, loading };
}
