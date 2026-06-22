import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { Check, Clock, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RefundRequest = {
  id: string;
  transaction_id: string;
  seller_id: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  transaction?: {
    customer_name: string;
    customer_email: string | null;
    method: string;
    amount: number;
  };
  seller_profile?: {
    full_name: string | null;
    account_id: string;
    email?: string | null;
  };
};

export default function AdminRefunds() {
  const apiService = useApiService();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{
    id: string;
    action: "approved" | "rejected";
  } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const data = await apiService.modules.adminFinance.listRefundRequests();
      setRefunds(data as RefundRequest[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

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
      fetchRefunds();
    } catch {
      toast.error("Erro ao processar reembolso");
    }
    setActionLoading(null);
    setNoteModal(null);
    setAdminNote("");
  };

  const filtered = filterStatus
    ? refunds.filter((r) => r.status === filterStatus)
    : refunds;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);

  const pendingCount = refunds.filter((r) => r.status === "pending").length;
  const approvedCount = refunds.filter((r) => r.status === "approved").length;
  const rejectedCount = refunds.filter((r) => r.status === "rejected").length;

  const statusConfig: Record<
    string,
    { label: string; cls: string; icon: typeof Clock }
  > = {
    pending: {
      label: "Pendente",
      cls: "text-yellow-600 bg-yellow-500/10 border-yellow-200",
      icon: Clock,
    },
    approved: {
      label: "Aprovado",
      cls: "text-primary bg-primary/10 border-primary/20",
      icon: Check,
    },
    rejected: {
      label: "Rejeitado",
      cls: "text-destructive bg-destructive/10 border-destructive/20",
      icon: X,
    },
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Reembolsos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as solicitações de reembolso dos produtores
          </p>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-3 gap-3 mb-6 animate-fade-in"
          style={{ animationDelay: "50ms" }}
        >
          {[
            {
              label: "Pendentes",
              count: pendingCount,
              color: "text-yellow-600",
              bg: "bg-yellow-500/10",
              icon: Clock,
              filterVal: "pending",
            },
            {
              label: "Aprovados",
              count: approvedCount,
              color: "text-primary",
              bg: "bg-primary/10",
              icon: Check,
              filterVal: "approved",
            },
            {
              label: "Rejeitados",
              count: rejectedCount,
              color: "text-destructive",
              bg: "bg-destructive/10",
              icon: X,
              filterVal: "rejected",
            },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() =>
                setFilterStatus((prev) =>
                  prev === s.filterVal ? "" : s.filterVal,
                )
              }
              className={cn(
                "p-4 rounded-xl bg-card border text-left transition-all hover:shadow-sm",
                filterStatus === s.filterVal
                  ? "border-border ring-1 ring-primary/20"
                  : "border-border/40",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    s.bg,
                  )}
                >
                  <s.icon size={14} className={s.color} />
                </div>
                <span className="text-xs md:text-sm font-medium text-muted-foreground">
                  {s.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.count}</p>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-muted" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <RotateCcw className="text-muted-foreground/40" size={24} />
            </div>
            <p className="text-foreground font-semibold mb-1">
              Nenhum reembolso
            </p>
            <p className="text-sm text-muted-foreground">
              As solicitações de reembolso aparecerão aqui.
            </p>
          </div>
        ) : (
          <div
            className="space-y-3 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {filtered.map((refund, i) => {
              const sc = statusConfig[refund.status];
              return (
                <div
                  key={refund.id}
                  className="rounded-xl bg-card border border-border/40 p-5 hover:border-border/70 transition-all animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium border",
                            sc.cls,
                          )}
                        >
                          <sc.icon size={10} />
                          {sc.label}
                        </span>
                        <span className="text-xs text-muted-foreground/50">
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground/50 mb-0.5">
                            Cliente
                          </p>
                          <p className="text-[13px] font-medium text-foreground">
                            {refund.transaction?.customer_name || "—"}
                          </p>
                          {refund.transaction?.customer_email && (
                            <p className="text-xs text-muted-foreground/60">
                              {refund.transaction.customer_email}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground/50 mb-0.5">
                            Produtor
                          </p>
                          <p className="text-[13px] font-medium text-foreground">
                            {refund.seller_profile?.full_name ||
                              refund.seller_profile?.account_id ||
                              "—"}
                          </p>
                          {refund.seller_profile?.email && (
                            <p className="text-xs text-muted-foreground/60">
                              {refund.seller_profile.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground/50 mb-0.5">
                            Valor do reembolso
                          </p>
                          <p className="text-[13px] font-bold text-foreground">
                            {formatCurrency(refund.amount)}
                          </p>
                          {refund.transaction && (
                            <p className="text-xs text-muted-foreground/60">
                              de {formatCurrency(refund.transaction.amount)} (
                              {refund.transaction.method.toUpperCase()})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-muted/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground/50 mb-1">
                          Motivo
                        </p>
                        <p className="text-[12px] text-foreground leading-relaxed">
                          {refund.reason}
                        </p>
                      </div>

                      {refund.admin_note && (
                        <div className="mt-2 bg-primary/5 rounded-lg p-3 border border-primary/10">
                          <p className="text-xs text-primary/60 mb-1">
                            Nota do admin
                          </p>
                          <p className="text-[12px] text-foreground leading-relaxed">
                            {refund.admin_note}
                          </p>
                        </div>
                      )}
                    </div>

                    {refund.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setNoteModal({ id: refund.id, action: "approved" });
                            setAdminNote("");
                          }}
                          disabled={actionLoading === refund.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <Check size={12} />
                          Aprovar
                        </button>
                        <button
                          onClick={() => {
                            setNoteModal({ id: refund.id, action: "rejected" });
                            setAdminNote("");
                          }}
                          disabled={actionLoading === refund.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-xs md:text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                          <X size={12} />
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

        {/* Note Modal */}
        {noteModal && (
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setNoteModal(null)}
          >
            <div
              className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-md p-6 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-foreground mb-1">
                {noteModal.action === "approved"
                  ? "Aprovar reembolso"
                  : "Rejeitar reembolso"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {noteModal.action === "approved"
                  ? "O valor será devolvido ao cliente e a transação marcada como reembolsada."
                  : "A solicitação será rejeitada e o produtor será notificado."}
              </p>

              <div className="mb-4">
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1.5 block">
                  Nota (opcional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Adicione uma observação..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setNoteModal(null)}
                  className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAction}
                  disabled={!!actionLoading}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50",
                    noteModal.action === "approved"
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-destructive text-destructive-foreground hover:opacity-90",
                  )}
                >
                  {actionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
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
        )}
      </div>
    </AdminLayout>
  );
}
