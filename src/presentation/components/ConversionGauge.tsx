import { cn } from "@/presentation/utils/cn";

interface IConversionGaugeProps {
  value: number;
  meta?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Override fill color class (e.g. bg-warning) */
  fillClassName?: string;
}

const SEGMENTS = 10;

/**
 * Vertical battery-style conversion gauge with 10% segment divisions.
 */
export default function ConversionGauge({
  value,
  meta,
  className,
  size = "md",
  fillClassName,
}: IConversionGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const displayValue = Number.isInteger(clamped)
    ? String(clamped)
    : clamped.toFixed(1);

  const batteryHeight =
    size === "sm" ? "h-28" : size === "lg" ? "h-44 md:h-52" : "h-36";
  const batteryWidth =
    size === "sm" ? "w-10" : size === "lg" ? "w-12 md:w-14" : "w-12";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative flex items-end justify-center pt-1">
        {/* Battery terminal (cap) */}
        <div
          className={cn(
            "absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-t-md bg-muted/80",
            size === "sm" ? "h-1.5 w-4" : "h-2 w-5",
          )}
          aria-hidden
        />

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10 bg-muted/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]",
            batteryHeight,
            batteryWidth,
          )}
          role="meter"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Taxa de conversão ${displayValue}%`}
        >
          {/* Fill from bottom */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 rounded-b-[0.9rem] transition-[height] duration-700 ease-out",
              fillClassName ??
                "bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)]",
            )}
            style={{ height: `${clamped}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/20" />
          </div>

          {/* 10% segment dividers */}
          <div className="pointer-events-none absolute inset-0 flex flex-col">
            {Array.from({ length: SEGMENTS - 1 }, (_, index) => (
              <div
                key={index}
                className="flex-1 border-b border-background/70"
                style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}
              />
            ))}
            <div className="flex-1" />
          </div>
        </div>

        {/* Percentage pill beside the bar, aligned to fill level */}
        <div
          className="absolute left-[calc(100%+0.65rem)] transition-[bottom] duration-700 ease-out"
          style={{
            bottom: `max(0px, calc(${clamped}% - 0.85rem))`,
          }}
        >
          <span
            className={cn(
              "inline-flex items-center rounded-full border border-white/10 bg-foreground px-2.5 py-1 font-semibold text-background shadow-lg tabular-nums",
              size === "sm" ? "text-[11px]" : "text-sm",
            )}
          >
            {displayValue}%
          </span>
        </div>
      </div>

      {meta ? (
        <span className="max-w-[11rem] text-center text-[11px] leading-snug text-muted-foreground md:text-xs">
          {meta}
        </span>
      ) : null}
    </div>
  );
}
