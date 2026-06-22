import { useApiService } from "@/presentation/hooks/use-api-service";
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
  const bankData = submission.bank_data;

  return (
    <div className="animate-fade-in">
      {bankData ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <SectionLabel text="Conta bancária" />
            <StatusPill status={submission.bank_status} />
          </div>

          <div className="divide-y divide-border/20">
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
            <div className="flex items-center gap-2 pt-4 border-t border-border/30">
              <ActionButton
                onClick={async () => {
                  await apiService.modules.adminKycSubmissions.rejectBank(
                    Number(submission.id),
                  );
                  onUpdate();
                }}
                variant="reject"
                label="Recusar"
              />
              <ActionButton
                onClick={async () => {
                  await apiService.modules.adminKycSubmissions.approveBank(
                    Number(submission.id),
                  );
                  await autoApproveIfComplete();
                  onUpdate();
                }}
                variant="approve"
                label="Aprovar"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma conta bancária cadastrada.
          </p>
        </div>
      )}
    </div>
  );
}
