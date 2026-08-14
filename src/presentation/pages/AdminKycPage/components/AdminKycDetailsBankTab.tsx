import ModalPortal from "@/presentation/components/ModalPortal";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { useState } from "react";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";
import { ActionButton } from "./ActionButton";
import { Row } from "./Row";
import { SectionLabel } from "./SectionLabel";
import { StatusPill } from "./StatusPill";

interface IAdminKycDetailsBankTabProps {
  submission: IKycSubmissionView;
  onUpdate: () => void;
  autoApproveIfComplete: () => Promise<void>;
}

export default function AdminKycDetailsBankTab({
  submission,
  onUpdate,
  autoApproveIfComplete,
}: IAdminKycDetailsBankTabProps) {
  const apiService = useApiService();
  const [loading, setLoading] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const bankData = submission.bank_data;

  const handleApproveBank = async () => {
    setLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminKycSubmissions.approveBank(
          Number(submission.id),
        );
        await autoApproveIfComplete();
        setShowApproveConfirm(false);
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao aprovar banco",
        finallyFn: () => setLoading(false),
      },
    );
  };

  return (
    <div className="animate-fade-in">
      {bankData ? (
        <div className="admin-surface space-y-5 p-5 md:p-6">
          <div className="flex items-center gap-2">
            <SectionLabel text="Conta bancária (libera saques)" />
            <StatusPill status={submission.bank_status} />
          </div>

          <div className="divide-y divide-border/50">
            <Row label="Banco" value={bankData.bankName} />
            <Row
              label="Agência"
              value={`${bankData.agency}${
                bankData.agencyDigit ? "-" + bankData.agencyDigit : ""
              }`}
              mono
            />
            <Row
              label="Conta"
              value={`${bankData.account}-${bankData.accountDigit || ""}`}
              mono
            />
            <Row
              label="Tipo"
              value={
                bankData.accountType === "corrente" ? "Corrente" : "Poupança"
              }
            />
            <Row label="Chave PIX" value={bankData.pixKey} mono />
            <Row
              label="Tipo da chave"
              value={bankData.pixKeyType.toUpperCase()}
            />
          </div>

          {submission.bank_status !== "approved" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-5">
              <ActionButton
                onClick={() => {
                  setLoading(true);
                  void tryOrToastError(
                    async () => {
                      await apiService.modules.adminKycSubmissions.rejectBank(
                        Number(submission.id),
                      );
                      onUpdate();
                    },
                    {
                      defaultErrorMessage: "Erro ao recusar banco",
                      finallyFn: () => setLoading(false),
                    },
                  );
                }}
                loading={loading}
                variant="reject"
                label="Recusar"
              />
              <ActionButton
                onClick={() => setShowApproveConfirm(true)}
                loading={loading}
                variant="approve"
                label="Aprovar"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="admin-surface px-6 py-16 text-center">
          <p className="text-base text-muted-foreground">
            Nenhuma conta bancária cadastrada (necessário apenas para saques).
          </p>
        </div>
      )}

      {showApproveConfirm && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            onClick={() => !loading && setShowApproveConfirm(false)}
          >
            <div
              className="w-full max-w-md rounded-[22px] border border-border/60 bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Confirmar dados bancários
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Os saques deste seller serão enviados para esta conta. Confirme
                que as informações estão corretas.
              </p>
              {bankData && (
                <div className="mb-5 space-y-1.5 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-3 text-sm">
                  <p className="font-medium text-foreground">
                    {bankData.bankName}
                  </p>
                  <p className="text-muted-foreground">
                    Ag. {bankData.agency}
                    {bankData.agencyDigit ? `-${bankData.agencyDigit}` : ""}{" "}
                    · Conta {bankData.account}-{bankData.accountDigit || ""}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    PIX: {bankData.pixKey}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  Cancelar
                </button>
                <ActionButton
                  onClick={() => void handleApproveBank()}
                  loading={loading}
                  variant="approve"
                  label="Sim, estão corretos"
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
