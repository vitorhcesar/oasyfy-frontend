import { cn } from "@/http/utils/cn";
import * as React from "react";

const portalInputCore =
  "w-full rounded-lg border border-border bg-background py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none ring-2 ring-transparent transition-colors focus:border-primary focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

export interface IInputProps
  extends Omit<React.ComponentProps<"input">, "children" | "size"> {
  startComponent?: React.ReactNode;
  finalComponent?: React.ReactNode;
  wrapperClassName?: string;
  /** Default: ícones do seller em `left-3`. */
  startSlotClassName?: string;
  /** Default: `right-3` (toggle / sufixos). */
  finalSlotClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, IInputProps>(
  (
    {
      className,
      startComponent,
      finalComponent,
      wrapperClassName,
      startSlotClassName,
      finalSlotClassName,
      ...inputProps
    },
    ref
  ) => {
    const hasStart = startComponent != null;
    const hasEnd = finalComponent != null;

    const fieldClass = cn(
      portalInputCore,
      !hasStart && !hasEnd && "px-4",
      hasStart && !hasEnd && "pl-9 pr-4",
      !hasStart && hasEnd && "pl-4 pr-10",
      hasStart && hasEnd && "pl-9 pr-10",
      className
    );

    if (!hasStart && !hasEnd) {
      return <input ref={ref} className={fieldClass} {...inputProps} />;
    }

    return (
      <div className={cn("relative", wrapperClassName)}>
        {hasStart ? (
          <div
            className={cn(
              "absolute inset-y-0 left-3 z-10 flex items-center",
              startSlotClassName
            )}
          >
            {startComponent}
          </div>
        ) : null}

        <input ref={ref} className={fieldClass} {...inputProps} />

        {hasEnd ? (
          <div
            className={cn(
              "absolute inset-y-0 right-3 z-10 flex items-center gap-1.5",
              finalSlotClassName
            )}
          >
            {finalComponent}
          </div>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
