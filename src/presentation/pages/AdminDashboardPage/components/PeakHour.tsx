import { IPlatformMetricsTransactionDto } from "@/infra/http/services/api/modules/types/admin-platform-metrics.types";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface IPeakHourProps {
  completedTransactions: IPlatformMetricsTransactionDto[];
}

export default function PeakHour({ completedTransactions }: IPeakHourProps) {
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      count: 0,
    }));
    completedTransactions.forEach((tx) => {
      const h = new Date(tx.createdAt).getHours();
      hours[h].count += 1;
    });
    return hours;
  }, [completedTransactions]);

  return (
    <div className="admin-surface p-5 md:p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        Horário de pico
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Transações aprovadas por hora
      </p>
      {completedTransactions.length > 0 ? (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyData}
              margin={{ top: 5, right: 2, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="hour"
                tick={{
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 6, 23, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "14px",
                  fontSize: "12px",
                  color: "#fff",
                }}
                formatter={(value: number) => [value, "Transações"]}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sem dados
        </p>
      )}
    </div>
  );
}
