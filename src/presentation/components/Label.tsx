import { cn } from "../utils/cn";

interface ILabelProps extends React.ComponentPropsWithoutRef<"label"> {
  className?: string;
}

export function Label({ children, className, ...props }: ILabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-muted-foreground pb-2 block",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}
