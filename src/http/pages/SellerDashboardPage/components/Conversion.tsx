import { useHideBalance } from "@/http/hooks/use-hide-balance";
import { cn } from "@/http/utils/cn";
import { FileText, QrCode } from "lucide-react";

interface IConversionProps {
  pixRate: number;
  boletoRate: number;
}

export default function Conversion({ pixRate, boletoRate }: IConversionProps) {
  const { hideBalance } = useHideBalance();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
      <div className="p-3 rounded-xl bg-card border border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-primary">
            <QrCode size={13} strokeWidth={1.8} />
          </div>
          <span className="text-xs md:text-sm font-medium text-foreground">
            Conversão PIX
          </span>
        </div>
        <span
          className={cn(
            "text-xs md:text-sm font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md transition-all",
            hideBalance && "blur-md select-none"
          )}
        >
          {pixRate}%
        </span>
      </div>
      <div className="p-3 rounded-xl bg-card border border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-primary">
            <FileText size={13} strokeWidth={1.8} />
          </div>
          <span className="text-xs md:text-sm font-medium text-foreground">
            Conversão Boleto
          </span>
        </div>
        <span
          className={cn(
            "text-xs md:text-sm font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md transition-all",
            hideBalance && "blur-md select-none"
          )}
        >
          {boletoRate}%
        </span>
      </div>
    </div>
  );
}
