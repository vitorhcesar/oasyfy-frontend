import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  Landmark,
  Send,
  User,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApprovalModalData } from "../types/admin-withdrawal.type";
import { formatCurrency } from "../utils/format-currency";
import { statusBadge } from "../utils/status-config";

interface AdminWithdrawalApprovalDialogProps {
  approvalModal: ApprovalModalData;
  modalLoading: boolean;
  actionLoading: string | null;
  onApprovalModalChange: (data: ApprovalModalData) => void;
  onActionLoadingChange: (id: string | null) => void;
  onSuccess: () => void;
}

export default function AdminWithdrawalApprovalDialog({
  approvalModal,
  modalLoading,
  actionLoading,
  onApprovalModalChange,
  onActionLoadingChange,
  onSuccess,
}: AdminWithdrawalApprovalDialogProps) {
  const apiService = useApiService();
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [modalTab, setModalTab] = useState<"info" | "history">("info");

  const handleClose = () => {
    onApprovalModalChange(null);
    setShowDenyInput(false);
    setDenyReason("");
    setModalTab("info");
  };

  const handleApprove = async (type: "manual" | "api") => {
    if (!approvalModal) return;
    onActionLoadingChange(approvalModal.withdrawal.id);

    const bd = approvalModal.bankData;
    const pixKey = bd?.pixKey || bd?.pix_key || null;
    const bankName = bd?.bankName || bd?.bank_name || null;

    try {
      await apiService.modules.adminFinance.approveWithdrawal(
        Number(approvalModal.withdrawal.id),
        {
          type,
          feeAmount: approvalModal.withdrawalFee,
          pixKey,
          bankName,
        },
      );
      toast.success(
        type === "manual"
          ? "Saque aprovado manualmente"
          : "Saque enviado para API",
      );
      handleClose();
      onSuccess();
    } catch {
      toast.error("Erro ao processar");
    }
    onActionLoadingChange(null);
  };

  const handleDeny = async () => {
    if (!approvalModal || !denyReason.trim()) {
      toast.error("Informe o motivo");
      return;
    }
    onActionLoadingChange(approvalModal.withdrawal.id);
    try {
      await apiService.modules.adminFinance.denyWithdrawal(
        Number(approvalModal.withdrawal.id),
        {
          reason: denyReason.trim(),
          feeAmount: approvalModal.withdrawalFee,
        },
      );
      toast.success("Saque negado");
      handleClose();
      onSuccess();
    } catch {
      toast.error("Erro ao negar saque");
    }
    onActionLoadingChange(null);
  };

  return (
    <Dialog
      open={!!approvalModal}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-xl gap-0 overflow-y-auto border-border/60 bg-background p-0">
        <DialogHeader className="border-b border-border/50 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ArrowUpRight size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Aprovar Saque
                </DialogTitle>
                {approvalModal && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {formatCurrency(approvalModal.withdrawal.amount)} ·{" "}
                    {approvalModal.withdrawal.seller_name || "—"}
                  </p>
                )}
              </div>
            </div>
            {approvalModal && (
              <div className="flex-shrink-0">
                {statusBadge(approvalModal.withdrawal.status)}
              </div>
            )}
          </div>
        </DialogHeader>

        {approvalModal && (
          <div className="px-6 pb-6">
            <div className="liquid-glass-control mb-5 mt-4 flex gap-0.5 rounded-2xl p-1">
              <button
                onClick={() => setModalTab("info")}
                className={cn(
                  "flex-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                  modalTab === "info"
                    ? "bg-white text-[#0F0617] shadow-sm"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                )}
              >
                Informações
              </button>
              <button
                onClick={() => setModalTab("history")}
                className={cn(
                  "flex-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                  modalTab === "history"
                    ? "bg-white text-[#0F0617] shadow-sm"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                )}
              >
                Logs
              </button>
            </div>

            {modalTab === "info" ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Produtor
                    </p>
                  </div>
                  <p className="text-base font-semibold text-foreground">
                    {approvalModal.withdrawal.seller_name || "—"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {approvalModal.withdrawal.seller_email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {approvalModal.accountId && (
                      <span>
                        ID:{" "}
                        <span className="font-mono text-foreground">
                          {approvalModal.accountId}
                        </span>
                      </span>
                    )}
                    {approvalModal.cpf && (
                      <span>
                        CPF:{" "}
                        <span className="font-mono text-foreground">
                          {approvalModal.cpf}
                        </span>
                      </span>
                    )}
                    {approvalModal.cnpj && (
                      <span>
                        CNPJ:{" "}
                        <span className="font-mono text-foreground">
                          {approvalModal.cnpj}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Landmark size={14} className="text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Dados Bancários
                    </p>
                  </div>
                  {modalLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Carregando...
                    </p>
                  ) : approvalModal.bankData ? (
                    (() => {
                      const b = approvalModal.bankData!;
                      const bankName = b.bankName || b.bank_name || "";
                      const agency = b.agency || "";
                      const agencyDigit = b.agencyDigit || "";
                      const account = b.account || "";
                      const accountDigit = b.accountDigit || "";
                      const accountType = b.accountType || b.account_type || "";
                      const pixKey = b.pixKey || b.pix_key || "";
                      const pixKeyType = b.pixKeyType || b.pix_key_type || "";
                      const maskedAccount =
                        account.length > 4
                          ? `••${account.slice(-4)}`
                          : account;
                      return (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            {bankName && (
                              <span className="text-xs font-semibold text-foreground capitalize">
                                {bankName}
                              </span>
                            )}
                            {agency && (
                              <span className="text-xs text-muted-foreground">
                                Ag:{" "}
                                <span className="font-mono text-foreground/80">
                                  {agency}
                                  {agencyDigit ? `-${agencyDigit}` : ""}
                                </span>
                              </span>
                            )}
                            {account && (
                              <span className="text-xs text-muted-foreground">
                                Cc:{" "}
                                <span className="font-mono text-foreground/80">
                                  {maskedAccount}
                                  {accountDigit ? `-${accountDigit}` : ""}
                                </span>
                              </span>
                            )}
                            {accountType && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-background border border-border/50 text-muted-foreground uppercase font-medium">
                                {accountType}
                              </span>
                            )}
                          </div>
                          {pixKey && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                              <span className="text-xs text-primary font-bold uppercase tracking-wider">
                                PIX{pixKeyType && ` · ${pixKeyType}`}
                              </span>
                              <span className="text-xs font-mono font-semibold text-foreground break-all">
                                {pixKey}
                              </span>
                            </div>
                          )}
                          {b.holder_name && (
                            <p className="text-xs text-muted-foreground">
                              Titular:{" "}
                              <span className="text-foreground/80">
                                {b.holder_name}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum dado bancário cadastrado
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Globe size={14} className="text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        IPs Autorizados
                      </p>
                    </div>
                    {approvalModal.sellerIps.length > 0 ? (
                      <div className="space-y-1">
                        {approvalModal.sellerIps.map((ip, i) => (
                          <p
                            key={i}
                            className="font-mono text-sm text-foreground"
                          >
                            {ip}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum IP
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Wallet size={14} className="text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Saldo
                      </p>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Atual</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatCurrency(approvalModal.balance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Saque</span>
                        <span className="font-semibold tabular-nums text-destructive">
                          -{formatCurrency(approvalModal.withdrawal.amount)}
                        </span>
                      </div>
                      {approvalModal.withdrawalFee > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Taxa</span>
                          <span className="font-semibold tabular-nums text-destructive">
                            -{formatCurrency(approvalModal.withdrawalFee)}
                          </span>
                        </div>
                      )}
                      <div className="my-1 h-px bg-border/50" />
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-muted-foreground">
                          Após
                        </span>
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            approvalModal.balance +
                              approvalModal.withdrawal.amount -
                              approvalModal.withdrawalFee >=
                              0
                              ? "text-success"
                              : "text-destructive",
                          )}
                        >
                          {formatCurrency(
                            approvalModal.balance +
                              approvalModal.withdrawal.amount -
                              approvalModal.withdrawalFee,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Detalhes do Saque
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="mb-0.5 text-muted-foreground">Valor</p>
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(approvalModal.withdrawal.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-muted-foreground">Data</p>
                      <p className="font-medium text-foreground">
                        {format(
                          new Date(approvalModal.withdrawal.created_at),
                          "dd/MM/yy 'às' HH:mm",
                          { locale: ptBR },
                        )}
                      </p>
                    </div>
                    {approvalModal.withdrawal.description && (
                      <div className="col-span-2">
                        <p className="mb-0.5 text-muted-foreground">
                          Descrição
                        </p>
                        <p className="text-foreground">
                          {approvalModal.withdrawal.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {(approvalModal.withdrawal.status === "pending" ||
                  approvalModal.withdrawal.status === "transferring") && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Ação
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleApprove("manual")}
                        disabled={!!actionLoading}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-transparent bg-white p-4 text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <CheckCircle size={20} />
                        <span className="text-sm font-semibold">
                          Aprovar Manual
                        </span>
                        <span className="text-center text-xs text-[#0F0617]/70">
                          Marca como aprovado sem enviar via API
                        </span>
                      </button>
                      <button
                        onClick={() => handleApprove("api")}
                        disabled={!!actionLoading}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 transition-colors hover:bg-primary/20 disabled:opacity-50"
                      >
                        <Zap size={20} className="text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          Aprovar via API
                        </span>
                        <span className="text-center text-xs text-muted-foreground">
                          Envia para processamento automático
                        </span>
                      </button>
                    </div>
                    {!showDenyInput ? (
                      <button
                        onClick={() => setShowDenyInput(true)}
                        disabled={!!actionLoading}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                      >
                        <XCircle size={14} /> Negar Saque
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={denyReason}
                          onChange={(e) => setDenyReason(e.target.value)}
                          placeholder="Informe o motivo da negação..."
                          className="w-full resize-none rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowDenyInput(false);
                              setDenyReason("");
                            }}
                            className="h-10 flex-1 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Voltar
                          </button>
                          <button
                            onClick={handleDeny}
                            disabled={!!actionLoading || !denyReason.trim()}
                            className="h-10 flex-1 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            Confirmar Negação
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative mt-2 max-h-[450px] overflow-y-auto pr-1">
                {(() => {
                  const currentMeta =
                    (approvalModal.withdrawal as { metadata?: { logs?: unknown[] } })
                      .metadata || {};
                  const currentLogs: unknown[] = Array.isArray(currentMeta.logs)
                    ? currentMeta.logs
                    : [];

                  const eventLabels: Record<string, string> = {
                    created: "Saque solicitado",
                    approved_manual: "Aprovado manualmente",
                    sent_to_api: "Enviado para API",
                    api_success: "Transferência realizada",
                    api_error: "Erro na transferência",
                    denied: "Saque negado",
                    retry: "Tentativa de reenvio",
                  };

                  const entries: Array<{
                    key: string;
                    event: string;
                    timestamp?: string;
                    approval_type?: string;
                    denial_reason?: string;
                    error?: string;
                    api_response?: unknown;
                    withdrawal_fee?: number;
                  }> = [
                    {
                      key: "created",
                      event: "created",
                      timestamp: approvalModal.withdrawal.created_at,
                    },
                    ...currentLogs.map((log, i) => {
                      const entry = log as Record<string, unknown>;
                      return {
                        ...entry,
                        key: `log-${i}`,
                        event: String(entry.event ?? ""),
                      };
                    }),
                  ];

                  return entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Nenhum log encontrado
                    </p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[15px] top-4 bottom-4 w-[3px] bg-border/40 rounded-full" />
                      <div className="space-y-0">
                        {entries.map((entry) => {
                          const evtSuccess =
                            entry.event === "approved_manual" ||
                            entry.event === "api_success";
                          const evtFailed =
                            entry.event === "denied" ||
                            entry.event === "api_error";

                          return (
                            <div
                              key={entry.key}
                              className="relative flex gap-3 pb-2"
                            >
                              <div className="relative z-10 flex-shrink-0 mt-0.5">
                                <div
                                  className={cn(
                                    "w-[30px] h-[30px] rounded-full flex items-center justify-center border-2",
                                    evtSuccess
                                      ? "bg-primary/10 border-primary text-primary"
                                      : evtFailed
                                        ? "bg-destructive/10 border-destructive text-destructive"
                                        : "bg-muted border-border text-muted-foreground",
                                  )}
                                >
                                  {evtSuccess ? (
                                    <CheckCircle size={14} />
                                  ) : evtFailed ? (
                                    <XCircle size={14} />
                                  ) : entry.event === "sent_to_api" ||
                                    entry.event === "retry" ? (
                                    <Send size={14} />
                                  ) : (
                                    <Clock size={14} />
                                  )}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "flex-1 rounded-lg border p-3 space-y-1",
                                  evtSuccess
                                    ? "border-primary/20 bg-primary/[0.02]"
                                    : evtFailed
                                      ? "border-destructive/20 bg-destructive/[0.02]"
                                      : "border-border/30 bg-muted/5",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={cn(
                                      "text-sm font-semibold",
                                      evtSuccess
                                        ? "text-primary"
                                        : evtFailed
                                          ? "text-destructive"
                                          : "text-foreground",
                                    )}
                                  >
                                    {eventLabels[entry.event] || entry.event}
                                  </span>
                                  {entry.timestamp && (
                                    <span className="text-xs text-muted-foreground/60">
                                      {format(
                                        new Date(entry.timestamp),
                                        "dd/MM/yyyy - HH:mm:ss",
                                        { locale: ptBR },
                                      )}
                                    </span>
                                  )}
                                </div>
                                {entry.approval_type && (
                                  <p className="text-xs text-muted-foreground">
                                    Via:{" "}
                                    <span className="font-medium text-foreground">
                                      {entry.approval_type === "manual"
                                        ? "Aprovação Manual"
                                        : "API Automática"}
                                    </span>
                                  </p>
                                )}
                                {entry.denial_reason && (
                                  <p className="text-xs text-destructive">
                                    Motivo:{" "}
                                    <span className="font-medium">
                                      {entry.denial_reason}
                                    </span>
                                  </p>
                                )}
                                {entry.error && (
                                  <p className="text-xs text-destructive">
                                    Erro:{" "}
                                    <span className="font-medium">
                                      {entry.error}
                                    </span>
                                  </p>
                                )}
                                {entry.api_response != null && (
                                  <div className="mt-1">
                                    <p className="text-sm text-muted-foreground mb-0.5">
                                      Retorno da adquirente:
                                    </p>
                                    <div className="px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/30">
                                      <p className="text-xs font-mono text-foreground break-all leading-relaxed">
                                        {typeof entry.api_response === "string"
                                          ? entry.api_response
                                          : JSON.stringify(entry.api_response)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {entry.withdrawal_fee &&
                                  entry.withdrawal_fee > 0 &&
                                  entry.event !== "created" && (
                                    <p className="text-xs text-muted-foreground">
                                      Taxa descontada:{" "}
                                      <span className="font-medium text-foreground">
                                        {formatCurrency(entry.withdrawal_fee)}
                                      </span>
                                    </p>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
