import { cn } from "@/presentation/utils/cn";
import { ReactNode } from "react";

interface IPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: IPageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-7 flex animate-fade-in flex-col justify-between gap-5 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-[2.15rem]">
          {title}
        </h1>
        {description != null && description !== "" && (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </header>
  );
}
