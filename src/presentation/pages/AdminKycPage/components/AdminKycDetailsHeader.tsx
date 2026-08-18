import DeleteSellerAccountModal from "@/presentation/components/admin/DeleteSellerAccountModal";
import { ConfirmationModal } from "@/presentation/components/ConfirmationModal";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  Ban,
  CheckCircle,
  ChevronDown,
  Code2,
  Copy,
  Loader2,
  Lock,
  Mail,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  MessagesSquare,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminKycDetailsStore } from "../stores/admin-kyc-details.store";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";
import { effectiveKycStatus } from "../utils/effective-kyc-status.util";
import { isPendingEmailVerification } from "../utils/is-pending-email-verification.util";
import { statusBadgeClasses } from "../utils/status-badge-classes.util";
import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";

interface IAdminKycDetailsHeaderProps {
  submission: IKycSubmissionView;
  onUpdate: () => void;
  onDeleted: () => void;
}

export function AdminKycDetailsHeader({
  submission,
  onUpdate,
  onDeleted,
}: IAdminKycDetailsHeaderProps) {
  const apiService = useApiService();

  const { actionsOpen, setActionsOpen } = useAdminKycDetailsStore();

  const [manualEmailApprovalLoading, setManualEmailApprovalLoading] =
    useState(false);
  const [sendVerificationLoading, setSendVerificationLoading] = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [apiAccessLoading, setApiAccessLoading] = useState(false);
  const [pracaAccessEnabled, setPracaAccessEnabled] = useState(false);
  const [pracaAccessLoading, setPracaAccessLoading] = useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const overallStatus = effectiveKycStatus(submission);

  const pendingEmailVerification = isPendingEmailVerification(submission);

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleManualEmailApproval = async () => {
    if (!submission.email) {
      toast.error("Seller sem e-mail cadastrado");
      return;
    }

    setManualEmailApprovalLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.seller.approveAndNotify({
          userId: Number(submission.user_id),
          sellerEmail: submission.email!,
          sellerName: submission.full_name,
        });

        toast.success("E-mail aprovado manualmente");
        setActionsOpen(false);
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao aprovar e-mail",
        finallyFn: () => {
          setManualEmailApprovalLoading(false);
        },
      },
    );
  };

  const handleSendSignupVerification = async () => {
    if (!submission.email) {
      toast.error("Seller sem e-mail cadastrado");
      return;
    }

    setSendVerificationLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.email.sendSignupVerificationCode(
          submission.email!,
        );
        toast.success("Código de confirmação enviado");
        setActionsOpen(false);
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao enviar código de confirmação",
        finallyFn: () => {
          setSendVerificationLoading(false);
        },
      },
    );
  };

  const handleToggleBan = async () => {
    setActionsOpen(false);
    setBanLoading(true);

    await tryOrToastError(
      async () => {
        const result = await apiService.modules.adminKycSubmissions.toggleBan(
          Number(submission.id),
        );

        toast.success(
          result.isBanned ? "Seller banido" : "Seller desbanido",
        );
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao atualizar banimento",
        finallyFn: () => setBanLoading(false),
      },
    );
  };

  const handleToggleWithdrawalsBlock = async () => {
    setActionsOpen(false);

    if (submission.withdrawals_blocked) {
      setWithdrawalsLoading(true);

      await tryOrToastError(
        async () => {
          await apiService.modules.adminSellers.unblockWithdrawals(
            Number(submission.user_id),
          );
          toast.success("Saque liberado");
          onUpdate();
        },
        {
          defaultErrorMessage: "Erro ao liberar saque",
          finallyFn: () => setWithdrawalsLoading(false),
        },
      );
      return;
    }

    setBlockReason("");
    setShowBlockReasonModal(true);
  };

  const handleBlockWithdrawals = async () => {
    const reason = blockReason.trim();
    if (reason.length < 5) {
      throw new Error("Informe um motivo com pelo menos 5 caracteres");
    }

    await apiService.modules.adminSellers.blockWithdrawals(
      Number(submission.user_id),
      { reason },
    );
    toast.success("Saque travado");
    setBlockReason("");
    onUpdate();
  };

  const handleToggleApiAccess = async () => {
    if (!submission.id) {
      toast.error("Seller ainda sem submissão KYC");
      return;
    }

    const nextEnabled = !submission.api_access_enabled;
    if (
      !nextEnabled &&
      !window.confirm(
        "Revogar o acesso à API? Integrações em produção param imediatamente.",
      )
    ) {
      setActionsOpen(false);
      return;
    }

    setActionsOpen(false);
    setApiAccessLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminKycSubmissions.setApiAccess(
          Number(submission.id),
          { enabled: nextEnabled },
        );
        toast.success(
          nextEnabled ? "Acesso à API liberado" : "Acesso à API revogado",
        );
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao atualizar acesso à API",
        finallyFn: () => setApiAccessLoading(false),
      },
    );
  };

  useEffect(() => {
    const sellerId = Number(submission.user_id);
    if (!Number.isFinite(sellerId) || sellerId <= 0) return;
    let cancelled = false;
    void apiService.modules.adminSellers
      .getSellerProfile(sellerId)
      .then((profile) => {
        if (!cancelled) {
          setPracaAccessEnabled(profile.praca?.enabled === true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [apiService, submission.user_id]);

  const handleTogglePracaAccess = async () => {
    const sellerId = Number(submission.user_id);
    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      toast.error("Seller inválido");
      return;
    }

    const nextEnabled = !pracaAccessEnabled;
    if (
      !nextEnabled &&
      !window.confirm(
        "Revogar A Praça? Todas as mensagens deste seller no canal serão apagadas.",
      )
    ) {
      setActionsOpen(false);
      return;
    }

    setActionsOpen(false);
    setPracaAccessLoading(true);

    await tryOrToastError(
      async () => {
        const result = await apiService.modules.adminSellers.setPracaAccess(
          sellerId,
          nextEnabled,
        );
        setPracaAccessEnabled(result.enabled);
        toast.success(
          nextEnabled ? "A Praça liberada" : "A Praça revogada",
        );
      },
      {
        defaultErrorMessage: "Erro ao atualizar A Praça",
        finallyFn: () => setPracaAccessLoading(false),
      },
    );
  };

  return (
    <>
    <header className="admin-surface relative z-20 mb-6 overflow-visible p-5 md:p-6">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[1.75rem]">
          {submission.full_name}
        </h1>
        <span className="rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
          {submission.person_type === "pj" ? "PJ" : "PF"}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(overallStatus)}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusDot(overallStatus)}`}
          />
          {statusText(overallStatus)}
        </span>

        <div className="relative z-10 ml-auto">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="liquid-glass-control flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-white/10"
          >
            Ações
            <ChevronDown
              size={14}
              className={`transition-transform ${
                actionsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {actionsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setActionsOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-2xl border border-[color:var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg-tint)_50%,var(--glass-bg))] py-1.5 shadow-lg backdrop-blur-[22px] backdrop-saturate-150">
                <button
                  onClick={handleToggleBan}
                  disabled={banLoading}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  {banLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Ban size={15} />
                  )}
                  {submission.is_banned ? "Desbanir seller" : "Banir seller"}
                </button>
                <button
                  onClick={handleToggleWithdrawalsBlock}
                  disabled={withdrawalsLoading}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {withdrawalsLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Lock size={15} />
                  )}
                  {submission.withdrawals_blocked
                    ? "Liberar saque"
                    : "Travar saque"}
                </button>
                <button
                  onClick={handleToggleApiAccess}
                  disabled={apiAccessLoading || !submission.id}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {apiAccessLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Code2 size={15} />
                  )}
                  {submission.api_access_enabled
                    ? "Revogar API"
                    : "Liberar API"}
                </button>
                <button
                  onClick={() => void handleTogglePracaAccess()}
                  disabled={pracaAccessLoading || !submission.user_id}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {pracaAccessLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <MessagesSquare size={15} />
                  )}
                  {pracaAccessEnabled ? "Revogar A Praça" : "Liberar A Praça"}
                </button>
                <button
                  onClick={handleManualEmailApproval}
                  disabled={
                    manualEmailApprovalLoading ||
                    !submission.email ||
                    !!submission.email_manually_approved
                  }
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {manualEmailApprovalLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle
                      size={15}
                      className={
                        submission.email_manually_approved ? "text-success" : ""
                      }
                    />
                  )}
                  {submission.email_manually_approved
                    ? "E-mail aprovado"
                    : "Aprovar e-mail"}
                </button>
                <button
                  onClick={handleSendSignupVerification}
                  disabled={sendVerificationLoading || !submission.email}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendVerificationLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  Enviar código OTP
                </button>
                <button
                  onClick={() => {
                    setActionsOpen(false);
                    setShowDeleteModal(true);
                  }}
                  disabled={!submission.user_id}
                  className="flex w-full items-center gap-2 border-t border-[color:var(--glass-border)] px-3.5 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Excluir seller
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {submission.phone && (
          <button
            onClick={() => copyToClipboard(submission.phone, "Telefone")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone size={14} />
            {submission.phone}
          </button>
        )}
        {submission.email && (
          <button
            onClick={() => copyToClipboard(submission.email, "E-mail")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail size={14} />
            {submission.email}
            {submission.email_manually_approved ? (
              <ShieldCheck size={14} className="text-success" />
            ) : pendingEmailVerification ? (
              <ShieldAlert size={14} className="text-warning" />
            ) : (
              <Shield size={14} className="text-muted-foreground" />
            )}
          </button>
        )}
        <span className="text-sm text-muted-foreground">
          {new Date(submission.created_at).toLocaleDateString("pt-BR")}
        </span>
        {submission.api_access_enabled && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            <Code2 size={12} />
            API liberada
          </span>
        )}
        {pracaAccessEnabled && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            <MessagesSquare size={12} />
            Praça liberada
          </span>
        )}
        {pendingEmailVerification && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
            <ShieldAlert size={12} />
            Aguardando OTP
          </span>
        )}
      </div>
    </header>
    {pendingEmailVerification && (
      <div className="admin-surface mb-6 flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            E-mail pendente de confirmação
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Este seller ainda está na etapa de OTP e não consegue acessar o
            painel até confirmar o código. Se o e-mail não chegar, use o código
            abaixo.
          </p>
          {submission.pending_email_code && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-1.5 font-mono text-lg font-semibold tracking-[0.3em] text-foreground">
                {submission.pending_email_code}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    submission.pending_email_code ?? null,
                    "Código OTP",
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Copy size={14} />
                Copiar
              </button>
              {submission.pending_email_code_expires_at && (
                <span className="text-xs text-muted-foreground">
                  Expira às{" "}
                  {new Date(
                    submission.pending_email_code_expires_at,
                  ).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSendSignupVerification}
          disabled={sendVerificationLoading || !submission.email}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sendVerificationLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          Enviar e-mail de confirmação
        </button>
      </div>
    )}
    <ConfirmationModal
      open={showBlockReasonModal}
      onOpenChange={(open) => {
        setShowBlockReasonModal(open);
        if (!open) setBlockReason("");
      }}
      title="Travar saque"
      description="Informe o motivo do bloqueio. Novos envios serão impedidos; saques já liquidados não são revertidos."
      confirmLabel="Confirmar bloqueio"
      confirmDisabled={blockReason.trim().length < 5}
      onConfirm={async () => {
        try {
          await handleBlockWithdrawals();
        } catch (error) {
          toast.error(
            getErrorMessageOrDefault(error, "Erro ao travar saque"),
          );
          throw error;
        }
      }}
    >
      <Textarea
        value={blockReason}
        onChange={(event) => setBlockReason(event.target.value)}
        placeholder="Motivo do bloqueio de saque..."
        className="min-h-24 resize-none"
      />
    </ConfirmationModal>
    <DeleteSellerAccountModal
      seller={{
        userId: Number(submission.user_id),
        fullName: submission.full_name,
        email: submission.email,
      }}
      open={showDeleteModal}
      onOpenChange={setShowDeleteModal}
      onDeleted={onDeleted}
    />
    </>
  );
}
