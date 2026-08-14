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
    <div className="admin-surface p-5 md:p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        Taxas arrecadadas
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Evolução no período. O lucro da plataforma é taxas menos o custo da
        adquirente usada.
      </p>
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
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 15, 16, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "14px",
                  fontSize: "12px",
                  color: "#fff",
                }}
                formatter={(value: number) => [
                  `R$ ${value.toFixed(2)}`,
                  "Taxas",
                ]}
              />
              <Bar
                dataKey="fees"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
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
