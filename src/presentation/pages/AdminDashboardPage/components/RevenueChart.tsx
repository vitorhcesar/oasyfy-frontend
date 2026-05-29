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
    <div className="md:col-span-2 rounded-xl bg-card border border-border/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground">Faturamento</h3>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck size={10} className="text-success" />
            {completedTransactionsCount} aprovadas
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} className="text-warning" />
            {pendingTransactionsCount} pendentes
          </span>
          <span className="flex items-center gap-1">
            <Ban size={10} className="text-destructive" />
            {failedTransactionsCount} falhadas
          </span>
        </div>
      </div>
      {chartData.length > 0 ? (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="adminFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="60%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.05}
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
                opacity={0.25}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 9,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 9,
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
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: "10px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  padding: "8px 12px",
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
                strokeWidth={2}
                fill="url(#adminFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "hsl(var(--primary))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-8">
          Sem dados no período
        </p>
      )}
    </div>
  );
}
