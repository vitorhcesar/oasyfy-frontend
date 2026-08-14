import { Transaction } from "@/domain/entities/transaction.entity";
import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { cn } from "@/presentation/utils/cn";
import { useMemo } from "react";
import { buildSellerRevenueChartData } from "../utils/build-seller-revenue-chart-data";
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
  rangeStart: Date;
  rangeEnd: Date;
  transactions: Transaction[];
}

export default function RevenueChart({
  rangeStart,
  rangeEnd,
  transactions,
}: IRevenueChartProps) {
  const { hideBalance } = useHideBalance();

  const chartData = useMemo(
    () => buildSellerRevenueChartData(transactions, rangeStart, rangeEnd),
    [rangeStart, rangeEnd, transactions],
  );

  const chartTotal = useMemo(
    () => chartData.reduce((s, d) => s + d.amount, 0),
    [chartData],
  );
  const chartTxCount = useMemo(
    () => chartData.reduce((s, d) => s + d.count, 0),
    [chartData],
  );

  return (
    <div className="admin-surface mb-6 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Faturamento
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vendas e depósitos aprovados, sem descontar taxas
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p
            className={cn(
              "text-xl font-bold tracking-tight text-foreground tabular-nums transition-all md:text-2xl",
              hideBalance && "blur-md select-none",
            )}
          >
            R${" "}
            {chartTotal.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs text-muted-foreground transition-all",
              hideBalance && "blur-md select-none",
            )}
          >
            {chartTxCount} transaç{chartTxCount === 1 ? "ão" : "ões"}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "h-60 transition-all",
          hideBalance && "blur-md select-none",
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sellerFill" x1="0" y1="0" x2="0" y2="1">
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
                backgroundColor: "rgba(15, 15, 16, 0.85)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "14px",
                fontSize: "13px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                padding: "10px 14px",
                color: "#fff",
              }}
              formatter={(value: number, name: string) => {
                if (name === "amount")
                  return [
                    `R$ ${value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}`,
                    "Faturamento",
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
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#sellerFill)"
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
    </div>
  );
}
