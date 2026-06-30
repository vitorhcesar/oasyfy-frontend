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
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-foreground">
                  Aprovar Saque
                </DialogTitle>
                {approvalModal && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
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
            <div className="flex gap-1 border-b border-border/40 -mx-6 px-6 mb-5">
              <button
                onClick={() => setModalTab("info")}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium transition-colors relative",
                  modalTab === "info"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Informações
                {modalTab === "info" && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                )}
              </button>
              <button
                onClick={() => setModalTab("history")}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium transition-colors relative",
                  modalTab === "history"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Logs
                {modalTab === "history" && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                )}
              </button>
            </div>

            {modalTab === "info" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={13} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Produtor
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {approvalModal.withdrawal.seller_name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {approvalModal.withdrawal.seller_email}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                    {approvalModal.accountId && (
                      <span>
                        ID:{" "}
                        <span className="font-mono text-foreground/80">
                          {approvalModal.accountId}
                        </span>
                      </span>
                    )}
                    {approvalModal.cpf && (
                      <span>
                        CPF:{" "}
                        <span className="font-mono text-foreground/80">
                          {approvalModal.cpf}
                        </span>
                      </span>
                    )}
                    {approvalModal.cnpj && (
                      <span>
                        CNPJ:{" "}
                        <span className="font-mono text-foreground/80">
                          {approvalModal.cnpj}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark size={13} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
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
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border/50 text-muted-foreground uppercase font-medium">
                                {accountType}
                              </span>
                            )}
                          </div>
                          {pixKey && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
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
                    <p className="text-xs text-muted-foreground/60">
                      Nenhum dado bancário cadastrado
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe size={13} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        IPs Autorizados
                      </p>
                    </div>
                    {approvalModal.sellerIps.length > 0 ? (
                      <div className="space-y-1">
                        {approvalModal.sellerIps.map((ip, i) => (
                          <p
                            key={i}
                            className="text-xs font-mono text-foreground"
                          >
                            {ip}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50">
                        Nenhum IP
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet size={13} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Saldo
                      </p>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Atual</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(approvalModal.balance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Saque</span>
                        <span className="font-semibold text-destructive">
                          -{formatCurrency(approvalModal.withdrawal.amount)}
                        </span>
                      </div>
                      {approvalModal.withdrawalFee > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Taxa</span>
                          <span className="font-semibold text-destructive">
                            -{formatCurrency(approvalModal.withdrawalFee)}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-border/50 my-1" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">
                          Após
                        </span>
                        <span
                          className={cn(
                            "font-bold",
                            approvalModal.balance +
                              approvalModal.withdrawal.amount -
                              approvalModal.withdrawalFee >=
                              0
                              ? "text-primary"
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

                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={13} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Detalhes do Saque
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Valor</p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(approvalModal.withdrawal.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Data</p>
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
                        <p className="text-muted-foreground mb-0.5">
                          Descrição
                        </p>
                        <p className="text-foreground">
                          {approvalModal.withdrawal.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border/30" />

                {(approvalModal.withdrawal.status === "pending" ||
                  approvalModal.withdrawal.status === "transferring") && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Ação
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleApprove("manual")}
                        disabled={!!actionLoading}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={20} className="text-primary" />
                        <span className="text-xs font-semibold text-primary">
                          Aprovar Manual
                        </span>
                        <span className="text-xs text-muted-foreground text-center">
                          Marca como aprovado sem enviar via API
                        </span>
                      </button>
                      <button
                        onClick={() => handleApprove("api")}
                        disabled={!!actionLoading}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all disabled:opacity-50"
                      >
                        <Zap size={20} className="text-blue-500" />
                        <span className="text-xs font-semibold text-blue-500">
                          Aprovar via API
                        </span>
                        <span className="text-xs text-muted-foreground text-center">
                          Envia para processamento automático
                        </span>
                      </button>
                    </div>
                    {!showDenyInput ? (
                      <button
                        onClick={() => setShowDenyInput(true)}
                        disabled={!!actionLoading}
                        className="w-full px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors border border-destructive/20 disabled:opacity-50"
                      >
                        <XCircle size={12} className="inline mr-1" /> Negar
                        Saque
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={denyReason}
                          onChange={(e) => setDenyReason(e.target.value)}
                          placeholder="Informe o motivo da negação..."
                          className="w-full px-3 py-2 rounded-lg border border-destructive/20 bg-destructive/5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-destructive/30 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowDenyInput(false);
                              setDenyReason("");
                            }}
                            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
                          >
                            Voltar
                          </button>
                          <button
                            onClick={handleDeny}
                            disabled={!!actionLoading || !denyReason.trim()}
                            className="flex-1 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
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
                                      "text-[12px] font-semibold",
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
                                    <p className="text-[11px] text-muted-foreground mb-0.5">
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
