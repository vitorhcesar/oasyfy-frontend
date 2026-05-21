import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/presentation/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm !m-0 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface RippleState {
  key: number;
  x: number;
  y: number;
  size: number;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ripple?: boolean;
  rippleColor?: string;
  rippleDuration?: number;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      ripple = true,
      rippleColor,
      rippleDuration = 600,
      onClick,
      children,
      loading = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState<RippleState[]>([]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !asChild && !disabled && !loading) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const rippleSize = Math.max(rect.width, rect.height) * 2;
        const x = event.clientX - rect.left - rippleSize / 2;
        const y = event.clientY - rect.top - rippleSize / 2;
        const newRipple: RippleState = {
          key: Date.now(),
          x,
          y,
          size: rippleSize,
        };
        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
          setRipples((curr) => curr.filter((r) => r.key !== newRipple.key));
        }, rippleDuration);
      }
      onClick?.(event);
    };

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const color =
      rippleColor || "var(--button-ripple-color, rgba(255,255,255,0.35))";

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          ripple && "relative overflow-hidden isolate"
        )}
        ref={ref}
        onClick={handleClick}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          children
        )}
        {ripples.map((r) => (
          <span
            key={r.key}
            className="absolute rounded-full pointer-events-none animate-ripple-expand z-10"
            style={
              {
                left: r.x,
                top: r.y,
                width: r.size,
                height: r.size,
                backgroundColor: color,
                "--ripple-duration": `${rippleDuration}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
