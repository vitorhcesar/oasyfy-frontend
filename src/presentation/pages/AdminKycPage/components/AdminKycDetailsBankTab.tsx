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
  const bankData = submission.bank_data;

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
                onClick={() => {
                  setLoading(true);
                  void tryOrToastError(
                    async () => {
                      await apiService.modules.adminKycSubmissions.approveBank(
                        Number(submission.id),
                      );
                      await autoApproveIfComplete();
                      onUpdate();
                    },
                    {
                      defaultErrorMessage: "Erro ao aprovar banco",
                      finallyFn: () => setLoading(false),
                    },
                  );
                }}
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
    </div>
  );
}
