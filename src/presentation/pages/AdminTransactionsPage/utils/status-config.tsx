export const statusConfig: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  pending: {
    label: "Pendente",
    cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    dot: "bg-yellow-500",
  },
  completed: {
    label: "Completa",
    cls: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  failed: {
    label: "Falhou",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  cancelled: {
    label: "Cancelada",
    cls: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/40",
  },
  refunded: {
    label: "Reembolsado",
    cls: "bg-orange-500/10 text-orange-600 border-orange-200",
    dot: "bg-orange-500",
  },
  chargeback: {
    label: "Chargeback",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};

export function statusBadge(status: string) {
  const s = statusConfig[status] || {
    label: status,
    cls: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium border ${s.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
