import useAdminRefundsQuery from "@/presentation/hooks/use-admin-refunds-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import ModalPortal from "@/presentation/components/ModalPortal";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { Check, Clock, Loader2, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TRefundStatus = "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<
  TRefundStatus,
  { label: string; cls: string; icon: typeof Clock; color: string; bg: string }
> = {
  pending: {
    label: "Pendente",
    cls: "border-warning/25 bg-warning/10 text-warning",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  approved: {
    label: "Aprovado",
    cls: "border-success/25 bg-success/10 text-success",
    icon: Check,
    color: "text-success",
    bg: "bg-success/10",
  },
  rejected: {
    label: "Rejeitado",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
    icon: X,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

function activeSurface(status: string) {
  if (status === "pending") return "border-warning/45 !bg-warning/20";
  if (status === "approved") return "border-success/45 !bg-success/20";
  return "border-destructive/45 !bg-destructive/20";
}

export default function AdminRefunds() {
  const apiService = useApiService();
  const { data: refunds, isLoading, invalidateQuery } = useAdminRefundsQuery();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{
    id: string;
    action: "approved" | "rejected";
  } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const handleAction = async () => {
    if (!noteModal) return;
    setActionLoading(noteModal.id);

    try {
      await apiService.modules.adminFinance.reviewRefundRequest(
        Number(noteModal.id),
        {
          status: noteModal.action,
          adminNote: adminNote || null,
        },
      );
      toast.success(
        noteModal.action === "approved"
          ? "Reembolso aprovado"
          : "Reembolso rejeitado",
      );
      await invalidateQuery();
    } catch {
      toast.error("Erro ao processar reembolso");
    }
    setActionLoading(null);
    setNoteModal(null);
    setAdminNote("");
  };

  const filtered = useMemo(
    () =>
      filterStatus
        ? refunds.filter((r) => r.status === filterStatus)
        : refunds,
    [refunds, filterStatus],
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);

  const pendingCount = refunds.filter((r) => r.status === "pending").length;
  const approvedCount = refunds.filter((r) => r.status === "approved").length;
  const rejectedCount = refunds.filter((r) => r.status === "rejected").length;

  const stats = [
    {
      label: "Pendentes",
      count: pendingCount,
      filterVal: "pending" as const,
      ...STATUS_CONFIG.pending,
    },
    {
      label: "Aprovados",
      count: approvedCount,
      filterVal: "approved" as const,
      ...STATUS_CONFIG.approved,
    },
    {
      label: "Rejeitados",
      count: rejectedCount,
      filterVal: "rejected" as const,
      ...STATUS_CONFIG.rejected,
    },
  ];

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 animate-fade-in">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Financeiro
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
            Reembolsos
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gerencie as solicitações de reembolso dos produtores.
          </p>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => {
            const isActive = filterStatus === s.filterVal;
            return (
              <button
                key={s.label}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  setFilterStatus((prev) =>
                    prev === s.filterVal ? "" : s.filterVal,
                  )
                }
                className={cn(
                  "admin-surface admin-surface-interactive p-3.5 text-left",
                  isActive && activeSurface(s.filterVal),
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
                    isActive ? "bg-black/20" : s.bg,
                    s.color,
                  )}
                >
                  <s.icon size={16} />
                </div>
                <p className="text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
                  {s.count}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-xs leading-tight",
                    isActive
                      ? cn("font-semibold", s.color)
                      : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </p>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-surface px-6 py-16 text-center">
            <RotateCcw className="mx-auto mb-3 text-muted-foreground" size={24} />
            <p className="mb-1 text-base font-semibold text-foreground">
              Nenhum reembolso
            </p>
            <p className="text-sm text-muted-foreground">
              {filterStatus
                ? "Nenhuma solicitação encontrada para este filtro."
                : "As solicitações de reembolso aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((refund) => {
              const sc = STATUS_CONFIG[refund.status];
              return (
                <div key={refund.id} className="admin-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold",
                            sc.cls,
                          )}
                        >
                          <sc.icon size={12} />
                          {sc.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(refund.created_at).toLocaleDateString(
                            "pt-BR",
                          )}{" "}
                          às{" "}
                          {new Date(refund.created_at).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>

                      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <p className="mb-0.5 text-sm text-muted-foreground">
                            Cliente
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {refund.transaction?.customer_name || "—"}
                          </p>
                          {refund.transaction?.customer_email && (
                            <p className="text-sm text-muted-foreground">
                              {refund.transaction.customer_email}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="mb-0.5 text-sm text-muted-foreground">
                            Produtor
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {refund.seller_profile?.full_name ||
                              refund.seller_profile?.account_id ||
                              "—"}
                          </p>
                          {refund.seller_profile?.email && (
                            <p className="text-sm text-muted-foreground">
                              {refund.seller_profile.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="mb-0.5 text-sm text-muted-foreground">
                            Valor do reembolso
                          </p>
                          <p className="text-base font-bold tabular-nums text-foreground">
                            {formatCurrency(refund.amount)}
                          </p>
                          {refund.transaction && (
                            <p className="text-sm text-muted-foreground">
                              de {formatCurrency(refund.transaction.amount)} (
                              {refund.transaction.method.toUpperCase()})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          Motivo
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">
                          {refund.reason}
                        </p>
                      </div>

                      {refund.admin_note && (
                        <div className="mt-2 rounded-xl border border-primary/25 bg-primary/10 p-3.5">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            Nota do admin
                          </p>
                          <p className="text-sm leading-relaxed text-foreground">
                            {refund.admin_note}
                          </p>
                        </div>
                      )}
                    </div>

                    {refund.status === "pending" && (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => {
                            setNoteModal({
                              id: refund.id,
                              action: "approved",
                            });
                            setAdminNote("");
                          }}
                          disabled={actionLoading === refund.id}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          <Check size={14} />
                          Aprovar
                        </button>
                        <button
                          onClick={() => {
                            setNoteModal({
                              id: refund.id,
                              action: "rejected",
                            });
                            setAdminNote("");
                          }}
                          disabled={actionLoading === refund.id}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                        >
                          <X size={14} />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {noteModal && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
              onClick={() => setNoteModal(null)}
            >
              <div
                className="liquid-glass-control w-full max-w-md animate-fade-in rounded-[22px] p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
              <h3 className="mb-1 text-lg font-bold tracking-tight text-foreground">
                {noteModal.action === "approved"
                  ? "Aprovar reembolso"
                  : "Rejeitar reembolso"}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {noteModal.action === "approved"
                  ? "O valor será devolvido ao cliente e a transação marcada como reembolsada."
                  : "A solicitação será rejeitada e o produtor será notificado."}
              </p>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Nota (opcional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Adicione uma observação..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setNoteModal(null)}
                  className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAction}
                  disabled={!!actionLoading}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-opacity disabled:opacity-50",
                    noteModal.action === "approved"
                      ? "bg-white text-[#0F0617] hover:opacity-90"
                      : "bg-destructive text-destructive-foreground hover:opacity-90",
                  )}
                >
                  {actionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : noteModal.action === "approved" ? (
                    <Check size={14} />
                  ) : (
                    <X size={14} />
                  )}
                  {noteModal.action === "approved"
                    ? "Confirmar aprovação"
                    : "Confirmar rejeição"}
                </button>
              </div>
            </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </AdminLayout>
  );
}
