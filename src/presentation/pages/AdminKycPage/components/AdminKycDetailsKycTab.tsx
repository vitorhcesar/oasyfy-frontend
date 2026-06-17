import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { useState } from "react";
import { toast } from "sonner";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";
import { ActionButton } from "./ActionButton";
import { Row } from "./Row";
import { SectionLabel } from "./SectionLabel";
import { StatusPill } from "./StatusPill";

interface IAdminKycDetailsKycTabProps {
  submission: IKycSubmissionView;
  onUpdate: () => void;
}

export default function AdminKycDetailsKycTab({
  submission,
  onUpdate,
}: IAdminKycDetailsKycTabProps) {
  const apiService = useApiService();

  const [actionLoading, setActionLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressRejectReason, setAddressRejectReason] = useState("");
  const [showAddressReject, setShowAddressReject] = useState(false);

  const handleAddressApprove = async () => {
    setAddressLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminKycSubmissions.approveAddress(
          Number(submission.id),
        );
        toast.success("Endereço aprovado!");
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao aprovar endereço",
        finallyFn: () => setAddressLoading(false),
      },
    );
  };

  const handleAddressReject = async () => {
    if (!addressRejectReason.trim()) return;
    setAddressLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminKycSubmissions.rejectAddress(
          Number(submission.id),
          { reason: addressRejectReason.trim() },
        );
        toast.success("Endereço recusado.");
        setShowAddressReject(false);
        setAddressRejectReason("");
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao recusar endereço",
        finallyFn: () => setAddressLoading(false),
      },
    );
  };

  const handleApprove = async () => {
    setActionLoading(true);

    await tryOrToastError(
      async () => {
        const result = await apiService.modules.adminKycSubmissions.approve(
          Number(submission.id),
        );

        if (!result.emailSent) {
          toast.error(
            "Não foi possível enviar o e-mail de aprovação para o seller",
          );
        }

        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao aprovar KYC",
        finallyFn: () => setActionLoading(false),
      },
    );
  };

  const handleReject = async () => {
    setActionLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminKycSubmissions.reject(
          Number(submission.id),
          {
            reason: "Não atende aos critérios",
          },
        );
        onUpdate();
      },
      {
        defaultErrorMessage: "Erro ao recusar KYC",
        finallyFn: () => setActionLoading(false),
      },
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Personal info */}
      <div>
        <SectionLabel text="Dados pessoais" />
        <div className="space-y-0 divide-y divide-border/20">
          <Row
            label="Documento"
            value={
              submission.person_type === "pj" ? submission.cnpj : submission.cpf
            }
          />
          <Row label="Telefone" value={submission.phone} />
          {submission.person_type === "pj" && (
            <>
              <Row label="Razão social" value={submission.company_name} />
              <Row label="Tipo de empresa" value={submission.company_type} />
            </>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <SectionLabel text="Endereço" />
          <StatusPill status={submission.address_status} />
        </div>
        <div className="space-y-0 divide-y divide-border/20">
          <Row
            label="Rua"
            value={`${submission.street}, ${submission.number}`}
          />
          {submission.complement && (
            <Row label="Complemento" value={submission.complement} />
          )}
          <Row label="Bairro" value={submission.neighborhood} />
          <Row
            label="Cidade/UF"
            value={`${submission.city}/${submission.state}`}
          />
          <Row label="CEP" value={submission.zip_code} mono />
        </div>

        {/* Address actions */}
        {submission.address_status !== "approved" && (
          <div className="mt-4">
            {!showAddressReject ? (
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={handleAddressApprove}
                  loading={addressLoading}
                  variant="approve"
                  label="Aprovar"
                />
                {submission.address_status !== "rejected" && (
                  <ActionButton
                    onClick={() => setShowAddressReject(true)}
                    variant="reject"
                    label="Recusar"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={addressRejectReason}
                  onChange={(e) => setAddressRejectReason(e.target.value)}
                  placeholder="Motivo da recusa..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/40"
                />
                <ActionButton
                  onClick={handleAddressReject}
                  disabled={!addressRejectReason.trim()}
                  loading={addressLoading}
                  variant="reject"
                  label="Confirmar"
                />
                <button
                  onClick={() => {
                    setShowAddressReject(false);
                    setAddressRejectReason("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {submission.address_status === "approved" && (
          <div className="mt-4">
            <ActionButton
              onClick={async () => {
                setAddressLoading(true);
                await tryOrToastError(
                  async () => {
                    await apiService.modules.adminKycSubmissions.rejectAddress(
                      Number(submission.id),
                    );
                    toast.success("Endereço recusado.");
                    onUpdate();
                  },
                  {
                    defaultErrorMessage: "Erro ao recusar endereço",
                    finallyFn: () => setAddressLoading(false),
                  },
                );
              }}
              loading={addressLoading}
              variant="reject"
              label="Recusar endereço"
            />
          </div>
        )}
      </div>

      {/* Overall KYC actions */}
      {(submission.status === "pending" ||
        submission.status === "under_review") && (
        <div className="pt-6 border-t border-border/30">
          <div className="flex items-center gap-2">
            <ActionButton
              onClick={handleReject}
              loading={actionLoading}
              variant="reject"
              label="Rejeitar"
            />
            <ActionButton
              onClick={handleApprove}
              loading={actionLoading}
              variant="approve"
              label="Aprovar tudo"
            />
          </div>
        </div>
      )}

      {submission.status === "rejected" && submission.rejection_reason && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-destructive">Motivo:</span>{" "}
          {submission.rejection_reason}
        </div>
      )}
    </div>
  );
}
