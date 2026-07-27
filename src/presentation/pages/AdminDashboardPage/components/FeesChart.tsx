import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface IFeesChartProps {
  chartData: {
    date: string;
    volume: number;
    fees: number;
    count: number;
  }[];
}

export default function FeesChart({ chartData }: IFeesChartProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <h3 className="mb-4 text-base font-semibold text-foreground">
        Taxas arrecadadas
      </h3>
      {chartData.length > 0 ? (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 8,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 8,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "10px",
                }}
                formatter={(value: number) => [
                  `R$ ${value.toFixed(2)}`,
                  "Taxas",
                ]}
              />
              <Bar
                dataKey="fees"
                fill="hsl(var(--primary))"
                radius={[3, 3, 0, 0]}
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
