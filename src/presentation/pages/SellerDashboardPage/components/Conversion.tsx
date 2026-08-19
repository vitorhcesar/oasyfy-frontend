import ConversionGauge from "@/presentation/components/ConversionGauge";
import { cn } from "@/presentation/utils/cn";
import { QrCode } from "lucide-react";

interface IConversionProps {
  pixRate: number;
  pixPaid?: number;
  pixTotal?: number;
}

export default function Conversion({
  pixRate,
  pixPaid = 0,
  pixTotal = 0,
}: IConversionProps) {
  const meta =
    pixTotal > 0
      ? `${pixPaid.toLocaleString("pt-BR")} pagos de ${pixTotal.toLocaleString("pt-BR")}`
      : undefined;

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="admin-surface flex flex-col p-4 md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-primary/10 text-primary",
            )}
          >
            <QrCode size={16} />
          </div>
          <span className="text-sm font-medium text-foreground">
            Conversão PIX
          </span>
        </div>
        <ConversionGauge
          value={pixRate}
          meta={meta}
          size="sm"
          className="mx-auto pr-12"
        />
      </div>
    </div>
  );
}
