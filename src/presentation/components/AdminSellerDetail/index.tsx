import { supabase } from "@/infra/integrations/supabase/client";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  Check,
  CheckCircle,
  ChevronDown,
  DollarSign,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  Shield,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type KycSubmission = {
  id: string;
  user_id: string;
  full_name: string;
  person_type: "pf" | "pj";
  cpf: string | null;
  cnpj: string | null;
  company_name: string | null;
  company_type: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  city: string;
  state: string;
  street: string;
  number: string;
  neighborhood: string;
  zip_code: string;
  complement: string | null;
  bank_data: any;
  address_status: string;
  bank_status: string;
  documents_status: string;
  rejection_reason: string | null;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  proof_of_address_url: string | null;
  company_contract_url: string | null;
  is_banned: boolean;
  withdrawals_blocked: boolean;
  withdrawal_block_reason: string | null;
  email_manually_approved?: boolean;
};
type Tab = "kyc" | "documents" | "bank" | "fees" | "balance";

interface IAdminSellerDetailProps {
  seller: KycSubmission;
  onBack: () => void;
  onUpdate: () => void;
}

function formatCurrencyAdmin(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const statusDot = (status: string) => {
  if (status === "approved") return "bg-primary";
  if (status === "rejected") return "bg-destructive";
  return "bg-muted-foreground/40";
};

const statusText = (status: string) => {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Recusado";
  return "Pendente";
};

export function AdminSellerDetail({
  seller,
  onBack,
  onUpdate,
}: IAdminSellerDetailProps) {
  const [tab, setTab] = useState<Tab>("kyc");
  const [actionLoading, setActionLoading] = useState(false);
  const [docRejectingKey, setDocRejectingKey] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressRejectReason, setAddressRejectReason] = useState("");
  const [showAddressReject, setShowAddressReject] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [manualEmailApprovalLoading, setManualEmailApprovalLoading] =
    useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  // Fees state
  const [fees, setFees] = useState<Record<string, number>>({});
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesSaving, setFeesSaving] = useState(false);
  const [feesId, setFeesId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "fees") {
      setFeesLoading(true);
      supabase
        .from("seller_fees")
        .select("*")
        .eq("seller_id", seller.user_id)
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const row = data[0];
            setFeesId(row.id);
            const f: Record<string, number> = {};
            for (const k of Object.keys(row)) {
              if (k.endsWith("_fee") || k.endsWith("_days"))
                f[k] = Number((row as Record<string, unknown>)[k]) || 0;
            }
            setFees(f);
          } else {
            setFeesId(null);
            setFees({});
          }
          setFeesLoading(false);
        });
    }
  }, [tab, seller.user_id]);

  // Balance state
  interface IBalanceData {
    available: number;
    retained: number;
    totalSalesCount: number;
    totalSalesAmount: number;
    grossSalesAmount: number;
    earnedFeesAmount: number;
    refundCount: number;
    refundAmount: number;
    withdrawnAmount: number;
  }
  const [balanceData, setBalanceData] = useState<IBalanceData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (tab !== "balance") return;
    setBalanceLoading(true);
    Promise.all([
      supabase
        .from("transactions")
        .select("amount, fee_amount, status, method, created_at")
        .eq("seller_id", seller.user_id),
      supabase
        .from("seller_fees")
        .select(
          "pix_retention_days, card_retention_days, boleto_retention_days, crypto_retention_days",
        )
        .eq("seller_id", seller.user_id)
        .limit(1),
    ]).then(([txRes, feesRes]) => {
      const txs = (txRes.data ?? []) as any[];
      const f = (feesRes.data?.[0] as any) || {};
      const now = new Date();

      const sales = txs.filter(
        (t) => t.method !== "withdrawal" && t.amount > 0,
      );
      const paid = sales.filter(
        (t) => t.status === "completed" || t.status === "paid",
      );
      const refunds = txs.filter((t) => t.status === "refunded");
      const withdrawals = txs.filter(
        (t) =>
          t.method === "withdrawal" &&
          (t.status === "completed" || t.status === "paid"),
      );

      const totalGrossSales = paid.reduce(
        (s: number, t: any) => s + t.amount,
        0,
      );
      const totalFeesEarned = paid.reduce(
        (s: number, t: any) => s + (t.fee_amount || 0),
        0,
      );
      const totalPaid = totalGrossSales;
      const totalWithdrawn = Math.abs(
        withdrawals.reduce((s: number, t: any) => s + t.amount, 0),
      );
      const totalRefunded = refunds.reduce(
        (s: number, t: any) => s + Math.abs(t.amount),
        0,
      );

      const retained = paid
        .filter((t: any) => {
          const days =
            t.method === "pix"
              ? f.pix_retention_days || 0
              : t.method === "card"
                ? f.card_retention_days || 0
                : t.method === "boleto"
                  ? f.boleto_retention_days || 0
                  : f.crypto_retention_days || 0;
          if (!days) return false;
          return (
            new Date(new Date(t.created_at).getTime() + days * 86400000) > now
          );
        })
        .reduce((s: number, t: any) => s + t.amount, 0);

      setBalanceData({
        available: totalPaid - totalWithdrawn - retained - totalRefunded,
        retained,
        totalSalesCount: paid.length,
        totalSalesAmount: totalPaid,
        grossSalesAmount: totalGrossSales,
        earnedFeesAmount: totalFeesEarned,
        refundCount: refunds.length,
        refundAmount: totalRefunded,
        withdrawnAmount: totalWithdrawn,
      });
      setBalanceLoading(false);
    });
  }, [tab, seller.user_id]);

  const saveFees = async () => {
    setFeesSaving(true);
    try {
      if (feesId) {
        await supabase
          .from("seller_fees")
          .update(fees as any)
          .eq("id", feesId);
      } else {
        await supabase
          .from("seller_fees")
          .insert({ seller_id: seller.user_id, ...fees } as any);
      }
      toast.success("Taxas salvas!");
    } catch (e: any) {
      toast.error("Erro ao salvar taxas");
    }
    setFeesSaving(false);
  };

  const sendApprovalEmail = async () => {
    if (!seller.email) return;
    try {
      await supabase.functions.invoke("send-approval-email", {
        body: { seller_email: seller.email, seller_name: seller.full_name },
      });
    } catch (err) {
      console.error("Erro ao enviar e-mail de aprovação:", err);
    }
  };

  const handleManualEmailApproval = async () => {
    if (!seller.email) {
      toast.error("Seller sem e-mail cadastrado");
      return;
    }

    setManualEmailApprovalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "approve-seller-email",
        {
          body: {
            user_id: seller.user_id,
            seller_email: seller.email,
            seller_name: seller.full_name,
          },
        },
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("E-mail aprovado manualmente");
      setActionsOpen(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao aprovar e-mail");
    }
    setManualEmailApprovalLoading(false);
  };

  const autoApproveIfComplete = async (
    overrides: Record<string, string> = {},
  ) => {
    const merged = {
      documents_status: seller.documents_status,
      bank_status: seller.bank_status,
      address_status: seller.address_status,
      ...overrides,
    };
    if (
      merged.documents_status === "approved" &&
      merged.bank_status === "approved" &&
      merged.address_status === "approved"
    ) {
      await supabase
        .from("kyc_submissions")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", seller.id);
      await sendApprovalEmail();
    }
  };

  const handleAddressApprove = async () => {
    setAddressLoading(true);
    await supabase
      .from("kyc_submissions")
      .update({ address_status: "approved" })
      .eq("id", seller.id);
    await autoApproveIfComplete({ address_status: "approved" });
    toast.success("Endereço aprovado!");
    setAddressLoading(false);
    onUpdate();
  };

  const handleAddressReject = async () => {
    if (!addressRejectReason.trim()) return;
    setAddressLoading(true);
    await supabase
      .from("kyc_submissions")
      .update({ address_status: "rejected" })
      .eq("id", seller.id);
    toast.success("Endereço recusado.");
    setAddressLoading(false);
    setShowAddressReject(false);
    setAddressRejectReason("");
    onUpdate();
  };

  const handleApprove = async () => {
    setActionLoading(true);
    await supabase
      .from("kyc_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", seller.id);
    await sendApprovalEmail();
    onUpdate();
  };

  const checkAndUpdateDocumentsStatus = (
    updatedReview: Record<string, any>,
  ) => {
    const docKeys = [
      "document_front",
      "document_back",
      "selfie",
      "proof_of_address",
      ...(seller.person_type === "pj" ? ["company_contract"] : []),
    ];
    const allDocsApproved = docKeys.every(
      (k) => updatedReview[k]?.status === "approved",
    );
    const anyRejected = docKeys.some(
      (k) => updatedReview[k]?.status === "rejected",
    );
    return allDocsApproved ? "approved" : anyRejected ? "rejected" : "pending";
  };

  const handleReject = async () => {
    setActionLoading(true);
    await supabase
      .from("kyc_submissions")
      .update({
        status: "rejected",
        rejection_reason: "Não atende aos critérios",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", seller.id);
    onUpdate();
  };

  const allApproved =
    seller.documents_status === "approved" &&
    seller.bank_status === "approved" &&
    seller.address_status === "approved";
  const effectiveStatus =
    allApproved && seller.status === "approved"
      ? "approved"
      : seller.status === "rejected"
        ? "rejected"
        : "pending";

  // Count pending items per tab
  const docReview = ((seller as any).documents_review || {}) as Record<
    string,
    { status: string }
  >;
  const docKeys = [
    "document_front",
    "document_back",
    "selfie",
    "proof_of_address",
    ...(seller.person_type === "pj" ? ["company_contract"] : []),
  ];
  const pendingDocs = docKeys.filter(
    (k) => !docReview[k] || docReview[k].status === "pending",
  ).length;
  const pendingKyc = seller.address_status === "pending" ? 1 : 0;
  const pendingBank = seller.bank_status === "pending" ? 1 : 0;

  const tabs: { key: Tab; label: string; pending: number }[] = [
    { key: "kyc", label: "Cadastro", pending: pendingKyc },
    { key: "documents", label: "Documentos", pending: pendingDocs },
    { key: "bank", label: "Banco", pending: pendingBank },
    { key: "fees", label: "Taxas", pending: 0 },
    { key: "balance", label: "Saldo", pending: 0 },
  ];

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-lg font-semibold text-foreground">
            {seller.full_name}
          </h1>
          <span className="text-xs font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase">
            {seller.person_type === "pj" ? "PJ" : "PF"}
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${statusDot(
                effectiveStatus,
              )}`}
            />
            <span className="text-xs text-muted-foreground">
              {statusText(effectiveStatus)}
            </span>
          </div>

          {/* Ações dropdown */}
          <div className="relative ml-auto">
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              Ações
              <ChevronDown
                size={12}
                className={`transition-transform ${
                  actionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {actionsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setActionsOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
                  <button
                    onClick={async () => {
                      setActionsOpen(false);
                      const newVal = !seller.is_banned;
                      const { error } = await supabase
                        .from("kyc_submissions")
                        .update({ is_banned: newVal })
                        .eq("id", seller.id);
                      if (error) {
                        toast.error("Erro ao atualizar");
                        return;
                      }
                      toast.success(
                        newVal ? "Seller banido" : "Seller desbanido",
                      );
                      onUpdate();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Ban size={14} />
                    {seller.is_banned ? "Desbanir seller" : "Banir seller"}
                  </button>
                  <button
                    onClick={() => {
                      setActionsOpen(false);
                      if (seller.withdrawals_blocked) {
                        // Unblock directly
                        (async () => {
                          const { error } = await supabase
                            .from("kyc_submissions")
                            .update({
                              withdrawals_blocked: false,
                              withdrawal_block_reason: null,
                            })
                            .eq("id", seller.id);
                          if (error) {
                            toast.error("Erro ao atualizar");
                            return;
                          }
                          toast.success("Saque liberado");
                          onUpdate();
                        })();
                      } else {
                        setBlockReason("");
                        setShowBlockReasonModal(true);
                      }
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Lock size={14} />
                    {seller.withdrawals_blocked
                      ? "Liberar saque"
                      : "Travar saque"}
                  </button>
                  <button
                    onClick={handleManualEmailApproval}
                    disabled={
                      manualEmailApprovalLoading ||
                      !seller.email ||
                      !!seller.email_manually_approved
                    }
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {manualEmailApprovalLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle
                        size={14}
                        className={
                          seller.email_manually_approved ? "text-primary" : ""
                        }
                      />
                    )}
                    {seller.email_manually_approved
                      ? "E-mail aprovado"
                      : "Aprovar e-mail"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div className="flex items-center gap-5 mt-3">
          {seller.phone && (
            <button
              onClick={() => copyToClipboard(seller.phone, "Telefone")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone size={12} />
              {seller.phone}
            </button>
          )}
          {seller.email && (
            <button
              onClick={() => copyToClipboard(seller.email, "E-mail")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail size={12} />
              {seller.email}
              {seller.email_manually_approved ? (
                <ShieldCheck size={12} className="text-primary" />
              ) : (
                <Shield size={12} className="text-muted-foreground/50" />
              )}
            </button>
          )}
          <span className="text-xs text-muted-foreground/50">
            {new Date(seller.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border/40 mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${
              tab === t.key
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            {t.label}
            {t.pending > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[11px] md:text-xs font-bold leading-none">
                {t.pending}
              </span>
            )}
            {tab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
        ))}
      </div>

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
                    await supabase
                      .from("kyc_submissions")
                      .update({ address_status: "rejected" })
                      .eq("id", seller.id);
                    toast.success("Endereço recusado.");
                    setAddressLoading(false);
                    onUpdate();
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
            {[
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
                      key: "company_contract",
                      label: "Contrato social",
                      url: seller.company_contract_url,
                    },
                  ]
                : []),
            ].map((doc) => {
              const review = ((seller as any).documents_review || {}) as Record<
                string,
                { status: string; reason?: string }
              >;
              const docReview = review[doc.key];
              const docStatus = docReview?.status || "pending";

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
                              const currentReview =
                                (seller as any).documents_review || {};
                              const updated = {
                                ...currentReview,
                                [doc.key]: { status: "approved" },
                              };
                              const newDocStatus =
                                checkAndUpdateDocumentsStatus(updated);
                              await supabase
                                .from("kyc_submissions")
                                .update({
                                  documents_review: updated,
                                  documents_status: newDocStatus,
                                } as any)
                                .eq("id", seller.id);
                              if (newDocStatus === "approved")
                                await autoApproveIfComplete({
                                  documents_status: "approved",
                                });
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
                            const currentReview =
                              (seller as any).documents_review || {};
                            const updated = {
                              ...currentReview,
                              [doc.key]: { status: "approved" },
                            };
                            const newDocStatus =
                              checkAndUpdateDocumentsStatus(updated);
                            await supabase
                              .from("kyc_submissions")
                              .update({
                                documents_review: updated,
                                documents_status: newDocStatus,
                              } as any)
                              .eq("id", seller.id);
                            if (newDocStatus === "approved")
                              await autoApproveIfComplete({
                                documents_status: "approved",
                              });
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
                          const currentReview =
                            (seller as any).documents_review || {};
                          const updated = {
                            ...currentReview,
                            [doc.key]: {
                              status: "rejected",
                              reason: docRejectReason.trim(),
                            },
                          };
                          const newDocStatus =
                            checkAndUpdateDocumentsStatus(updated);
                          await supabase
                            .from("kyc_submissions")
                            .update({
                              documents_review: updated,
                              documents_status: newDocStatus,
                            } as any)
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
                      await autoApproveIfComplete({ bank_status: "approved" });
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
      {/* Fees Tab */}
      {tab === "fees" && (
        <div className="animate-fade-in">
          {feesLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="space-y-3">
              {(
                [
                  { title: "Pix", prefix: "pix", hasRetention: true },
                  {
                    title: "Cartão de Crédito",
                    prefix: "card",
                    hasRetention: true,
                  },
                  { title: "Boleto", prefix: "boleto", hasRetention: true },
                  { title: "Cripto", prefix: "crypto", hasRetention: true },
                  {
                    title: "Saque",
                    prefix: "withdrawal",
                    hasRetention: false,
                    isWithdrawal: true,
                  },
                ] as const
              ).map((item) => (
                <FeeSection
                  key={item.prefix}
                  title={item.title}
                  prefix={item.prefix}
                  hasRetention={item.hasRetention}
                  isWithdrawal={"isWithdrawal" in item}
                  fees={fees}
                  setFees={setFees}
                  onSave={saveFees}
                  saving={feesSaving}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Balance Tab */}
      {tab === "balance" && (
        <div className="animate-fade-in">
          {balanceLoading || !balanceData ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Available balance highlight */}
              <BalanceEditor
                available={balanceData.available}
                sellerId={seller.user_id}
                onUpdated={() => {
                  setBalanceLoading(true);
                  setBalanceData(null);
                  // re-trigger the effect
                  const t = tab;
                  setTab("kyc");
                  setTimeout(() => setTab(t), 10);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                {/* Retained */}
                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Lock size={13} className="text-amber-500" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Saldo retido
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyAdmin(balanceData.retained)}
                  </p>
                </div>

                {/* Withdrawn */}
                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
                      <ArrowUpRight
                        size={13}
                        className="text-muted-foreground"
                      />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total sacado (aprovado)
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyAdmin(balanceData.withdrawnAmount)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowDownLeft size={13} className="text-primary" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Vendas realizadas
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {balanceData.totalSalesCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Líquido movimentado:{" "}
                    {formatCurrencyAdmin(balanceData.totalSalesAmount)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                      <DollarSign size={13} className="text-foreground" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Volume bruto vendido
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyAdmin(balanceData.grossSalesAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Valor total em R$ das vendas aprovadas
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
                      <DollarSign size={13} className="text-warning" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Taxas geradas
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrencyAdmin(balanceData.earnedFeesAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Lucro obtido nas taxas desse seller
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <RotateCcw size={13} className="text-destructive" />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Reembolsos
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {balanceData.refundCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrencyAdmin(balanceData.refundAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
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

function FeeSection({
  title,
  prefix,
  hasRetention,
  isWithdrawal,
  fees,
  setFees,
  onSave,
  saving,
}: {
  title: string;
  prefix: string;
  hasRetention: boolean;
  isWithdrawal?: boolean;
  fees: Record<string, number>;
  setFees: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onSave: () => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/30 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FeeInput
              label="Taxa fixa (R$)"
              value={fees[`${prefix}_fixed_fee`] ?? 0}
              onChange={(v) =>
                setFees((f) => ({ ...f, [`${prefix}_fixed_fee`]: v }))
              }
            />
            <FeeInput
              label="Taxa variável (%)"
              value={fees[`${prefix}_variable_fee`] ?? 0}
              onChange={(v) =>
                setFees((f) => ({ ...f, [`${prefix}_variable_fee`]: v }))
              }
            />
            <FeeInput
              label="Taxa mínima (R$)"
              value={fees[`${prefix}_min_fee`] ?? 0}
              onChange={(v) =>
                setFees((f) => ({ ...f, [`${prefix}_min_fee`]: v }))
              }
            />
            {hasRetention && (
              <>
                <FeeInput
                  label="Retenção (%)"
                  value={fees[`${prefix}_retention_fee`] ?? 0}
                  onChange={(v) =>
                    setFees((f) => ({ ...f, [`${prefix}_retention_fee`]: v }))
                  }
                />
                <FeeInput
                  label="Dias retenção"
                  value={fees[`${prefix}_retention_days`] ?? 0}
                  onChange={(v) =>
                    setFees((f) => ({ ...f, [`${prefix}_retention_days`]: v }))
                  }
                  step={1}
                />
              </>
            )}
          </div>
          {isWithdrawal && (
            <>
              <div className="border-t border-border/30 pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Limites de saque
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FeeInput
                    label="Mínimo por saque (R$)"
                    value={fees.withdrawal_min_amount ?? 0}
                    onChange={(v) =>
                      setFees((f) => ({ ...f, withdrawal_min_amount: v }))
                    }
                    step={1}
                  />
                  <FeeInput
                    label="Máximo por saque (R$)"
                    value={fees.withdrawal_max_amount ?? 0}
                    onChange={(v) =>
                      setFees((f) => ({ ...f, withdrawal_max_amount: v }))
                    }
                    step={1}
                  />
                  <FeeInput
                    label="Limite diário (R$)"
                    value={fees.withdrawal_daily_max ?? 0}
                    onChange={(v) =>
                      setFees((f) => ({ ...f, withdrawal_daily_max: v }))
                    }
                    step={1}
                  />
                </div>
              </div>
            </>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Salvar {title.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

function FeeInput({
  label,
  value,
  onChange,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  const [raw, setRaw] = useState(value ? String(value) : "");

  useEffect(() => {
    setRaw(value ? String(value) : "");
  }, [value]);

  return (
    <div>
      <label className="text-xs text-muted-foreground/60 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="number"
        step={step}
        min={0}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(Number(e.target.value) || 0);
        }}
        placeholder="0"
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      />
    </div>
  );
}

function BalanceEditor({
  available,
  sellerId,
  onUpdated,
}: {
  available: number;
  sellerId: string;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const formatToInput = (cents: number) => {
    const num = (cents / 100).toFixed(2);
    const [int, dec] = num.split(".");
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
  };

  const parseFromInput = (str: string) => {
    const raw = str.replace(/\D/g, "");
    return parseInt(raw || "0", 10);
  };

  const handleEdit = () => {
    setValue(formatToInput(available));
    setEditing(true);
  };

  const handleSave = async () => {
    const newCents = parseFromInput(value);
    if (newCents < 0) {
      toast.error("Valor inválido");
      return;
    }

    const diff = newCents - available;
    if (diff === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    // Insert an adjustment transaction
    const { error } = await supabase.from("transactions").insert({
      seller_id: sellerId,
      amount: diff,
      method: diff > 0 ? "pix" : "withdrawal",
      status: "completed",
      customer_name: "Ajuste administrativo",
      description:
        diff > 0 ? "Crédito manual pelo admin" : "Débito manual pelo admin",
    } as any);

    if (error) {
      toast.error("Erro ao ajustar saldo");
    } else {
      toast.success("Saldo ajustado!");
      onUpdated();
    }
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Disponível para saque
        </p>
        {!editing && (
          <button
            onClick={handleEdit}
            className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Editar saldo"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">R$</span>
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              const num = (parseInt(raw || "0", 10) / 100).toFixed(2);
              const [int, dec] = num.split(".");
              const formatted =
                int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
              setValue(formatted);
            }}
            autoFocus
            className="flex-1 text-2xl font-bold bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none text-foreground tabular-nums py-0.5"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {formatCurrencyAdmin(available)}
        </p>
      )}
    </div>
  );
}
