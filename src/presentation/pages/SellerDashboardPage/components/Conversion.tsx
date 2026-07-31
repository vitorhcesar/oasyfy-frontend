import { cn } from "@/presentation/utils/cn";
import { FileText, QrCode } from "lucide-react";

interface IConversionProps {
  pixRate: number;
  boletoRate: number;
}

export default function Conversion({ pixRate, boletoRate }: IConversionProps) {
  const cards = [
    {
      label: "Conversão PIX",
      value: pixRate,
      icon: QrCode,
      accent: "bg-primary/10 text-primary",
      barClass: "bg-primary",
    },
    {
      label: "Conversão Boleto",
      value: boletoRate,
      icon: FileText,
      accent: "bg-warning/10 text-warning",
      barClass: "bg-warning",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <div key={card.label} className="admin-surface p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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
            <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
              {card.value}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                card.barClass,
              )}
              style={{ width: `${Math.min(100, Math.max(0, card.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
