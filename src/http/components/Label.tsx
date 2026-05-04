import { cn } from "../utils/cn";

interface ILabelProps extends React.ComponentPropsWithoutRef<"label"> {
  className?: string;
}

export function Label({ children, className, ...props }: ILabelProps) {
  return (
    <label
      className={cn(
        "text-xs font-medium text-muted-foreground mb-1.5 block",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
