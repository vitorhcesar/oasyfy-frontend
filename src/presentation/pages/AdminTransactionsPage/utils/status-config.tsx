export const statusConfig: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  pending: {
    label: "Pendente",
    cls: "border-warning/25 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  completed: {
    label: "Completa",
    cls: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
  failed: {
    label: "Falhou",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  cancelled: {
    label: "Cancelada",
    cls: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  refunded: {
    label: "Reembolsado",
    cls: "border-warning/25 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  chargeback: {
    label: "Chargeback",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export function statusBadge(status: string) {
  const s = statusConfig[status] || {
    label: status,
    cls: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
