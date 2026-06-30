import type { TAdminWithdrawalView } from "@/presentation/hooks/use-admin-withdrawals-query";
import {
  CheckCircle,
  Clock,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

export type WithdrawalStat = {
  label: string;
  value: number;
  count: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  key: string;
};

export default function useWithdrawalStats(
  filtered: TAdminWithdrawalView[],
): WithdrawalStat[] {
  return useMemo(() => {
    const sum = (arr: TAdminWithdrawalView[]) =>
      arr.reduce((a, w) => a + Math.abs(w.amount), 0);
    const pending = filtered.filter((w) => w.status === "pending");
    const completed = filtered.filter((w) => w.status === "completed");
    const cancelled = filtered.filter(
      (w) => w.status === "cancelled" || w.status === "failed",
    );
    const transferring = filtered.filter((w) => w.status === "transferring");
    return [
      {
        label: "Pendentes",
        value: sum(pending),
        count: pending.length,
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-500/10",
        border: "border-yellow-200",
        key: "pending",
      },
      {
        label: "Aprovados",
        value: sum(completed),
        count: completed.length,
        icon: CheckCircle,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        key: "completed",
      },
      {
        label: "Transferindo",
        value: sum(transferring),
        count: transferring.length,
        icon: Send,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-200",
        key: "transferring",
      },
      {
        label: "Cancelados",
        value: sum(cancelled),
        count: cancelled.length,
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/20",
        key: "cancelled",
      },
    ];
  }, [filtered]);
}
