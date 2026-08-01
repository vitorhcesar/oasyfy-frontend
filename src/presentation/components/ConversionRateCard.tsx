import ConversionGauge from "@/presentation/components/ConversionGauge";
import { Percent } from "lucide-react";

interface IConversionRateCardProps {
  value: number;
  completedCount: number;
  totalCount: number;
  title?: string;
  description?: string;
}

/**
 * Full-width conversion card (standalone section, like Faturamento).
 */
export default function ConversionRateCard({
  value,
  completedCount,
  totalCount,
  title = "Taxa de conversão",
  description = "Proporção de transações aprovadas no período",
}: IConversionRateCardProps) {
  return (
    <div className="admin-surface mb-6 p-5 md:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Percent size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground md:text-sm">
            <span className="font-medium text-foreground tabular-nums">
              {completedCount.toLocaleString("pt-BR")}
            </span>{" "}
            pagos de{" "}
            <span className="font-medium text-foreground tabular-nums">
              {totalCount.toLocaleString("pt-BR")}
            </span>{" "}
            transações
          </p>
        </div>

        <ConversionGauge value={value} size="md" className="pr-12 sm:shrink-0" />
      </div>
    </div>
  );
}
