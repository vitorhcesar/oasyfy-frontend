import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  Ban,
  CheckCircle,
  ChevronDown,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminKycDetailsStore } from "../stores/admin-kyc-details.store";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";
import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";

interface IAdminKycDetailsHeaderProps {
  submission: IKycSubmissionView;
  onUpdate: () => void;
}

export function AdminKycDetailsHeader({
  submission,
  onUpdate,
}: IAdminKycDetailsHeaderProps) {
  const apiService = useApiService();

  const {
    actionsOpen,
    setActionsOpen,
    setBlockReason,
    setShowBlockReasonModal,
  } = useAdminKycDetailsStore();

  const [manualEmailApprovalLoading, setManualEmailApprovalLoading] =
    useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const allApproved =
    submission.documents_status === "approved" &&
    submission.bank_status === "approved" &&
    submission.address_status === "approved";
  const effectiveStatus =
    allApproved && submission.status === "approved"
      ? "approved"
      : submission.status === "rejected"
        ? "rejected"
        : "pending";

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
          await apiService.modules.adminKycSubmissions.unblockWithdrawals(
            Number(submission.id),
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

  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-lg font-semibold text-foreground">
          {submission.full_name}
        </h1>
        <span className="text-xs font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase">
          {submission.person_type === "pj" ? "PJ" : "PF"}
        </span>
        <div className="flex items-center gap-1.5 ml-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${statusDot(effectiveStatus)}`}
          />
          <span className="text-xs text-muted-foreground">
            {statusText(effectiveStatus)}
          </span>
        </div>

        {/* Ações dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            Ações
            <ChevronDown
              size={12}
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
              <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
                <button
                  onClick={handleToggleBan}
                  disabled={banLoading}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {banLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Ban size={14} />
                  )}
                  {submission.is_banned ? "Desbanir seller" : "Banir seller"}
                </button>
                <button
                  onClick={handleToggleWithdrawalsBlock}
                  disabled={withdrawalsLoading}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {withdrawalsLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Lock size={14} />
                  )}
                  {submission.withdrawals_blocked
                    ? "Liberar saque"
                    : "Travar saque"}
                </button>
                <button
                  onClick={handleManualEmailApproval}
                  disabled={
                    manualEmailApprovalLoading ||
                    !submission.email ||
                    !!submission.email_manually_approved
                  }
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualEmailApprovalLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle
                      size={14}
                      className={
                        submission.email_manually_approved ? "text-primary" : ""
                      }
                    />
                  )}
                  {submission.email_manually_approved
                    ? "E-mail aprovado"
                    : "Aprovar e-mail"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact row */}
      <div className="flex items-center gap-5 mt-3">
        {submission.phone && (
          <button
            onClick={() => copyToClipboard(submission.phone, "Telefone")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone size={12} />
            {submission.phone}
          </button>
        )}
        {submission.email && (
          <button
            onClick={() => copyToClipboard(submission.email, "E-mail")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail size={12} />
            {submission.email}
            {submission.email_manually_approved ? (
              <ShieldCheck size={12} className="text-primary" />
            ) : (
              <Shield size={12} className="text-muted-foreground/50" />
            )}
          </button>
        )}
        <span className="text-xs text-muted-foreground/50">
          {new Date(submission.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </header>
  );
}
