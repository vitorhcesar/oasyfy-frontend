import { cn } from "@/presentation/utils/cn";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] font-semibold",
        isPositive ? "text-emerald-500" : "text-destructive",
      )}
    >
      {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}
