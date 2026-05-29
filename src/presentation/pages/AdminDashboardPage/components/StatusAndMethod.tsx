import { IPlatformMetricsTransactionDto } from "@/infra/http/services/api/modules/admin-platform-metrics.types";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCompact } from "../../utils/format-compact";

const methodLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  crypto: "Crypto",
};
const methodColors: Record<string, string> = {
  pix: "hsl(var(--primary))",
  card: "hsl(220, 70%, 55%)",
  boleto: "hsl(38, 90%, 50%)",
  crypto: "hsl(280, 60%, 55%)",
};

interface IStatusAndMethodProps {
  completedTransactions: IPlatformMetricsTransactionDto[];
  pendingTransactions: IPlatformMetricsTransactionDto[];
  failedTransactions: IPlatformMetricsTransactionDto[];
  refundedTransactions: IPlatformMetricsTransactionDto[];
}

export default function StatusAndMethod({
  completedTransactions,
  pendingTransactions,
  failedTransactions,
  refundedTransactions,
}: IStatusAndMethodProps) {
  const statusBreakdown = useMemo(() => {
    const data = [
      {
        name: "Aprovadas",
        value: completedTransactions.length,
        color: "hsl(var(--primary))",
      },
      {
        name: "Pendentes",
        value: pendingTransactions.length,
        color: "hsl(38, 90%, 50%)",
      },
      {
        name: "Falhadas",
        value: failedTransactions.length,
        color: "hsl(var(--destructive))",
      },
      {
        name: "Estornadas",
        value: refundedTransactions.length,
        color: "hsl(280, 60%, 55%)",
      },
    ].filter((d) => d.value > 0);
    return data;
  }, [
    completedTransactions,
    pendingTransactions,
    failedTransactions,
    refundedTransactions,
  ]);

  const methodBreakdown = useMemo(() => {
    const methods: Record<
      string,
      { method: string; count: number; volume: number }
    > = {};
    completedTransactions.forEach((tx) => {
      if (!methods[tx.method])
        methods[tx.method] = { method: tx.method, count: 0, volume: 0 };
      methods[tx.method].count += 1;
      methods[tx.method].volume += tx.amount;
    });
    return Object.values(methods).sort((a, b) => b.volume - a.volume);
  }, [completedTransactions]);

  return (
    <div className="rounded-xl bg-card border border-border/50 p-3 flex flex-col gap-4">
      {/* Pie chart */}
      {statusBreakdown.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-1">
            Status das transações
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={36}
                    strokeWidth={0}
                  >
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              {statusBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {s.name}
                  </span>
                  <span className="text-[10px] font-semibold text-foreground">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Method breakdown */}
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2">
          Por método
        </h3>
        {methodBreakdown.length > 0 ? (
          <div className="space-y-2">
            {methodBreakdown.map((m) => {
              const pct =
                completedTransactions.length > 0
                  ? Math.round((m.count / completedTransactions.length) * 100)
                  : 0;
              return (
                <div key={m.method}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium text-foreground">
                      {methodLabels[m.method] || m.method}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatCompact(m.volume)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          methodColors[m.method] || "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            Sem dados
          </p>
        )}
      </div>
    </div>
  );
}
