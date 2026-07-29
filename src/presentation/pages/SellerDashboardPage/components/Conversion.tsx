import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { cn } from "@/presentation/utils/cn";
import { FileText, QrCode } from "lucide-react";

interface IConversionProps {
  pixRate: number;
  boletoRate: number;
}

export default function Conversion({ pixRate, boletoRate }: IConversionProps) {
  const { hideBalance } = useHideBalance();

  const cards = [
    {
      label: "Conversão PIX",
      value: pixRate,
      icon: QrCode,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Conversão Boleto",
      value: boletoRate,
      icon: FileText,
      accent: "bg-warning/10 text-warning",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className="admin-surface flex items-center justify-between p-4 md:p-5"
        >
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
          <span
            className={cn(
              "text-xl font-bold tabular-nums tracking-tight text-foreground transition-all",
              hideBalance && "blur-md select-none",
            )}
          >
            {card.value}%
          </span>
        </div>
      ))}
    </div>
  );
}
