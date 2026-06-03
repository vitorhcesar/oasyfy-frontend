import { IPlatformMetricsTransactionDto } from "@/infra/http/services/api/modules/types/admin-platform-metrics.types";
import { useMemo } from "react";

interface IUseFilterTransactionsProps {
  transactions: IPlatformMetricsTransactionDto[];
  cutoff: Date;
  cutoffEnd: Date;
}

export default function useFilterTransactions({
  transactions,
  cutoff,
  cutoffEnd,
}: IUseFilterTransactionsProps) {
  const allNonWithdrawal = useMemo(
    () => transactions.filter((t) => t.method !== "withdrawal"),
    [transactions],
  );

  const filteredTransactions = useMemo(
    () =>
      allNonWithdrawal.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= cutoff && d <= cutoffEnd;
      }),
    [allNonWithdrawal, cutoff, cutoffEnd],
  );

  const completedTransactions = useMemo(
    () =>
      filteredTransactions.filter(
        (t) => t.status === "completed" || t.status === "paid",
      ),
    [filteredTransactions],
  );
  const pendingTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.status === "pending"),
    [filteredTransactions],
  );
  const failedTransactions = useMemo(
    () =>
      filteredTransactions.filter(
        (t) => t.status === "failed" || t.status === "cancelled",
      ),
    [filteredTransactions],
  );
  const refundedTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.status === "refunded"),
    [filteredTransactions],
  );

  return {
    filteredTransactions,
    completedTransactions,
    pendingTransactions,
    failedTransactions,
    refundedTransactions,
  };
}
