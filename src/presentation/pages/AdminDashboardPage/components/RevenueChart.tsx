import { Ban, Clock, ShieldCheck } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface IRevenueChartProps {
  chartData: {
    date: string;
    volume: number;
    fees: number;
    count: number;
  }[];
  completedTransactionsCount: number;
  pendingTransactionsCount: number;
  failedTransactionsCount: number;
}

export default function RevenueChart({
  chartData,
  completedTransactionsCount,
  pendingTransactionsCount,
  failedTransactionsCount,
}: IRevenueChartProps) {
  return (
    <div className="admin-surface md:col-span-2 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Faturamento
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Volume aprovado no período
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <ShieldCheck size={13} />
            {completedTransactionsCount} aprovadas
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <Clock size={13} />
            {pendingTransactionsCount} pendentes
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            <Ban size={13} />
            {failedTransactionsCount} falhadas
          </span>
        </div>
      </div>
      {chartData.length > 0 ? (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="55%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.08}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="hsl(var(--border))"
                opacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 12,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 12,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 6, 23, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "14px",
                  fontSize: "13px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                  padding: "10px 14px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "volume")
                    return [
                      `R$ ${value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`,
                      "Volume",
                    ];
                  return [value, name];
                }}
                cursor={{
                  stroke: "hsl(var(--primary))",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#adminFill)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "hsl(var(--primary))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Sem dados no período
        </p>
      )}
    </div>
  );
}
