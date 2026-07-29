import KycDocumentPreviewModal from "@/presentation/components/KycDocumentPreviewModal";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { ArrowLeft, CheckCircle, Eye, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminKycDetailsStore } from "../stores/admin-kyc-details.store";
import type { TKycDocumentKey } from "../types/kyc-documents-review.type";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";
import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";
import { AdminKycDetailsBalanceTab } from "./AdminKycDetailsBalanceTab";
import AdminKycDetailsBankTab from "./AdminKycDetailsBankTab";
import { AdminKycDetailsFeesTab } from "./AdminKycDetailsFeesTab";
import { AdminKycDetailsHeader } from "./AdminKycDetailsHeader";
import AdminKycDetailsKycTab from "./AdminKycDetailsKycTab";
import AdminKycDetailsTabs from "./AdminKycDetailsTabs";
import BlockReasonModal from "./BlockReasonModal";
import { SectionLabel } from "./SectionLabel";
import { StatusPill } from "./StatusPill";

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

  const { tab, showBlockReasonModal } = useAdminKycDetailsStore();

  const [docRejectingKey, setDocRejectingKey] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{
    key: TKycDocumentKey;
    label: string;
    url: string;
    status: string;
  } | null>(null);

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

  const handleApproveDocument = async (key: TKycDocumentKey) => {
    const result = await apiService.modules.adminKycSubmissions.approveDocument(
      Number(submission.id),
      key,
    );
    if (result.documentsStatus === "approved") {
      await autoApproveIfComplete();
    }
    onUpdate();
  };

  const handleRejectDocument = async (key: TKycDocumentKey, reason: string) => {
    await apiService.modules.adminKycSubmissions.rejectDocument(
      Number(submission.id),
      key,
      { reason },
    );
    setDocRejectingKey(null);
    setDocRejectReason("");
    onUpdate();
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
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} />
        Voltar
      </button>

      <AdminKycDetailsHeader submission={submission} onUpdate={onUpdate} />
      <AdminKycDetailsTabs submission={submission} />

      {tab === "kyc" && (
        <AdminKycDetailsKycTab submission={submission} onUpdate={onUpdate} />
      )}

      {tab === "documents" && (
        <div className="admin-surface animate-fade-in p-5 md:p-6">
          <div className="mb-5 flex items-center gap-2">
            <SectionLabel text="Documentos (libera vendas)" />
            <StatusPill status={submission.documents_status} />
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Ao aprovar todos os documentos, as vendas do seller são liberadas.
            Endereço e banco liberam saques.
          </p>

          <div className="divide-y divide-border/50">
            {kycDocuments.map((doc) => {
              const docReview = documentsReview[doc.key];
              const docStatus = docReview?.status ?? "pending";

              return (
                <div key={doc.key} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {doc.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                          docStatus === "approved"
                            ? "border-success/25 bg-success/10 text-success"
                            : docStatus === "rejected"
                              ? "border-destructive/25 bg-destructive/10 text-destructive"
                              : "border-warning/25 bg-warning/10 text-warning"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDot(
                            docStatus,
                          )}`}
                        />
                        {statusText(docStatus)}
                      </span>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1">
                      {doc.url && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              key: doc.key,
                              label: doc.label,
                              url: doc.url!,
                              status: docStatus,
                            })
                          }
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Ver documento"
                        >
                          <Eye size={16} />
                        </button>
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
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Recusar"
                          >
                            <XCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleApproveDocument(doc.key)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-success/10 hover:text-success"
                            title="Aprovar"
                          >
                            <CheckCircle size={16} />
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
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Recusar"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      {doc.url && docStatus === "rejected" && (
                        <button
                          onClick={() => handleApproveDocument(doc.key)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-success/10 hover:text-success"
                          title="Aprovar"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {!doc.url && (
                        <span className="text-sm italic text-muted-foreground">
                          não enviado
                        </span>
                      )}
                    </div>
                  </div>

                  {docStatus === "rejected" &&
                    docReview?.reason &&
                    docRejectingKey !== doc.key && (
                      <p className="mt-2 text-sm text-destructive">
                        {docReview.reason}
                      </p>
                    )}

                  {docRejectingKey === doc.key && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={docRejectReason}
                        onChange={(e) => setDocRejectReason(e.target.value)}
                        placeholder="Motivo da recusa..."
                        className="flex-1 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive/40 focus:outline-none focus:ring-2 focus:ring-destructive/20"
                        maxLength={500}
                      />
                      <button
                        onClick={() => {
                          if (!docRejectReason.trim()) return;
                          void handleRejectDocument(
                            doc.key,
                            docRejectReason.trim(),
                          );
                        }}
                        disabled={!docRejectReason.trim()}
                        className="text-sm font-semibold text-destructive transition-colors hover:text-destructive/80 disabled:opacity-40"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => {
                          setDocRejectingKey(null);
                          setDocRejectReason("");
                        }}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
        <AdminKycDetailsBankTab
          submission={submission}
          onUpdate={onUpdate}
          autoApproveIfComplete={autoApproveIfComplete}
        />
      )}

      {tab === "fees" && (
        <AdminKycDetailsFeesTab sellerId={Number(submission.user_id)} />
      )}

      {/* Balance Tab */}
      {tab === "balance" && <AdminKycDetailsBalanceTab seller={submission} />}

      {/* Block Reason Modal */}
      {showBlockReasonModal && (
        <BlockReasonModal submissionId={submission.id} onUpdate={onUpdate} />
      )}

      <KycDocumentPreviewModal
        open={!!previewDoc}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
        title={previewDoc?.label ?? "Documento"}
        url={previewDoc?.url ?? null}
        reviewMode
        documentStatus={previewDoc?.status}
        onApprove={async () => {
          if (!previewDoc) return;
          await handleApproveDocument(previewDoc.key);
          toast.success("Documento aprovado");
        }}
        onReject={async (reason) => {
          if (!previewDoc) return;
          await handleRejectDocument(previewDoc.key, reason);
          toast.success("Documento recusado");
        }}
      />
    </div>
  );
}

/* ── Tiny sub-components ── */
