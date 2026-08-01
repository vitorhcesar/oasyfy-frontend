import ConversionGauge from "@/presentation/components/ConversionGauge";
import { cn } from "@/presentation/utils/cn";
import { FileText, LucideIcon, QrCode } from "lucide-react";

interface IConversionProps {
  pixRate: number;
  boletoRate: number;
  pixPaid?: number;
  pixTotal?: number;
  boletoPaid?: number;
  boletoTotal?: number;
}

interface IConversionCard {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  fillClassName?: string;
  meta?: string;
}

export default function Conversion({
  pixRate,
  boletoRate,
  pixPaid = 0,
  pixTotal = 0,
  boletoPaid = 0,
  boletoTotal = 0,
}: IConversionProps) {
  const cards: IConversionCard[] = [
    {
      label: "Conversão PIX",
      value: pixRate,
      icon: QrCode,
      accent: "bg-primary/10 text-primary",
      meta:
        pixTotal > 0
          ? `${pixPaid.toLocaleString("pt-BR")} pagos de ${pixTotal.toLocaleString("pt-BR")}`
          : undefined,
    },
    {
      label: "Conversão Boleto",
      value: boletoRate,
      icon: FileText,
      accent: "bg-warning/10 text-warning",
      fillClassName:
        "bg-warning shadow-[0_0_18px_hsl(var(--warning)/0.4)]",
      meta:
        boletoTotal > 0
          ? `${boletoPaid.toLocaleString("pt-BR")} pagos de ${boletoTotal.toLocaleString("pt-BR")}`
          : undefined,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <div key={card.label} className="admin-surface flex flex-col p-4 md:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                card.accent,
              )}
            >
              <card.icon size={16} />
            </div>
            <span className="text-sm font-medium text-foreground">
              {card.label}
            </span>
          </div>
          <ConversionGauge
            value={card.value}
            meta={card.meta}
            size="sm"
            fillClassName={card.fillClassName}
            className="mx-auto pr-12"
          />
        </div>
      ))}
    </div>
  );
}
