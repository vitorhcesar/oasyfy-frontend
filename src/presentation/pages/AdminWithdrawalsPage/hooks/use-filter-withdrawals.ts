import type { TAdminWithdrawalView } from "@/presentation/hooks/use-admin-withdrawals-query";
import { useMemo } from "react";
import { type DateRange } from "react-day-picker";

interface UseFilterWithdrawalsParams {
  withdrawals: TAdminWithdrawalView[];
  filterSeller: string;
  filterStatus: string;
  dateRange: DateRange | undefined;
  activeStatFilter: string | null;
}

export default function useFilterWithdrawals({
  withdrawals,
  filterSeller,
  filterStatus,
  dateRange,
  activeStatFilter,
}: UseFilterWithdrawalsParams) {
  const filtered = useMemo(() => {
    return withdrawals.filter((w) => {
      if (filterSeller) {
        const q = filterSeller.toLowerCase().trim();
        const matchName = w.seller_name?.toLowerCase().includes(q);
        const matchEmail = w.seller_email?.toLowerCase().includes(q);
        const matchId = w.id.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId) return false;
      }
      if (filterStatus && w.status !== filterStatus) return false;
      if (dateRange?.from) {
        const d = new Date(w.created_at);
        if (d < dateRange.from) return false;
        if (dateRange.to) {
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
      return true;
    });
  }, [withdrawals, filterSeller, filterStatus, dateRange]);

  const displayFiltered = useMemo(() => {
    if (!activeStatFilter) return filtered;
    if (activeStatFilter === "cancelled")
      return filtered.filter(
        (w) => w.status === "cancelled" || w.status === "failed",
      );
    return filtered.filter((w) => w.status === activeStatFilter);
  }, [filtered, activeStatFilter]);

  return { filtered, displayFiltered };
}
