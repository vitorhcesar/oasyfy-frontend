import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import { AdminSellerDetail } from "@/presentation/components/AdminSellerDetail";
import { Building2, ChevronRight, Loader2, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { KYC_FILTERS } from "./constants/kyc-filters";
import useAdminKycSubmissionsQuery from "./hooks/use-admin-kyc-submissions-query";
import { TKycFilter } from "./types/kyc-filter.type";
import { IKycSubmissionView } from "./types/kyc-submission-view.type";
import {
  mapAdminKycSubmissionToView,
  mapRegisteredSellerToKycView,
  mapRegisteredSellerToView,
} from "./utils/map-admin-kyc-submissions-to-view.util";

export default function AdminKycPage() {
  const [selectedSeller, setSelectedSeller] =
    useState<IKycSubmissionView | null>(null);
  const [filter, setFilter] = useState<TKycFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, invalidateQuery } =
    useAdminKycSubmissionsQuery(filter);

  const submissions = useMemo(
    () => data.submissions.map(mapAdminKycSubmissionToView),
    [data.submissions],
  );

  const registeredOnly = useMemo(
    () => data.registeredOnly.map(mapRegisteredSellerToView),
    [data.registeredOnly],
  );

  const filtered = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          !search ||
          submission.full_name.toLowerCase().includes(search.toLowerCase()) ||
          submission.cpf?.includes(search) ||
          submission.cnpj?.includes(search) ||
          submission.account_id?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, submissions],
  );

  const filteredRegistered = useMemo(
    () =>
      registeredOnly.filter(
        (seller) =>
          !search ||
          seller.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          seller.account_id?.toLowerCase().includes(search.toLowerCase()) ||
          seller.user_id.includes(search),
      ),
    [registeredOnly, search],
  );

  const totalCount =
    filter === "registered"
      ? filteredRegistered.length
      : filter === "all"
        ? filtered.length + filteredRegistered.length
        : filtered.length;

  const pendingCount = submissions.filter(
    (submission) =>
      submission.status === "pending" || submission.status === "under_review",
  ).length;

  const syncSelectedSeller = async () => {
    const result = await refetch();
    if (!selectedSeller || !result.data) return;

    if (selectedSeller.id) {
      const updatedSubmission = result.data.submissions.find(
        (submission) => String(submission.id) === selectedSeller.id,
      );
      if (updatedSubmission) {
        setSelectedSeller(mapAdminKycSubmissionToView(updatedSubmission));
      }
      return;
    }

    const updatedRegistered = result.data.registeredOnly.find(
      (seller) => String(seller.userId) === selectedSeller.user_id,
    );
    if (updatedRegistered) {
      setSelectedSeller(
        mapRegisteredSellerToKycView(
          mapRegisteredSellerToView(updatedRegistered),
        ),
      );
    }
  };

  const timeAgo = (date: string) => {
    if (!date) return "—";
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return "agora";
  };

  const effectiveStatus = (submission: IKycSubmissionView) => {
    const allApproved =
      submission.status === "approved" &&
      submission.documents_status === "approved" &&
      submission.bank_status === "approved" &&
      submission.address_status === "approved";

    return allApproved
      ? "approved"
      : submission.status === "rejected"
        ? "rejected"
        : "pending";
  };

  if (selectedSeller) {
    return (
      <AdminLayout>
        <div className="px-8 py-8">
          <AdminSellerDetail
            seller={selectedSeller}
            onBack={async () => {
              setSelectedSeller(null);
              await invalidateQuery();
            }}
            onUpdate={syncSelectedSeller}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto w-full">
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

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            {KYC_FILTERS.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === item.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, CPF, CNPJ ou ID da conta..."
              className="pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all w-56 placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
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
                  onClick={() =>
                    setSelectedSeller(mapRegisteredSellerToKycView(seller))
                  }
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
                      {seller.account_id || `#${seller.user_id}`}
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
                  {filtered.map((submission) => {
                    const status = effectiveStatus(submission);
                    return (
                      <button
                        key={submission.id}
                        onClick={() => setSelectedSeller(submission)}
                        className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                          {submission.person_type === "pj" ? (
                            <Building2 size={15} />
                          ) : (
                            <User size={15} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {submission.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                            {submission.email || "—"}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
                            {submission.person_type === "pf"
                              ? submission.cpf
                              : submission.cnpj || "—"}
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
                          {timeAgo(submission.created_at)}
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
                      onClick={() =>
                        setSelectedSeller(mapRegisteredSellerToKycView(seller))
                      }
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
                          {seller.account_id || `#${seller.user_id}`}
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
            {filtered.map((submission) => {
              const status = effectiveStatus(submission);
              return (
                <button
                  key={submission.id}
                  onClick={() => setSelectedSeller(submission)}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                    {submission.person_type === "pj" ? (
                      <Building2 size={15} />
                    ) : (
                      <User size={15} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {submission.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                      {submission.email || "—"}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
                      {submission.person_type === "pf"
                        ? submission.cpf
                        : submission.cnpj || "—"}
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
                    {timeAgo(submission.created_at)}
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
