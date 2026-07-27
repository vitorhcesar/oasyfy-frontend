import { cn } from "@/presentation/utils/cn";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        isPositive ? "text-emerald-500" : "text-destructive",
      )}
    >
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}
