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

function statusBadgeClasses(status: string) {
  if (status === "approved") {
    return "border-success/25 bg-success/10 text-success";
  }
  if (status === "rejected") {
    return "border-destructive/25 bg-destructive/10 text-destructive";
  }
  return "border-warning/25 bg-warning/10 text-warning";
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
    <header className="admin-surface mb-6 p-5 md:p-6">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[1.75rem]">
          {submission.full_name}
        </h1>
        <span className="rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground">
          {submission.person_type === "pj" ? "PJ" : "PF"}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(effectiveStatus)}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusDot(effectiveStatus)}`}
          />
          {statusText(effectiveStatus)}
        </span>

        <div className="relative ml-auto">
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
              <div className="liquid-glass-control absolute right-0 z-50 mt-1.5 w-52 rounded-2xl py-1.5 shadow-lg">
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
            ) : (
              <Shield size={14} className="text-muted-foreground" />
            )}
          </button>
        )}
        <span className="text-sm text-muted-foreground">
          {new Date(submission.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </header>
  );
}
