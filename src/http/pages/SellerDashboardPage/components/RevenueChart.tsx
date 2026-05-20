import { Transaction } from "@/domain/entities/transaction.entity";
import { useHideBalance } from "@/http/hooks/use-hide-balance";
import { cn } from "@/http/utils/cn";
import { useMemo } from "react";
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

  const chartData = useMemo(() => {
    const paidTransactions = transactions.filter((t) => t.isPaid());

    const diffMs = rangeEnd.getTime() - rangeStart.getTime();
    const days = Math.max(1, Math.ceil(diffMs / 86400000));
    const data: { date: string; amount: number; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart.getTime() + i * 86400000);
      const dayStr = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayTx = paidTransactions.filter((t) => {
        const td = new Date(t.createdAt);
        return td >= dayStart && td < dayEnd;
      });
      const dayTotal = dayTx.reduce((s, t) => s + t.amount, 0);
      data.push({ date: dayStr, amount: dayTotal / 100, count: dayTx.length });
    }
    return data;
  }, [rangeStart, rangeEnd, transactions]);

  const chartTotal = useMemo(
    () => chartData.reduce((s, d) => s + d.amount, 0),
    [chartData]
  );
  const chartTxCount = useMemo(
    () => chartData.reduce((s, d) => s + d.count, 0),
    [chartData]
  );

  return (
    <div className="rounded-xl bg-card border border-border/40 p-4 md:p-5 mb-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Faturamento</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Histórico de transações aprovadas
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-sm md:text-base font-bold text-foreground transition-all",
              hideBalance && "blur-md select-none"
            )}
          >
            R${" "}
            {chartTotal.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p
            className={cn(
              "text-[10px] text-muted-foreground transition-all",
              hideBalance && "blur-md select-none"
            )}
          >
            {chartTxCount} transaç{chartTxCount === 1 ? "ão" : "ões"}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "h-56 transition-all",
          hideBalance && "blur-md select-none"
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 4, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
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
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
              }
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                fontSize: "11px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: "8px 12px",
              }}
              labelStyle={{
                fontSize: "10px",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "4px",
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
              strokeWidth={2}
              fill="url(#fillGreen)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
