import { useApiService } from "@/presentation/hooks/use-api-service";
import { hasSubmittedKycAddress } from "@/presentation/utils/kyc-section-display-status.util";
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
        toast.success("Endereço aprovado (necessário para saques)!");
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
        } else {
          toast.success("KYC aprovado (vendas liberadas se documentos OK).");
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
    <div className="animate-fade-in space-y-4">
      <div className="admin-surface p-5 md:p-6">
        <div className="mb-4">
          <SectionLabel text="Dados pessoais" />
        </div>
        <div className="divide-y divide-border/50">
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

      <div className="admin-surface p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <SectionLabel text="Endereço (libera saques)" />
          {hasSubmittedKycAddress({
            zipCode: submission.zip_code,
            street: submission.street,
          }) && <StatusPill status={submission.address_status} />}
        </div>
        {!submission.street ? (
          <p className="text-sm text-muted-foreground">
            Seller ainda não enviou endereço (necessário apenas para saques).
          </p>
        ) : (
        <div className="divide-y divide-border/50">
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
        )}

        {submission.street && submission.address_status !== "approved" && (
          <div className="mt-5">
            {!showAddressReject ? (
              <div className="flex flex-wrap items-center gap-2">
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={addressRejectReason}
                  onChange={(e) => setAddressRejectReason(e.target.value)}
                  placeholder="Motivo da recusa..."
                  className="flex-1 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {submission.address_status === "approved" && (
          <div className="mt-5">
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

      {(submission.status === "pending" ||
        submission.status === "under_review") && (
        <div className="admin-surface flex flex-wrap items-center gap-2 p-5 md:p-6">
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
      )}

      {submission.status === "rejected" && submission.rejection_reason && (
        <div className="admin-surface p-5 text-sm text-muted-foreground md:p-6">
          <span className="font-semibold text-destructive">Motivo:</span>{" "}
          {submission.rejection_reason}
        </div>
      )}
    </div>
  );
}
