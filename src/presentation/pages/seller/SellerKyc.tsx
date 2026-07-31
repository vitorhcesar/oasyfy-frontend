import type {
  IKycSubmissionBankData,
  TKycBankAccountType,
  TKycPixKeyType,
} from "@/domain/types/kyc-submission-bank-data.type";
import {
  getKycDocumentUrl,
  type TKycSubmissionDocumentKey,
} from "@/infra/http/services/api/modules/types/kyc-submission-document-keys";
import KycDocumentPreviewModal from "@/presentation/components/KycDocumentPreviewModal";
import KycWithdrawalDetails from "@/presentation/components/KycOnboarding/KycWithdrawalDetails";
import ModalPortal from "@/presentation/components/ModalPortal";
import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Eye,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TTab = "info" | "documents" | "bank";

const emptyBankForm: IKycSubmissionBankData = {
  bankName: "",
  accountType: "corrente",
  agency: "",
  agencyDigit: "",
  account: "",
  accountDigit: "",
  pixKey: "",
  pixKeyType: "cpf",
};

const DOC_DEFINITIONS: { key: TKycSubmissionDocumentKey; label: string }[] = [
  { key: "documentFront", label: "Documento Frente" },
  { key: "documentBack", label: "Documento Verso" },
  { key: "selfie", label: "Selfie com documento" },
  { key: "companyContract", label: "Contrato Social" },
];

export default function SellerKyc() {
  const {
    submission: kyc,
    canSell,
    isLoading,
    invalidateQuery,
  } = useSellerKycSubmissionQuery();

  const [tab, setTab] = useState<TTab>("info");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    personal: false,
    address: false,
  });
  const [editingBank, setEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState<IKycSubmissionBankData>(emptyBankForm);
  const [savingBank, setSavingBank] = useState(false);
  const [bankExpanded, setBankExpanded] = useState(false);
  const [withdrawalDetailsOpen, setWithdrawalDetailsOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    label: string;
    url: string;
  } | null>(null);

  const needsWithdrawalDetails =
    canSell && (!kyc?.zipCode || !kyc?.street || !kyc?.bankData);

  const documentsReview = useMemo(
    () => kyc?.documentsReview ?? {},
    [kyc?.documentsReview],
  );

  const docs = useMemo(() => {
    if (!kyc) return [];

    const base = DOC_DEFINITIONS.filter(
      (doc) => doc.key !== "companyContract" || kyc.personType === "pj",
    );

    return base.map((doc) => ({
      ...doc,
      url: getKycDocumentUrl(kyc.documents, doc.key),
    }));
  }, [kyc]);

  const hasRejected = useMemo(
    () => Object.values(documentsReview).some((r) => r.status === "rejected"),
    [documentsReview],
  );

  useEffect(() => {
    if (hasRejected && tab === "info") setTab("documents");
  }, [hasRejected, tab]);

  const handleReupload = (_docKey: TKycSubmissionDocumentKey, _file: File) => {
    toast.info(
      "Reenvio de documentos ainda não está disponível pela API. Entre em contato com o suporte.",
    );
  };

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const openBankEdit = () => {
    const bd = kyc?.bankData;
    setBankForm({
      bankName: bd?.bankName || "",
      accountType: bd?.accountType || "corrente",
      agency: bd?.agency || "",
      agencyDigit: bd?.agencyDigit || "",
      account: bd?.account || "",
      accountDigit: bd?.accountDigit || "",
      pixKey: bd?.pixKey || "",
      pixKeyType: bd?.pixKeyType || "cpf",
    });
    setEditingBank(true);
  };

  const openBankAdd = () => {
    setBankForm({
      bankName: "",
      accountType: "corrente",
      agency: "",
      agencyDigit: "",
      account: "",
      accountDigit: "",
      pixKey: "",
      pixKeyType: "cpf",
    });
    setEditingBank(true);
  };

  const saveBankData = async () => {
    if (!kyc || !bankForm.bankName || !bankForm.agency || !bankForm.account) {
      toast.error("Preencha pelo menos banco, agência e conta.");
      return;
    }

    toast.info(
      "Atualização de dados bancários ainda não está disponível pela API.",
    );
    setEditingBank(false);
    void invalidateQuery();
    setSavingBank(false);
  };

  const deleteBankData = async () => {
    if (!kyc) return;
    toast.error("É obrigatório ter pelo menos uma conta bancária.");
  };

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-5 py-24 md:px-8">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </SellerLayout>
    );
  }

  if (!kyc) {
    return (
      <SellerLayout>
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-3 px-5 py-24 md:px-8">
          <CircleDot className="text-muted-foreground/30" size={32} />
          <p className="text-sm text-muted-foreground">
            Nenhum KYC encontrado.
          </p>
        </div>
      </SellerLayout>
    );
  }

  const allApproved =
    kyc.status === "approved" &&
    kyc.documentsStatus === "approved" &&
    kyc.bankStatus === "approved" &&
    kyc.addressStatus === "approved";
  const overallStatus = allApproved
    ? "approved"
    : kyc.status === "rejected"
      ? "rejected"
      : "pending";

  const bankData = kyc.bankData;

  const tabStatusMap: Record<TTab, string> = {
    info: kyc.addressStatus || "pending",
    documents: kyc.documentsStatus || "pending",
    bank: kyc.bankStatus || "pending",
  };

  const tabs: { key: TTab; label: string }[] = [
    { key: "info", label: "Informações" },
    { key: "documents", label: "Documentos" },
    { key: "bank", label: "Banco" },
  ];

  const docApproved = docs.filter(
    (d) => documentsReview[d.key]?.status === "approved",
  ).length;
  const docRejected = docs.filter(
    (d) => documentsReview[d.key]?.status === "rejected",
  ).length;
  const progress =
    docs.length > 0 ? Math.round((docApproved / docs.length) * 100) : 0;

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-4xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Conta"
          title="Verificação KYC"
          description={
            allApproved
              ? "Sua verificação foi concluída com sucesso."
              : overallStatus === "rejected"
                ? "Alguns itens precisam da sua atenção."
                : "Estamos analisando seus dados. Isso não deve demorar."
          }
        />

        <div
          className="mb-8 animate-fade-in"
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex items-center gap-6">
            <div
              className={`inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-xs font-medium tracking-wide ${
                allApproved
                  ? "border-success/25 bg-success/10 text-success"
                  : overallStatus === "rejected"
                    ? "border-destructive/25 bg-destructive/10 text-destructive"
                    : "border-warning/25 bg-warning/10 text-warning"
              }`}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  allApproved
                    ? "bg-success"
                    : overallStatus === "rejected"
                      ? "bg-destructive"
                      : "bg-warning"
                } ${!allApproved && overallStatus !== "rejected" ? "animate-pulse" : ""}`}
              />
              {allApproved
                ? "Aprovado"
                : overallStatus === "rejected"
                  ? "Ação necessária"
                  : "Em análise"}
            </div>

            {!allApproved && (
              <div className="flex flex-1 items-center gap-4">
                <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-border/40">
                  <div
                    className="relative h-full overflow-hidden rounded-full bg-primary/70 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  >
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                        animation: "shimmer 2s infinite",
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-xs tabular-nums text-muted-foreground md:text-sm">
                  {docApproved}/{docs.length}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className="mb-6 flex items-center gap-4 overflow-x-auto border-b border-border/40 scrollbar-hide animate-fade-in md:mb-10 md:gap-8"
          style={{ animationDelay: "100ms" }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative whitespace-nowrap pb-3 text-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {t.label}
              {tabStatusMap[t.key] === "pending" && (
                <span className="ml-2 rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-warning md:text-xs">
                  Em análise
                </span>
              )}
              {tabStatusMap[t.key] === "approved" && (
                <span className="ml-2 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-success md:text-xs">
                  Aprovado
                </span>
              )}
              {tab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-foreground" />
              )}
              {t.key === "documents" && docRejected > 0 && (
                <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground md:text-xs">
                  {docRejected}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 pb-6 border-b border-border/30">
              <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
                {kyc.personType === "pj" ? (
                  <Building2 size={16} className="text-muted-foreground" />
                ) : (
                  <User size={16} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {kyc.personType === "pf"
                    ? "Pessoa Física"
                    : "Pessoa Jurídica"}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {kyc.personType === "pf" ? kyc.cpf : kyc.cnpj}
                </p>
              </div>
            </div>

            <CollapsibleSection
              title={
                kyc.personType === "pf" ? "Dados pessoais" : "Dados da empresa"
              }
              expanded={expandedSections.personal}
              onToggle={() => toggleSection("personal")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                <DataRow label="Nome completo" value={kyc.fullName} />
                <DataRow label="E-mail" value={kyc.email} />
                <DataRow label="Telefone" value={kyc.phone} />
                <DataRow
                  label="Data de nascimento"
                  value={
                    kyc.dateOfBirth
                      ? new Date(kyc.dateOfBirth).toLocaleDateString("pt-BR")
                      : null
                  }
                />
                {kyc.personType === "pj" && (
                  <>
                    <DataRow label="Razão Social" value={kyc.companyName} />
                    <DataRow label="Nome Fantasia" value={kyc.tradingName} />
                    <DataRow label="Tipo de Empresa" value={kyc.companyType} />
                    <DataRow label="Atividade" value={kyc.businessActivity} />
                    <DataRow
                      label="Faturamento Mensal"
                      value={kyc.monthlyRevenue}
                    />
                  </>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Endereço"
              expanded={expandedSections.address}
              onToggle={() => toggleSection("address")}
            >
              {!kyc.zipCode ? (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    Endereço ainda não enviado. É necessário para liberar saques.
                  </p>
                  {needsWithdrawalDetails && (
                    <button
                      type="button"
                      onClick={() => setWithdrawalDetailsOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                    >
                      Completar dados para saque
                    </button>
                  )}
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                <DataRow label="CEP" value={kyc.zipCode} mono />
                <DataRow label="Estado" value={kyc.state} />
                <DataRow label="Cidade" value={kyc.city} />
                <DataRow label="Bairro" value={kyc.neighborhood} />
                <DataRow label="Rua" value={kyc.street} />
                <DataRow label="Número" value={kyc.number} />
                {kyc.complement && (
                  <DataRow label="Complemento" value={kyc.complement} />
                )}
              </div>
              )}
            </CollapsibleSection>
          </div>
        )}

        {tab === "documents" && (
          <div className="space-y-3 animate-fade-in">
            {docRejected > 0 && (
              <div className="admin-surface mb-6 flex items-center gap-3 border-destructive/20 px-5 py-4">
                <AlertCircle
                  size={15}
                  className="flex-shrink-0 text-destructive"
                />
                <p className="text-xs text-destructive/80">
                  <span className="font-semibold">
                    {docRejected} documento{docRejected > 1 ? "s" : ""}
                  </span>{" "}
                  precisa{docRejected > 1 ? "m" : ""} ser reenviado
                  {docRejected > 1 ? "s" : ""}.
                </p>
              </div>
            )}

            {docs.map((doc, i) => {
              const review = documentsReview[doc.key];
              const docStatus = review?.status || "pending";
              const isRejected = docStatus === "rejected";
              const isApproved = docStatus === "approved";

              return (
                <div
                  key={doc.key}
                  className={`admin-surface transition-all duration-300 ${
                    isRejected
                      ? "border-destructive/25"
                      : isApproved
                        ? "border-success/25"
                        : ""
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${
                        isApproved
                          ? "bg-success"
                          : isRejected
                            ? "bg-destructive"
                            : "bg-muted-foreground/30"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{doc.label}</p>
                      <p
                        className={`mt-0.5 text-xs md:text-sm ${
                          isApproved
                            ? "text-success/70"
                            : isRejected
                              ? "text-destructive/70"
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {isApproved
                          ? "Aprovado"
                          : isRejected
                            ? "Recusado"
                            : "Aguardando"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.url && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({ label: doc.label, url: doc.url! })
                          }
                          className="rounded-lg p-2 text-muted-foreground/40 transition-all hover:bg-muted/30 hover:text-foreground"
                          title="Ver documento"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {isApproved && (
                        <CheckCircle2 size={16} className="text-success/60" />
                      )}
                      {isRejected && (
                        <XCircle size={16} className="text-destructive/60" />
                      )}
                      {!isApproved && !isRejected && (
                        <Clock size={14} className="text-muted-foreground/30" />
                      )}
                    </div>
                  </div>

                  {isRejected && (
                    <div className="px-5 pb-5">
                      {review?.reason && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/15 bg-destructive/5 px-4 py-3">
                          <AlertCircle
                            size={12}
                            className="mt-0.5 flex-shrink-0 text-destructive/60"
                          />
                          <p className="text-xs leading-relaxed text-destructive/70 md:text-sm">
                            {review.reason}
                          </p>
                        </div>
                      )}
                      <label className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-border/30 py-5 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.02]">
                        <Upload
                          size={14}
                          className="text-muted-foreground/40 transition-colors group-hover:text-primary/60"
                        />
                        <span className="text-xs text-muted-foreground/50 transition-colors group-hover:text-foreground/70">
                          Enviar novo arquivo
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleReupload(doc.key, file);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "bank" && (
          <div className="animate-fade-in">
            {editingBank && (
              <BankEditModal
                bankForm={bankForm}
                setBankForm={setBankForm}
                savingBank={savingBank}
                onClose={() => setEditingBank(false)}
                onSave={saveBankData}
              />
            )}

            <button
              onClick={() => setBankExpanded(!bankExpanded)}
              className="w-full flex items-center gap-3 pb-4 border-b border-border/30 mb-0 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                <Landmark size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {bankData?.bankName || "—"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {bankData?.accountType === "corrente"
                      ? "Conta Corrente"
                      : bankData?.accountType === "poupanca"
                        ? "Poupança"
                        : bankData?.accountType || "—"}
                  </p>
                  <BankStatusBadge status={kyc.bankStatus} />
                </div>
              </div>
              <ChevronRight
                size={14}
                className={`text-muted-foreground/40 transition-transform duration-200 flex-shrink-0 ${
                  bankExpanded ? "rotate-90" : ""
                }`}
              />
            </button>

            {bankExpanded && (
              <div className="pt-4 animate-fade-in">
                <div className="flex items-center justify-end gap-2 mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openBankEdit();
                    }}
                    className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-all"
                    title="Editar conta"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBankData();
                    }}
                    className="p-2 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all"
                    title="Excluir conta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                  <DataRow label="Banco" value={bankData?.bankName} />
                  <DataRow
                    label="Tipo de conta"
                    value={
                      bankData?.accountType === "corrente"
                        ? "Conta Corrente"
                        : bankData?.accountType === "poupanca"
                          ? "Poupança"
                          : bankData?.accountType
                    }
                  />
                  <DataRow
                    label="Agência"
                    value={
                      bankData?.agencyDigit
                        ? `${bankData.agency}-${bankData.agencyDigit}`
                        : bankData?.agency
                    }
                    mono
                  />
                  <DataRow
                    label="Conta"
                    value={
                      bankData?.accountDigit
                        ? `${bankData.account}-${bankData.accountDigit}`
                        : bankData?.account
                    }
                    mono
                  />
                  <DataRow label="Chave PIX" value={bankData?.pixKey} mono />
                  <DataRow
                    label="Tipo de chave PIX"
                    value={bankData?.pixKeyType?.toUpperCase()}
                  />
                </div>
              </div>
            )}

            <button
              onClick={openBankAdd}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/40 text-muted-foreground/60 hover:border-primary/30 hover:text-primary hover:bg-primary/[0.02] transition-all duration-200 text-xs"
            >
              <Plus size={14} />
              Adicionar nova conta bancária
            </button>
          </div>
        )}
      </div>

      {withdrawalDetailsOpen && (
        <KycWithdrawalDetails
          onComplete={() => {
            setWithdrawalDetailsOpen(false);
            void invalidateQuery();
            toast.success("Dados enviados. Aguarde a aprovação para sacar.");
          }}
          onCancel={() => setWithdrawalDetailsOpen(false)}
        />
      )}

      <KycDocumentPreviewModal
        open={!!previewDoc}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
        title={previewDoc?.label ?? "Documento"}
        url={previewDoc?.url ?? null}
      />
    </SellerLayout>
  );
}

function BankStatusBadge({ status }: { status: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        status === "approved"
          ? "border-success/25 bg-success/10 text-success"
          : status === "rejected"
            ? "border-destructive/25 bg-destructive/10 text-destructive"
            : "border-warning/25 bg-warning/10 text-warning"
      }`}
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          status === "approved"
            ? "bg-success"
            : status === "rejected"
              ? "bg-destructive"
              : "bg-warning"
        }`}
      />
      {status === "approved"
        ? "Aprovada"
        : status === "rejected"
          ? "Recusada"
          : "Pendente"}
    </div>
  );
}

function BankEditModal({
  bankForm,
  setBankForm,
  savingBank,
  onClose,
  onSave,
}: {
  bankForm: IKycSubmissionBankData;
  setBankForm: React.Dispatch<React.SetStateAction<IKycSubmissionBankData>>;
  savingBank: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="admin-surface mx-4 w-full max-w-md p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-base font-medium text-foreground">
            Editar conta bancária
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Banco
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={bankForm.bankName}
              onChange={(e) =>
                setBankForm((p) => ({ ...p, bankName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Tipo de conta
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={bankForm.accountType}
              onChange={(e) =>
                setBankForm((p) => ({
                  ...p,
                  accountType: e.target.value as TKycBankAccountType,
                }))
              }
            >
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Agência
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={bankForm.agency}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, agency: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Dígito ag.
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={bankForm.agencyDigit}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, agencyDigit: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Conta
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={bankForm.account}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, account: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Dígito conta
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
                value={bankForm.accountDigit}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, accountDigit: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Chave PIX
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={bankForm.pixKey}
              onChange={(e) =>
                setBankForm((p) => ({ ...p, pixKey: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Tipo de chave PIX
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={bankForm.pixKeyType}
              onChange={(e) =>
                setBankForm((p) => ({
                  ...p,
                  pixKeyType: e.target.value as TKycPixKeyType,
                }))
              }
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={savingBank}
            className="flex-1 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingBank ? <Loader2 size={14} className="animate-spin" /> : null}
            Salvar
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/20 pb-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full py-3 group"
      >
        <ChevronRight
          size={14}
          className={`text-muted-foreground/40 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {title}
        </span>
      </button>
      {expanded && <div className="pb-4 pl-6 animate-fade-in">{children}</div>}
    </div>
  );
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-border/10 last:border-0">
      <span className="text-xs text-muted-foreground/60">{label}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
