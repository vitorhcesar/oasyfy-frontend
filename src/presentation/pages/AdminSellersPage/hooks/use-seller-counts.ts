import type { IAdminSellerDto } from "@/infra/http/services/api/modules/admin-sellers.module";
import { useMemo } from "react";
import { TFilterKey } from "../types/filter-key.type";

export default function useSellerCounts(sellers: IAdminSellerDto[]) {
  return useMemo(() => {
    const counts: Record<TFilterKey, number> = {
      all: sellers.length,
      sem_kyc: 0,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
    };

    sellers.forEach((seller) => {
      const status = seller.kycStatus;
      if (status in counts) {
        counts[status as TFilterKey]++;
      }
    });

    counts.under_review = counts.under_review + counts.pending;

    return counts;
  }, [sellers]);
}
