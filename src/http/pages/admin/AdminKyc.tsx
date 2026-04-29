import { AdminLayout } from "@/http/components/admin/AdminLayout";
import { SellerDetail } from "@/http/components/admin/SellerDetail";
import { supabase } from "@/infra/integrations/supabase/client";
import { Building2, ChevronRight, Search, User } from "lucide-react";
import { useEffect, useState } from "react";

type KycSubmission = {
  id: string;
  user_id: string;
  account_id?: string;
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

type RegisteredSeller = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  account_id?: string;
  created_at: string;
  email_manually_approved?: boolean;
};

export default function AdminKyc() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [registeredOnly, setRegisteredOnly] = useState<RegisteredSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<KycSubmission | null>(
    null
  );
  const [filter, setFilter] = useState<
    "all" | "registered" | "pending" | "approved" | "rejected"
  >("all");
  const [search, setSearch] = useState("");

  const fetchRegisteredWithoutKyc = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "seller");
    const allSellerIds = (roles ?? []).map((r) => r.user_id);

    if (allSellerIds.length === 0) return [] as RegisteredSeller[];

    const { data: kycs } = await supabase
      .from("kyc_submissions")
      .select("user_id");
    const kycUserIds = new Set((kycs ?? []).map((k) => k.user_id));
    const noKycIds = allSellerIds.filter((id) => !kycUserIds.has(id));

    if (noKycIds.length === 0) return [] as RegisteredSeller[];

    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "user_id, full_name, account_id, created_at, email_manually_approved, email"
      )
      .in("user_id", noKycIds);

    return (profiles ?? []).map((p) => ({ ...p, email: p.email || null }));
  };

  const fetchSubmissions = async () => {
    setLoading(true);

    if (filter === "registered") {
      setRegisteredOnly(await fetchRegisteredWithoutKyc());
      setSubmissions([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("kyc_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending") {
      query = query.in("status", ["pending", "under_review"]);
    } else if (filter === "approved") {
      query = query
        .eq("status", "approved")
        .eq("documents_status", "approved")
        .eq("bank_status", "approved");
    } else if (filter === "rejected") {
      query = query.eq("status", filter);
    }
    const [{ data }, sellersWithoutKyc] = await Promise.all([
      query,
      filter === "all"
        ? fetchRegisteredWithoutKyc()
        : Promise.resolve([] as RegisteredSeller[]),
    ]);
    const subs = (data as KycSubmission[]) ?? [];

    // Fetch account_ids from profiles
    const userIds = subs.map((s) => s.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, account_id, email_manually_approved")
        .in("user_id", userIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      subs.forEach((s) => {
        const profile = profileMap.get(s.user_id);
        s.account_id = profile?.account_id || undefined;
        s.email_manually_approved = profile?.email_manually_approved || false;
      });
    }

    setSubmissions(subs);
    setRegisteredOnly(sellersWithoutKyc);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const registeredToKyc = (s: RegisteredSeller): KycSubmission => ({
    id: "",
    user_id: s.user_id,
    account_id: s.account_id,
    full_name: s.full_name || "Sem nome",
    person_type: "pf",
    cpf: null,
    cnpj: null,
    company_name: null,
    company_type: null,
    phone: null,
    email: s.email,
    status: "pending",
    created_at: s.created_at,
    city: "",
    state: "",
    street: "",
    number: "",
    neighborhood: "",
    zip_code: "",
    complement: null,
    bank_data: null,
    address_status: "pending",
    bank_status: "pending",
    documents_status: "pending",
    rejection_reason: null,
    document_front_url: null,
    document_back_url: null,
    selfie_url: null,
    proof_of_address_url: null,
    company_contract_url: null,
    is_banned: false,
    withdrawals_blocked: false,
    withdrawal_block_reason: null,
    email_manually_approved: s.email_manually_approved,
  });

  const filters = [
    { key: "all", label: "Todos" },
    { key: "registered", label: "Cadastrados" },
    { key: "pending", label: "Pendentes" },
    { key: "approved", label: "Aprovados" },
    { key: "rejected", label: "Recusados" },
  ] as const;

  const filtered = submissions.filter(
    (s) =>
      !search ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.cpf?.includes(search) ||
      s.cnpj?.includes(search) ||
      s.account_id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRegistered = registeredOnly.filter(
    (s) =>
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.account_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.user_id.includes(search)
  );

  const totalCount =
    filter === "registered"
      ? filteredRegistered.length
      : filter === "all"
      ? filtered.length + filteredRegistered.length
      : filtered.length;

  const pendingCount = submissions.filter(
    (s) => s.status === "pending" || s.status === "under_review"
  ).length;

  const timeAgo = (date: string) => {
    if (!date) return "—";
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return "agora";
  };

  const effectiveStatus = (sub: KycSubmission) => {
    const allApproved =
      sub.status === "approved" &&
      sub.documents_status === "approved" &&
      sub.bank_status === "approved" &&
      sub.address_status === "approved";
    return allApproved
      ? "approved"
      : sub.status === "rejected"
      ? "rejected"
      : "pending";
  };

  if (selectedSeller) {
    return (
      <AdminLayout>
        <div className="px-8 py-8">
          <SellerDetail
            seller={selectedSeller}
            onBack={() => {
              setSelectedSeller(null);
              fetchSubmissions();
            }}
            onUpdate={async () => {
              await fetchSubmissions();
              const [{ data }, { data: profile }] = await Promise.all([
                supabase
                  .from("kyc_submissions")
                  .select("*")
                  .eq("id", selectedSeller.id)
                  .single(),
                supabase
                  .from("profiles")
                  .select("email_manually_approved")
                  .eq("user_id", selectedSeller.user_id)
                  .maybeSingle(),
              ]);
              if (data)
                setSelectedSeller({
                  ...(data as any),
                  email_manually_approved:
                    profile?.email_manually_approved || false,
                });
            }}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">Produtores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} cadastro{totalCount !== 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="text-amber-600">
                {" "}
                · {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Filters + Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setLoading(true);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, CPF, CNPJ ou ID da conta..."
              className="pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all w-56 placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
          </div>
        ) : filter === "registered" ? (
          filteredRegistered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-muted-foreground">
                Nenhum usuário cadastrado sem documentos.
              </p>
            </div>
          ) : (
            <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/40">
              {filteredRegistered.map((seller) => (
                <button
                  key={seller.user_id}
                  onClick={() => setSelectedSeller(registeredToKyc(seller))}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                    <User size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {seller.full_name || "Sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                      {seller.email || "—"}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
                      {seller.account_id || seller.user_id.slice(0, 8) + "…"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Sem documentos
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/40 flex-shrink-0 w-12 text-right">
                    {timeAgo(seller.created_at)}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground/30 flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          )
        ) : filter === "all" ? (
          filtered.length === 0 && filteredRegistered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-muted-foreground">
                Nenhum produtor encontrado.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.length > 0 && (
                <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/40">
                  {filtered.map((sub) => {
                    const status = effectiveStatus(sub);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSeller(sub)}
                        className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                          {sub.person_type === "pj" ? (
                            <Building2 size={15} />
                          ) : (
                            <User size={15} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {sub.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                            {(sub as any).email || "—"}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
                            {sub.person_type === "pf"
                              ? sub.cpf
                              : sub.cnpj || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              status === "approved"
                                ? "bg-primary"
                                : status === "rejected"
                                ? "bg-destructive"
                                : "bg-amber-500"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              status === "approved"
                                ? "text-primary"
                                : status === "rejected"
                                ? "text-destructive"
                                : "text-amber-600"
                            }`}
                          >
                            {status === "approved"
                              ? "Aprovado"
                              : status === "rejected"
                              ? "Recusado"
                              : "Pendente"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground/40 flex-shrink-0 w-12 text-right">
                          {timeAgo(sub.created_at)}
                        </span>
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground/30 flex-shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredRegistered.length > 0 && (
                <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/40">
                  {filteredRegistered.map((seller) => (
                    <button
                      key={seller.user_id}
                      onClick={() => setSelectedSeller(registeredToKyc(seller))}
                      className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                        <User size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {seller.full_name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                          {seller.email || "—"}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
                          {seller.account_id ||
                            seller.user_id.slice(0, 8) + "…"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Sem documentos
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground/40 flex-shrink-0 w-12 text-right">
                        {timeAgo(seller.created_at)}
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground/30 flex-shrink-0"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">
              Nenhum produtor encontrado.
            </p>
          </div>
        ) : (
          <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/40">
            {filtered.map((sub) => {
              const status = effectiveStatus(sub);
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSeller(sub)}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground`}
                  >
                    {sub.person_type === "pj" ? (
                      <Building2 size={15} />
                    ) : (
                      <User size={15} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sub.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                      {(sub as any).email || "—"}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
                      {sub.person_type === "pf" ? sub.cpf : sub.cnpj || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === "approved"
                          ? "bg-primary"
                          : status === "rejected"
                          ? "bg-destructive"
                          : "bg-amber-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        status === "approved"
                          ? "text-primary"
                          : status === "rejected"
                          ? "text-destructive"
                          : "text-amber-600"
                      }`}
                    >
                      {status === "approved"
                        ? "Aprovado"
                        : status === "rejected"
                        ? "Recusado"
                        : "Pendente"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/40 flex-shrink-0 w-12 text-right">
                    {timeAgo(sub.created_at)}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground/30 flex-shrink-0"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
