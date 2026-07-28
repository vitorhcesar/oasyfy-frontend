interface IRowProps {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}

export function Row({ label, value, mono }: IRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-right text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
