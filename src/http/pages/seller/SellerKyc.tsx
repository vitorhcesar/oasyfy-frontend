import { SellerLayout } from "@/http/components/seller/SellerLayout";
import { useAuthStore } from "@/http/stores/useAuthStore";
import { supabase } from "@/infra/integrations/supabase/client";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TTab = "info" | "documents" | "bank";

interface IBankAccount {
  bankName: string;
  accountType: string;
  agency: string;
  agencyDigit?: string;
  account: string;
  accountDigit?: string;
  pixKey: string;
  pixKeyType: string;
}

const DOC_URL_KEYS: Record<string, string> = {
  document_front: "document_front_url",
  document_back: "document_back_url",
  selfie: "selfie_url",
  proof_of_address: "proof_of_address_url",
  company_contract: "company_contract_url",
};

export default function SellerKyc() {
  const { user } = useAuthStore();
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TTab>("info");
  const [uploading, setUploading] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    personal: false,
    address: false,
  });
  const [editingBank, setEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState<IBankAccount>({
    bankName: "",
    accountType: "corrente",
    agency: "",
    agencyDigit: "",
    account: "",
    accountDigit: "",
    pixKey: "",
    pixKeyType: "cpf",
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankExpanded, setBankExpanded] = useState(false);

  const fetchKyc = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);
    if (data && data.length > 0) setKyc(data[0]);
    setLoading(false);
  };

  useEffect(() => {
    fetchKyc();
  }, [user]);

  const handleReupload = async (docKey: string, file: File) => {
    if (!user || !kyc) return;
    setUploading(docKey);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${docKey}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(path, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("kyc-documents").getPublicUrl(path);
      const urlField = DOC_URL_KEYS[docKey];
      const documentsReviewData = (kyc.documents_review || {}) as Record<
        string,
        unknown
      >;
      const newReview = {
        ...documentsReviewData,
        [docKey]: { status: "pending" },
      };
      const updatePayload = {
        [urlField]: publicUrl,
        documents_review: newReview,
        documents_status: "pending",
      };
      const { error: updateError } = await supabase
        .from("kyc_submissions")
        .update(updatePayload)
        .eq("id", kyc.id);
      if (updateError) throw updateError;
      toast.success("Documento reenviado com sucesso!");
      setKyc((prev: unknown) =>
        prev ? { ...(prev as object), ...updatePayload } : prev
      );
      await fetchKyc();
    } catch (e) {
      console.error(e);

      if (e instanceof Error) {
        toast.error("Erro ao enviar: " + e.message);
      } else {
        toast.error("Erro ao enviar: " + String(e));
      }
    } finally {
      setUploading(null);
    }
  };

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const openBankEdit = () => {
    const bd = kyc?.bank_data || {};
    setBankForm({
      bankName: bd.bankName || "",
      accountType: bd.accountType || "corrente",
      agency: bd.agency || "",
      agencyDigit: bd.agencyDigit || "",
      account: bd.account || "",
      accountDigit: bd.accountDigit || "",
      pixKey: bd.pixKey || "",
      pixKeyType: bd.pixKeyType || "cpf",
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

    setSavingBank(true);

    try {
      await supabase
        .from("kyc_submissions")
        .update({
          bank_data: bankForm,
          bank_status: "pending",
        })
        .eq("id", kyc.id);
      toast.success("Dados bancários atualizados!");
      setEditingBank(false);
      await fetchKyc();
    } catch (e) {
      console.error(e);

      if (e instanceof Error) {
        toast.error("Erro: " + e.message);
      } else {
        toast.error("Erro: " + String(e));
      }
    } finally {
      setSavingBank(false);
    }
  };

  const deleteBankData = async () => {
    if (!kyc) return;
    toast.error("É obrigatório ter pelo menos uma conta bancária.");
  };

  const kycReview = kyc?.documents_review as Record<
    string,
    { status: string }
  > | null;
  const hasRejected = kycReview
    ? Object.values(kycReview).some((r) => r.status === "rejected")
    : false;

  useEffect(() => {
    if (hasRejected && tab === "info") setTab("documents");
  }, [hasRejected]);

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-border" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            </div>
            <p className="text-xs text-muted-foreground tracking-wide">
              Carregando...
            </p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (!kyc) {
    return (
      <SellerLayout>
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-3">
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
    kyc.documents_status === "approved" &&
    kyc.bank_status === "approved" &&
    kyc.address_status === "approved";
  const overallStatus = allApproved
    ? "approved"
    : kyc.status === "rejected"
    ? "rejected"
    : "pending";

  const bankData = kyc.bank_data || {};
  const documentsReview = (kyc.documents_review || {}) as Record<
    string,
    { status: string; reason?: string }
  >;

  const docs = [
    {
      key: "document_front",
      label: "Documento Frente",
      url: kyc.document_front_url,
    },
    {
      key: "document_back",
      label: "Documento Verso",
      url: kyc.document_back_url,
    },
    { key: "selfie", label: "Selfie com documento", url: kyc.selfie_url },
    {
      key: "proof_of_address",
      label: "Comprovante de endereço",
      url: kyc.proof_of_address_url,
    },
    ...(kyc.person_type === "pj"
      ? [
          {
            key: "company_contract",
            label: "Contrato Social",
            url: kyc.company_contract_url,
          },
        ]
      : []),
  ];

  const tabStatusMap: Record<TTab, string> = {
    info: kyc.address_status || "pending",
    documents: kyc.documents_status || "pending",
    bank: kyc.bank_status || "pending",
  };

  const tabs: { key: TTab; label: string }[] = [
    { key: "info", label: "Informações" },
    { key: "documents", label: "Documentos" },
    { key: "bank", label: "Banco" },
  ];

  const docApproved = docs.filter(
    (d) => documentsReview[d.key]?.status === "approved"
  ).length;
  const docRejected = docs.filter(
    (d) => documentsReview[d.key]?.status === "rejected"
  ).length;
  const progress =
    docs.length > 0 ? Math.round((docApproved / docs.length) * 100) : 0;

  return (
    <SellerLayout>
      <div className="px-4 md:px-6 lg:px-12 py-6 md:py-10 max-w-4xl mx-auto">
        {/* Minimal header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-light text-foreground tracking-tight">
            Status KYC
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-light">
            {allApproved
              ? "Sua verificação foi concluída com sucesso."
              : overallStatus === "rejected"
              ? "Alguns itens precisam da sua atenção."
              : "Estamos analisando seus dados. Isso não deve demorar."}
          </p>
        </div>

        {/* Status pill + progress */}
        <div
          className="mb-10 animate-fade-in"
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex items-center gap-6">
            <div
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide border ${
                allApproved
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : overallStatus === "rejected"
                  ? "border-destructive/20 bg-destructive/5 text-destructive"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  allApproved
                    ? "bg-primary"
                    : overallStatus === "rejected"
                    ? "bg-destructive"
                    : "bg-muted-foreground"
                } ${
                  !allApproved && overallStatus !== "rejected"
                    ? "animate-pulse"
                    : ""
                }`}
              />
              {allApproved
                ? "Aprovado"
                : overallStatus === "rejected"
                ? "Ação necessária"
                : "Em análise"}
            </div>

            {!allApproved && (
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 h-[3px] bg-border/40 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                    style={{
                      width: `${progress}%`,
                      background:
                        "linear-gradient(90deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.8))",
                    }}
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
                <span className="text-xs md:text-sm text-muted-foreground font-mono tabular-nums">
                  {docApproved}/{docs.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs — underline style */}
        <div
          className="flex items-center gap-4 md:gap-8 border-b border-border/40 mb-6 md:mb-10 overflow-x-auto scrollbar-hide animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${
                tab === t.key
                  ? "text-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {t.label}
              {tabStatusMap[t.key] === "pending" && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200/60 text-amber-700 text-[11px] md:text-xs font-semibold tracking-wide">
                  Em análise
                </span>
              )}
              {tabStatusMap[t.key] === "approved" && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] md:text-xs font-semibold tracking-wide">
                  Aprovado
                </span>
              )}
              {tab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
              )}
              {t.key === "documents" && docRejected > 0 && (
                <span className="ml-2 w-4 h-4 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[11px] md:text-xs font-bold">
                  {docRejected}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab === "info" && (
          <div className="space-y-6 animate-fade-in">
            {/* Type badge */}
            <div className="flex items-center gap-3 pb-6 border-b border-border/30">
              <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
                {kyc.person_type === "pj" ? (
                  <Building2 size={16} className="text-muted-foreground" />
                ) : (
                  <User size={16} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {kyc.person_type === "pf"
                    ? "Pessoa Física"
                    : "Pessoa Jurídica"}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {kyc.person_type === "pf" ? kyc.cpf : kyc.cnpj}
                </p>
              </div>
            </div>

            {/* Personal */}
            <CollapsibleSection
              title={
                kyc.person_type === "pf" ? "Dados pessoais" : "Dados da empresa"
              }
              expanded={expandedSections.personal}
              onToggle={() => toggleSection("personal")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                <DataRow label="Nome completo" value={kyc.full_name} />
                <DataRow label="E-mail" value={kyc.email} />
                <DataRow label="Telefone" value={kyc.phone} />
                <DataRow
                  label="Data de nascimento"
                  value={
                    kyc.date_of_birth
                      ? new Date(kyc.date_of_birth).toLocaleDateString("pt-BR")
                      : null
                  }
                />
                {kyc.person_type === "pj" && (
                  <>
                    <DataRow label="Razão Social" value={kyc.company_name} />
                    <DataRow label="Nome Fantasia" value={kyc.trading_name} />
                    <DataRow label="Tipo de Empresa" value={kyc.company_type} />
                    <DataRow label="Atividade" value={kyc.business_activity} />
                    <DataRow
                      label="Faturamento Mensal"
                      value={kyc.monthly_revenue}
                    />
                  </>
                )}
              </div>
            </CollapsibleSection>

            {/* Address */}
            <CollapsibleSection
              title="Endereço"
              expanded={expandedSections.address}
              onToggle={() => toggleSection("address")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
                <DataRow label="CEP" value={kyc.zip_code} mono />
                <DataRow label="Estado" value={kyc.state} />
                <DataRow label="Cidade" value={kyc.city} />
                <DataRow label="Bairro" value={kyc.neighborhood} />
                <DataRow label="Rua" value={kyc.street} />
                <DataRow label="Número" value={kyc.number} />
                {kyc.complement && (
                  <DataRow label="Complemento" value={kyc.complement} />
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* Documents tab */}
        {tab === "documents" && (
          <div className="space-y-3 animate-fade-in">
            {docRejected > 0 && (
              <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/[0.04] border border-destructive/10 mb-6">
                <AlertCircle
                  size={15}
                  className="text-destructive flex-shrink-0"
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
                  className={`rounded-xl border transition-all duration-300 ${
                    isRejected
                      ? "border-destructive/15 bg-destructive/[0.02]"
                      : isApproved
                      ? "border-primary/15 bg-primary/[0.02]"
                      : "border-border/30 bg-card/50"
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Status indicator */}
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isApproved
                          ? "bg-primary"
                          : isRejected
                          ? "bg-destructive"
                          : "bg-muted-foreground/30"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{doc.label}</p>
                      <p
                        className={`text-xs md:text-sm mt-0.5 ${
                          isApproved
                            ? "text-primary/70"
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
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-all"
                          title="Ver documento"
                        >
                          <Eye size={14} />
                        </a>
                      )}
                      {isApproved && (
                        <CheckCircle2 size={16} className="text-primary/60" />
                      )}
                      {isRejected && (
                        <XCircle size={16} className="text-destructive/60" />
                      )}
                      {!isApproved && !isRejected && (
                        <Clock size={14} className="text-muted-foreground/30" />
                      )}
                    </div>
                  </div>

                  {/* Rejection area */}
                  {isRejected && (
                    <div className="px-5 pb-5">
                      {review?.reason && (
                        <div className="flex items-start gap-2 mb-4 px-4 py-3 rounded-lg bg-destructive/[0.04] border border-destructive/8">
                          <AlertCircle
                            size={12}
                            className="text-destructive/60 mt-0.5 flex-shrink-0"
                          />
                          <p className="text-xs md:text-sm text-destructive/70 leading-relaxed">
                            {review.reason}
                          </p>
                        </div>
                      )}
                      <label
                        className={`group flex items-center justify-center gap-3 w-full py-5 rounded-lg border border-dashed cursor-pointer transition-all duration-300 ${
                          uploading === doc.key
                            ? "border-primary/30 bg-primary/[0.03]"
                            : "border-border/30 hover:border-primary/30 hover:bg-primary/[0.02]"
                        }`}
                      >
                        {uploading === doc.key ? (
                          <>
                            <Loader2
                              size={16}
                              className="animate-spin text-primary/60"
                            />
                            <span className="text-xs text-primary/60">
                              Enviando...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload
                              size={14}
                              className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors"
                            />
                            <span className="text-xs text-muted-foreground/50 group-hover:text-foreground/70 transition-colors">
                              Enviar novo arquivo
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          disabled={uploading !== null}
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

        {/* Bank tab */}
        {tab === "bank" && (
          <div className="animate-fade-in">
            {/* Edit modal */}
            {editingBank && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-md mx-4 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-medium text-foreground">
                      Editar conta bancária
                    </h3>
                    <button
                      onClick={() => setEditingBank(false)}
                      className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
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
                          setBankForm((p) => ({
                            ...p,
                            bankName: e.target.value,
                          }))
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
                            accountType: e.target.value,
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
                            setBankForm((p) => ({
                              ...p,
                              agency: e.target.value,
                            }))
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
                            setBankForm((p) => ({
                              ...p,
                              agencyDigit: e.target.value,
                            }))
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
                            setBankForm((p) => ({
                              ...p,
                              account: e.target.value,
                            }))
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
                            setBankForm((p) => ({
                              ...p,
                              accountDigit: e.target.value,
                            }))
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
                            pixKeyType: e.target.value,
                          }))
                        }
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Aleatória</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => setEditingBank(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveBankData}
                      disabled={savingBank}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {savingBank ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bank header - clickable to toggle */}
            <button
              onClick={() => setBankExpanded(!bankExpanded)}
              className="w-full flex items-center gap-3 pb-4 border-b border-border/30 mb-0 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
                <Landmark size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {bankData.bankName || "—"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {bankData.accountType === "corrente"
                      ? "Conta Corrente"
                      : bankData.accountType === "poupanca"
                      ? "Poupança"
                      : bankData.accountType || "—"}
                  </p>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${
                      kyc.bank_status === "approved"
                        ? "border-primary/20 bg-primary/5 text-primary"
                        : kyc.bank_status === "rejected"
                        ? "border-destructive/20 bg-destructive/5 text-destructive"
                        : "border-border bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        kyc.bank_status === "approved"
                          ? "bg-primary"
                          : kyc.bank_status === "rejected"
                          ? "bg-destructive"
                          : "bg-muted-foreground"
                      }`}
                    />
                    {kyc.bank_status === "approved"
                      ? "Aprovada"
                      : kyc.bank_status === "rejected"
                      ? "Recusada"
                      : "Pendente"}
                  </div>
                </div>
              </div>
              <ChevronRight
                size={14}
                className={`text-muted-foreground/40 transition-transform duration-200 flex-shrink-0 ${
                  bankExpanded ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Collapsible details */}
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
                  <DataRow label="Banco" value={bankData.bankName} />
                  <DataRow
                    label="Tipo de conta"
                    value={
                      bankData.accountType === "corrente"
                        ? "Conta Corrente"
                        : bankData.accountType === "poupanca"
                        ? "Poupança"
                        : bankData.accountType
                    }
                  />
                  <DataRow
                    label="Agência"
                    value={
                      bankData.agencyDigit
                        ? `${bankData.agency}-${bankData.agencyDigit}`
                        : bankData.agency
                    }
                    mono
                  />
                  <DataRow
                    label="Conta"
                    value={
                      bankData.accountDigit
                        ? `${bankData.account}-${bankData.accountDigit}`
                        : bankData.account
                    }
                    mono
                  />
                  <DataRow label="Chave PIX" value={bankData.pixKey} mono />
                  <DataRow
                    label="Tipo de chave PIX"
                    value={bankData.pixKeyType?.toUpperCase()}
                  />
                </div>
              </div>
            )}

            {/* Add new bank account button */}
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
    </SellerLayout>
  );
}

/* ── Sub-components ── */

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
