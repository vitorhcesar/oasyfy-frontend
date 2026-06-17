import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowLeft, CheckCircle, ExternalLink, XCircle } from "lucide-react";
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
import AdminKycDetailsKycTab from "./AdminKycDetailsKycTab";
import AdminKycDetailsTabs from "./AdminKycDetailsTabs";

interface IAdminKycDetailsProps {
  submission: IKycSubmissionView;
  onBack: () => void;
  onUpdate: () => void;
}

export function AdminKycDetails({
  submission,
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

  const [docRejectingKey, setDocRejectingKey] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");

  const documentsReview = submission.documents_review ?? {};

  const autoApproveIfComplete = async () => {
    const result =
      await apiService.modules.adminKycSubmissions.autoApproveIfComplete(
        Number(submission.id),
      );

    if (result.approved && !result.emailSent) {
      toast.error(
        "Não foi possível enviar o e-mail de aprovação para o seller",
      );
    }
  };

  const kycDocuments: {
    key: TKycDocumentKey;
    label: string;
    url: string | null;
  }[] = [
    {
      key: "document_front",
      label: "Documento frente",
      url: submission.document_front_url,
    },
    {
      key: "document_back",
      label: "Documento verso",
      url: submission.document_back_url,
    },
    {
      key: "selfie",
      label: "Selfie com documento",
      url: submission.selfie_url,
    },
    {
      key: "proof_of_address",
      label: "Comprovante de endereço",
      url: submission.proof_of_address_url,
    },
    ...(submission.person_type === "pj"
      ? [
          {
            key: "company_contract" as const,
            label: "Contrato social",
            url: submission.company_contract_url,
          },
        ]
      : []),
  ];

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      <AdminKycDetailsHeader submission={submission} onUpdate={onUpdate} />
      <AdminKycDetailsTabs submission={submission} />

      {/* KYC Tab */}
      {tab === "kyc" && (
        <AdminKycDetailsKycTab submission={submission} onUpdate={onUpdate} />
      )}

      {/* Documents Tab */}
      {tab === "documents" && (
        <div className="space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <SectionLabel text="Documentos" />
            <StatusPill status={submission.documents_status} />
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
                                  submission.person_type,
                                );
                              await supabase
                                .from("kyc_submissions")
                                .update({
                                  documents_review: updated,
                                  documents_status: newDocStatus,
                                })
                                .eq("id", submission.id);
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
                            const newDocStatus = checkAndUpdateDocumentsStatus(
                              updated,
                              submission.person_type,
                            );
                            await supabase
                              .from("kyc_submissions")
                              .update({
                                documents_review: updated,
                                documents_status: newDocStatus,
                              })
                              .eq("id", submission.id);
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
                            submission.person_type,
                          );
                          await supabase
                            .from("kyc_submissions")
                            .update({
                              documents_review: updated,
                              documents_status: newDocStatus,
                            })
                            .eq("id", submission.id);
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
          {submission.bank_data ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <SectionLabel text="Conta bancária" />
                <StatusPill status={submission.bank_status} />
              </div>

              <div className="divide-y divide-border/20">
                <Row
                  label="Banco"
                  value={(submission.bank_data as any).bankName}
                />
                <Row
                  label="Agência"
                  value={`${(submission.bank_data as any).agency}${
                    (submission.bank_data as any).agencyDigit
                      ? "-" + (submission.bank_data as any).agencyDigit
                      : ""
                  }`}
                  mono
                />
                <Row
                  label="Conta"
                  value={`${(submission.bank_data as any).account}-${
                    (submission.bank_data as any).accountDigit || ""
                  }`}
                  mono
                />
                <Row
                  label="Tipo"
                  value={
                    (submission.bank_data as any).accountType === "corrente"
                      ? "Corrente"
                      : "Poupança"
                  }
                />
                <Row
                  label="Chave PIX"
                  value={(submission.bank_data as any).pixKey}
                  mono
                />
                <Row
                  label="Tipo da chave"
                  value={(
                    submission.bank_data as any
                  ).pixKeyType?.toUpperCase()}
                />
              </div>

              {submission.bank_status !== "approved" && (
                <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                  <ActionBtn
                    onClick={async () => {
                      await supabase
                        .from("kyc_submissions")
                        .update({ bank_status: "rejected" } as any)
                        .eq("id", submission.id);
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
                        .eq("id", submission.id);
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
        <AdminKycDetailsFeesTab sellerId={Number(submission.user_id)} />
      )}

      {/* Balance Tab */}
      {tab === "balance" && <AdminKycDetailsBalanceTab seller={submission} />}

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
                  await tryOrToastError(
                    async () => {
                      await apiService.modules.adminKycSubmissions.blockWithdrawals(
                        Number(submission.id),
                        { reason: blockReason.trim() },
                      );
                      toast.success("Saque travado");
                      setShowBlockReasonModal(false);
                      onUpdate();
                    },
                    {
                      defaultErrorMessage: "Erro ao travar saque",
                    },
                  );
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
