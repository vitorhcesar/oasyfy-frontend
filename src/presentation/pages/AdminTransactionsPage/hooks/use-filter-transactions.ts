import { matchesTransactionStatusFilter } from "@/presentation/utils/transaction-status";
import { useMemo } from "react";
import { type DateRange } from "react-day-picker";
import type { Transaction } from "../types/admin-transaction.type";

interface IUseFilterTransactionsParams {
  transactions: Transaction[];
  filterId: string;
  filterCustomer: string;
  filterMethod: string;
  filterAcquirer: string;
  filterStatus: string;
  filterTimeRange: string;
  dateRange: DateRange | undefined;
}

export default function useFilterTransactions({
  transactions,
  filterId,
  filterCustomer,
  filterMethod,
  filterAcquirer,
  filterStatus,
  filterTimeRange,
  dateRange,
}: IUseFilterTransactionsParams) {
  return useMemo(() => {
    const now = new Date();

    let cutoff: Date | null = null;
    if (filterTimeRange === "7d") {
      cutoff = new Date(now.getTime() - 7 * 86400000);
    } else if (filterTimeRange === "30d") {
      cutoff = new Date(now.getTime() - 30 * 86400000);
    } else if (filterTimeRange === "90d") {
      cutoff = new Date(now.getTime() - 90 * 86400000);
    }

    return transactions.filter((t) => {
      if (filterId && !t.id.toLowerCase().includes(filterId.toLowerCase()))
        return false;
      if (
        filterCustomer &&
        !t.customer_name.toLowerCase().includes(filterCustomer.toLowerCase()) &&
        !(t.customer_email || "")
          .toLowerCase()
          .includes(filterCustomer.toLowerCase())
      )
        return false;
      if (filterMethod) {
        if (t.method !== filterMethod) return false;
      } else {
        if (t.method === "withdrawal") return false;
      }
      if (
        filterAcquirer &&
        (t.acquirer || "Gateway interno") !== filterAcquirer
      )
        return false;
      if (
        filterStatus &&
        !matchesTransactionStatusFilter(t.status, filterStatus)
      )
        return false;
      if (dateRange?.from) {
        const txDate = new Date(t.created_at);
        if (txDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (txDate > endOfDay) return false;
        }
      } else if (cutoff && new Date(t.created_at) < cutoff) return false;
      return true;
    });
  }, [
    transactions,
    filterId,
    filterCustomer,
    filterMethod,
    filterAcquirer,
    filterStatus,
    filterTimeRange,
    dateRange,
  ]);
}
