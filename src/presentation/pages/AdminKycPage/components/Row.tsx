interface IRowProps {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}

export function Row({ label, value, mono }: IRowProps) {
  return (
    <div className="flex items-baseline justify-between py-3">
      <span className="text-xs text-muted-foreground/50">{label}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
