import { IPlatformMetricsTransactionDto } from "@/infra/http/services/api/modules/types/admin-platform-metrics.types";
import { useMemo } from "react";

interface IUseChartDataProps {
  completedTransactions: IPlatformMetricsTransactionDto[];
  cutoff: Date;
  cutoffEnd: Date;
}

interface IChartData {
  date: string;
  volume: number;
  fees: number;
  count: number;
}

export default function useChartData({
  completedTransactions,
  cutoff,
  cutoffEnd,
}: IUseChartDataProps): IChartData[] {
  const chartData: IChartData[] = useMemo(() => {
    const diffMs = cutoffEnd.getTime() - cutoff.getTime();
    const days = Math.max(1, Math.ceil(diffMs / 86400000));
    const data: {
      date: string;
      volume: number;
      fees: number;
      count: number;
    }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(cutoff.getTime() + i * 86400000);
      const dayStr = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayTx = completedTransactions.filter((t) => {
        const td = new Date(t.createdAt);
        return td >= dayStart && td < dayEnd;
      });
      data.push({
        date: dayStr,
        volume: dayTx.reduce((s, t) => s + t.amount, 0) / 100,
        fees: dayTx.reduce((s, t) => s + t.feeAmount, 0) / 100,
        count: dayTx.length,
      });
    }
    return data;
  }, [completedTransactions, cutoff, cutoffEnd]);

  return chartData;
}
