import { isApprovedTransactionStatus } from "@/presentation/utils/transaction-status";
import {
  Clock,
  DollarSign,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import type { Transaction } from "../types/admin-transaction.type";

export type TransactionStat = {
  label: string;
  value: number;
  count: number;
  total: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
};

export default function useTransactionStats(filtered: Transaction[]) {
  return useMemo(() => {
    const paid = filtered.filter(
      (t) => isApprovedTransactionStatus(t.status) && t.method !== "withdrawal",
    );
    const pending = filtered.filter((t) => t.status === "pending");
    const failed = filtered.filter((t) => t.status === "failed");
    const refunded = filtered.filter((t) => t.status === "refunded");
    const chargeback = filtered.filter((t) => t.status === "chargeback");
    const total = filtered.length;
    const sum = (arr: Transaction[]) => arr.reduce((a, t) => a + t.amount, 0);
    return [
      {
        label: "Pago",
        value: sum(paid),
        count: paid.length,
        total,
        icon: DollarSign,
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/30",
      },
      {
        label: "Pendente",
        value: sum(pending),
        count: pending.length,
        total,
        icon: Clock,
        color: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/30",
      },
      {
        label: "Falhou",
        value: sum(failed),
        count: failed.length,
        total,
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/30",
      },
      {
        label: "Chargeback",
        value: sum(chargeback),
        count: chargeback.length,
        total,
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/30",
      },
      {
        label: "Reembolsado",
        value: sum(refunded),
        count: refunded.length,
        total,
        icon: RotateCcw,
        color: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/30",
      },
    ] satisfies TransactionStat[];
  }, [filtered]);
}
