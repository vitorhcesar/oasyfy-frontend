import { supabase } from "@/infra/integrations/supabase/client";
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
  seller: IKycSubmissionView;
  onUpdate: () => void;
}

export function AdminKycDetailsHeader({
  seller,
  onUpdate,
}: IAdminKycDetailsHeaderProps) {
  const {
    actionsOpen,
    setActionsOpen,
    setBlockReason,
    setShowBlockReasonModal,
  } = useAdminKycDetailsStore();

  const [manualEmailApprovalLoading, setManualEmailApprovalLoading] =
    useState(false);

  const allApproved =
    seller.documents_status === "approved" &&
    seller.bank_status === "approved" &&
    seller.address_status === "approved";
  const effectiveStatus =
    allApproved && seller.status === "approved"
      ? "approved"
      : seller.status === "rejected"
        ? "rejected"
        : "pending";

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleManualEmailApproval = async () => {
    if (!seller.email) {
      toast.error("Seller sem e-mail cadastrado");
      return;
    }

    setManualEmailApprovalLoading(true);

    await tryOrToastError(
      async () => {
        const { data, error } = await supabase.functions.invoke(
          "approve-seller-email",
          {
            body: {
              user_id: seller.user_id,
              seller_email: seller.email,
              seller_name: seller.full_name,
            },
          },
        );

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

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

  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-lg font-semibold text-foreground">
          {seller.full_name}
        </h1>
        <span className="text-xs font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase">
          {seller.person_type === "pj" ? "PJ" : "PF"}
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
                  onClick={async () => {
                    setActionsOpen(false);
                    const newVal = !seller.is_banned;
                    const { error } = await supabase
                      .from("kyc_submissions")
                      .update({ is_banned: newVal })
                      .eq("id", seller.id);
                    if (error) {
                      toast.error("Erro ao atualizar");
                      return;
                    }
                    toast.success(
                      newVal ? "Seller banido" : "Seller desbanido",
                    );
                    onUpdate();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Ban size={14} />
                  {seller.is_banned ? "Desbanir seller" : "Banir seller"}
                </button>
                <button
                  onClick={() => {
                    setActionsOpen(false);
                    if (seller.withdrawals_blocked) {
                      // Unblock directly
                      (async () => {
                        const { error } = await supabase
                          .from("kyc_submissions")
                          .update({
                            withdrawals_blocked: false,
                            withdrawal_block_reason: null,
                          })
                          .eq("id", seller.id);
                        if (error) {
                          toast.error("Erro ao atualizar");
                          return;
                        }
                        toast.success("Saque liberado");
                        onUpdate();
                      })();
                    } else {
                      setBlockReason("");
                      setShowBlockReasonModal(true);
                    }
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Lock size={14} />
                  {seller.withdrawals_blocked
                    ? "Liberar saque"
                    : "Travar saque"}
                </button>
                <button
                  onClick={handleManualEmailApproval}
                  disabled={
                    manualEmailApprovalLoading ||
                    !seller.email ||
                    !!seller.email_manually_approved
                  }
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualEmailApprovalLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle
                      size={14}
                      className={
                        seller.email_manually_approved ? "text-primary" : ""
                      }
                    />
                  )}
                  {seller.email_manually_approved
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
        {seller.phone && (
          <button
            onClick={() => copyToClipboard(seller.phone, "Telefone")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone size={12} />
            {seller.phone}
          </button>
        )}
        {seller.email && (
          <button
            onClick={() => copyToClipboard(seller.email, "E-mail")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail size={12} />
            {seller.email}
            {seller.email_manually_approved ? (
              <ShieldCheck size={12} className="text-primary" />
            ) : (
              <Shield size={12} className="text-muted-foreground/50" />
            )}
          </button>
        )}
        <span className="text-xs text-muted-foreground/50">
          {new Date(seller.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </header>
  );
}
