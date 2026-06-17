import { supabase } from "@/infra/integrations/supabase/client";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminKycDetailsStore } from "../stores/admin-kyc-details.store";
import type { TKycDocumentKey } from "../types/kyc-documents-review.type";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";
import { checkAndUpdateDocumentsStatus } from "../utils/check-and-update-documents-status.util";
import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";
import { AdminKycDetailsBalanceTab } from "./AdminKycDetailsBalanceTab";
import { AdminKycDetailsFeesTab } from "./AdminKycDetailsFeesTab";
import { AdminKycDetailsHeader } from "./AdminKycDetailsHeader";
import AdminKycDetailsTabs from "./AdminKycDetailsTabs";

interface IAdminKycDetailsProps {
  seller: IKycSubmissionView;
  onBack: () => void;
  onUpdate: () => void;
}

export function AdminKycDetails({
  seller,
  onBack,
  onUpdate,
}: IAdminKycDetailsProps) {
  const apiService = useApiService();

  const {
    tab,
    blockReason,
    setBlockReason,
    showBlockReasonModal,
    setShowBlockReasonModal,
  } = useAdminKycDetailsStore();

  const [actionLoading, setActionLoading] = useState(false);
  const [docRejectingKey, setDocRejectingKey] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressRejectReason, setAddressRejectReason] = useState("");
  const [showAddressReject, setShowAddressReject] = useState(false);

  const documentsReview = seller.documents_review ?? {};

  const autoApproveIfComplete = async () => {
    const result =
      await apiService.modules.adminKycSubmissions.autoApproveIfComplete(
        Number(seller.id),
      );

    if (result.approved && !result.emailSent) {
      toast.error(
        "Não foi possível enviar o e-mail de aprovação para o seller",
      );
    }
  };

  const handleAddressApprove = async () => {
    setAddressLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminKycSubmissions.approveAddress(
          Number(seller.id),
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
          Number(seller.id),
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
          Number(seller.id),
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

  const kycDocuments: {
    key: TKycDocumentKey;
    label: string;
    url: string | null;
  }[] = [
    {
      key: "document_front",
      label: "Documento frente",
      url: seller.document_front_url,
    },
    {
      key: "document_back",
      label: "Documento verso",
      url: seller.document_back_url,
    },
    {
      key: "selfie",
      label: "Selfie com documento",
      url: seller.selfie_url,
    },
    {
      key: "proof_of_address",
      label: "Comprovante de endereço",
      url: seller.proof_of_address_url,
    },
    ...(seller.person_type === "pj"
      ? [
          {
            key: "company_contract" as const,
            label: "Contrato social",
            url: seller.company_contract_url,
          },
        ]
      : []),
  ];

  const handleReject = async () => {
    setActionLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminKycSubmissions.reject(
          Number(seller.id),
          { reason: "Não atende aos critérios" },
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
    <div className="animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      <AdminKycDetailsHeader seller={seller} onUpdate={onUpdate} />

      <AdminKycDetailsTabs seller={seller} />

      {/* KYC Tab */}
      {tab === "kyc" && (
        <div className="space-y-8 animate-fade-in">
          {/* Personal info */}
          <div>
            <SectionLabel text="Dados pessoais" />
            <div className="space-y-0 divide-y divide-border/20">
              <Row
                label="Documento"
                value={seller.person_type === "pj" ? seller.cnpj : seller.cpf}
              />
              <Row label="Telefone" value={seller.phone} />
              {seller.person_type === "pj" && (
                <>
                  <Row label="Razão social" value={seller.company_name} />
                  <Row label="Tipo de empresa" value={seller.company_type} />
                </>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <SectionLabel text="Endereço" />
              <StatusPill status={seller.address_status} />
            </div>
            <div className="space-y-0 divide-y divide-border/20">
              <Row label="Rua" value={`${seller.street}, ${seller.number}`} />
              {seller.complement && (
                <Row label="Complemento" value={seller.complement} />
              )}
              <Row label="Bairro" value={seller.neighborhood} />
              <Row label="Cidade/UF" value={`${seller.city}/${seller.state}`} />
              <Row label="CEP" value={seller.zip_code} mono />
            </div>

            {/* Address actions */}
            {seller.address_status !== "approved" && (
              <div className="mt-4">
                {!showAddressReject ? (
                  <div className="flex items-center gap-2">
                    <ActionBtn
                      onClick={handleAddressApprove}
                      loading={addressLoading}
                      variant="approve"
                      label="Aprovar"
                    />
                    {seller.address_status !== "rejected" && (
                      <ActionBtn
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
                    <ActionBtn
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

            {seller.address_status === "approved" && (
              <div className="mt-4">
                <ActionBtn
                  onClick={async () => {
                    setAddressLoading(true);
                    await tryOrToastError(
                      async () => {
                        await apiService.modules.adminKycSubmissions.rejectAddress(
                          Number(seller.id),
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
          {(seller.status === "pending" ||
            seller.status === "under_review") && (
            <div className="pt-6 border-t border-border/30">
              <div className="flex items-center gap-2">
                <ActionBtn
                  onClick={handleReject}
                  loading={actionLoading}
                  variant="reject"
                  label="Rejeitar"
                />
                <ActionBtn
                  onClick={handleApprove}
                  loading={actionLoading}
                  variant="approve"
                  label="Aprovar tudo"
                />
              </div>
            </div>
          )}

          {seller.status === "rejected" && seller.rejection_reason && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-destructive">Motivo:</span>{" "}
              {seller.rejection_reason}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {tab === "documents" && (
        <div className="space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <SectionLabel text="Documentos" />
            <StatusPill status={seller.documents_status} />
          </div>

          <div className="divide-y divide-border/20">
            {kycDocuments.map((doc) => {
              const docReview = documentsReview[doc.key];
              const docStatus = docReview?.status ?? "pending";

              return (
                <div key={doc.key} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground">
                        {doc.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          docStatus === "approved"
                            ? "border-primary/20 bg-primary/5 text-primary"
                            : docStatus === "rejected"
                              ? "border-destructive/20 bg-destructive/5 text-destructive"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${statusDot(
                            docStatus,
                          )}`}
                        />
                        {statusText(docStatus)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                      {doc.url && docStatus === "pending" && (
                        <>
                          <button
                            onClick={() => {
                              setDocRejectingKey(
                                docRejectingKey === doc.key ? null : doc.key,
                              );
                              setDocRejectReason("");
                            }}
                            className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
                          >
                            <XCircle size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              const updated = {
                                ...documentsReview,
                                [doc.key]: { status: "approved" as const },
                              };
                              const newDocStatus =
                                checkAndUpdateDocumentsStatus(
                                  updated,
                                  seller.person_type,
                                );
                              await supabase
                                .from("kyc_submissions")
                                .update({
                                  documents_review: updated,
                                  documents_status: newDocStatus,
                                })
                                .eq("id", seller.id);
                              if (newDocStatus === "approved")
                                await autoApproveIfComplete();
                              onUpdate();
                            }}
                            className="p-1.5 rounded text-muted-foreground/40 hover:text-primary transition-colors"
                          >
                            <CheckCircle size={13} />
                          </button>
                        </>
                      )}
                      {doc.url && docStatus === "approved" && (
                        <button
                          onClick={() => {
                            setDocRejectingKey(
                              docRejectingKey === doc.key ? null : doc.key,
                            );
                            setDocRejectReason("");
                          }}
                          className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
                        >
                          <XCircle size={13} />
                        </button>
                      )}
                      {doc.url && docStatus === "rejected" && (
                        <button
                          onClick={async () => {
                            const updated = {
                              ...documentsReview,
                              [doc.key]: { status: "approved" as const },
                            };
                            const newDocStatus =
                              checkAndUpdateDocumentsStatus(
                                updated,
                                seller.person_type,
                              );
                            await supabase
                              .from("kyc_submissions")
                              .update({
                                documents_review: updated,
                                documents_status: newDocStatus,
                              })
                              .eq("id", seller.id);
                            if (newDocStatus === "approved")
                              await autoApproveIfComplete();
                            onUpdate();
                          }}
                          className="p-1.5 rounded text-muted-foreground/40 hover:text-primary transition-colors"
                        >
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {!doc.url && (
                        <span className="text-xs text-muted-foreground/40 italic">
                          não enviado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason display */}
                  {docStatus === "rejected" &&
                    docReview?.reason &&
                    docRejectingKey !== doc.key && (
                      <p className="text-xs md:text-sm text-destructive/70 mt-2 ml-[18px]">
                        {docReview.reason}
                      </p>
                    )}

                  {/* Rejection input */}
                  {docRejectingKey === doc.key && (
                    <div className="flex items-center gap-2 mt-3 ml-[18px]">
                      <input
                        type="text"
                        value={docRejectReason}
                        onChange={(e) => setDocRejectReason(e.target.value)}
                        placeholder="Motivo da recusa..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-destructive/20 placeholder:text-muted-foreground/40"
                        maxLength={500}
                      />
                      <button
                        onClick={async () => {
                          if (!docRejectReason.trim()) return;
                          const updated = {
                            ...documentsReview,
                            [doc.key]: {
                              status: "rejected" as const,
                              reason: docRejectReason.trim(),
                            },
                          };
                          const newDocStatus = checkAndUpdateDocumentsStatus(
                            updated,
                            seller.person_type,
                          );
                          await supabase
                            .from("kyc_submissions")
                            .update({
                              documents_review: updated,
                              documents_status: newDocStatus,
                            })
                            .eq("id", seller.id);
                          setDocRejectingKey(null);
                          setDocRejectReason("");
                          onUpdate();
                        }}
                        disabled={!docRejectReason.trim()}
                        className="text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-40 transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => {
                          setDocRejectingKey(null);
                          setDocRejectReason("");
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bank Tab */}
      {tab === "bank" && (
        <div className="animate-fade-in">
          {seller.bank_data ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <SectionLabel text="Conta bancária" />
                <StatusPill status={seller.bank_status} />
              </div>

              <div className="divide-y divide-border/20">
                <Row label="Banco" value={(seller.bank_data as any).bankName} />
                <Row
                  label="Agência"
                  value={`${(seller.bank_data as any).agency}${
                    (seller.bank_data as any).agencyDigit
                      ? "-" + (seller.bank_data as any).agencyDigit
                      : ""
                  }`}
                  mono
                />
                <Row
                  label="Conta"
                  value={`${(seller.bank_data as any).account}-${
                    (seller.bank_data as any).accountDigit || ""
                  }`}
                  mono
                />
                <Row
                  label="Tipo"
                  value={
                    (seller.bank_data as any).accountType === "corrente"
                      ? "Corrente"
                      : "Poupança"
                  }
                />
                <Row
                  label="Chave PIX"
                  value={(seller.bank_data as any).pixKey}
                  mono
                />
                <Row
                  label="Tipo da chave"
                  value={(seller.bank_data as any).pixKeyType?.toUpperCase()}
                />
              </div>

              {seller.bank_status !== "approved" && (
                <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                  <ActionBtn
                    onClick={async () => {
                      await supabase
                        .from("kyc_submissions")
                        .update({ bank_status: "rejected" } as any)
                        .eq("id", seller.id);
                      onUpdate();
                    }}
                    variant="reject"
                    label="Recusar"
                  />
                  <ActionBtn
                    onClick={async () => {
                      await supabase
                        .from("kyc_submissions")
                        .update({ bank_status: "approved" } as any)
                        .eq("id", seller.id);
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
      )}

      {tab === "fees" && (
        <AdminKycDetailsFeesTab sellerId={Number(seller.user_id)} />
      )}

      {/* Balance Tab */}
      {tab === "balance" && <AdminKycDetailsBalanceTab seller={seller} />}

      {/* Block Reason Modal */}
      {showBlockReasonModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowBlockReasonModal(false)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Travar saque
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Informe o motivo do bloqueio. O seller verá esta mensagem.
            </p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Motivo do bloqueio de saque..."
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBlockReasonModal(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!blockReason.trim()}
                onClick={async () => {
                  const { error } = await supabase
                    .from("kyc_submissions")
                    .update({
                      withdrawals_blocked: true,
                      withdrawal_block_reason: blockReason.trim(),
                    })
                    .eq("id", seller.id);
                  if (error) {
                    toast.error("Erro ao atualizar");
                    return;
                  }
                  toast.success("Saque travado");
                  setShowBlockReasonModal(false);
                  onUpdate();
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Confirmar bloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tiny sub-components ── */

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-4">
      {text}
    </p>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground -mt-3">
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
      {statusText(status)}
    </span>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-3">
      <span className="text-xs text-muted-foreground/50">{label}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

function ActionBtn({
  onClick,
  variant,
  label,
  loading,
  disabled,
}: {
  onClick: () => void;
  variant: "approve" | "reject";
  label: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  const base =
    variant === "approve"
      ? "text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
      : "text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground";

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 ${base}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : null}
      {label}
    </button>
  );
}
