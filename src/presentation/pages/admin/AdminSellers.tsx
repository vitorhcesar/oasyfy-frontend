import { supabase } from "@/infrastructure/integrations/supabase/client";
import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Seller = {
  user_id: string;
  full_name: string | null;
  created_at: string;
  kyc_status: string | null;
};

type FilterKey =
  | "all"
  | "sem_kyc"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "sem_kyc", label: "Pendentes" },
  { key: "under_review", label: "Com documento" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Banidos" },
];

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    const fetchSellers = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "seller");
      if (!roles || roles.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = roles.map((r) => r.user_id);
      const [profilesRes, kycsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, created_at")
          .in("user_id", userIds),
        supabase
          .from("kyc_submissions")
          .select("user_id, status")
          .in("user_id", userIds),
      ]);

      const kycMap = new Map(
        (kycsRes.data ?? []).map((k) => [k.user_id, k.status])
      );

      setSellers(
        userIds.map((uid) => {
          const profile = (profilesRes.data ?? []).find(
            (p) => p.user_id === uid
          );
          return {
            user_id: uid,
            full_name: profile?.full_name || null,
            created_at: profile?.created_at || "",
            kyc_status: kycMap.get(uid) || "sem_kyc",
          };
        })
      );
      setLoading(false);
    };
    fetchSellers();
  }, []);

  const filtered = useMemo(() => {
    let list = sellers;
    if (filter !== "all") {
      if (filter === "under_review") {
        list = list.filter(
          (s) => s.kyc_status === "under_review" || s.kyc_status === "pending"
        );
      } else {
        list = list.filter((s) => s.kyc_status === filter);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.full_name?.toLowerCase().includes(q) || s.user_id.includes(q)
      );
    }
    return list;
  }, [sellers, filter, search]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: sellers.length,
      sem_kyc: 0,
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
    };
    sellers.forEach((s) => {
      const st = (s.kyc_status || "sem_kyc") as string;
      if (st in c) c[st as FilterKey]++;
    });
    // "Com documento" = under_review + pending
    c.under_review = c.under_review + c.pending;
    return c;
  }, [sellers]);

  const statusConfig: Record<
    string,
    { label: string; cls: string; dot: string }
  > = {
    sem_kyc: {
      label: "Sem KYC",
      cls: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground/40",
    },
    pending: {
      label: "Pendente",
      cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      dot: "bg-yellow-500",
    },
    under_review: {
      label: "Em análise",
      cls: "bg-blue-500/10 text-blue-600 border-blue-200",
      dot: "bg-blue-500",
    },
    approved: {
      label: "Aprovado",
      cls: "bg-primary/10 text-primary border-primary/20",
      dot: "bg-primary",
    },
    rejected: {
      label: "Banido",
      cls: "bg-destructive/10 text-destructive border-destructive/20",
      dot: "bg-destructive",
    },
  };

  const statusBadge = (status: string | null) => {
    const s = statusConfig[status || "sem_kyc"] || statusConfig.sem_kyc;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium border ${s.cls}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto w-full">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Gerenciamento
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Sellers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os sellers cadastrados na plataforma
          </p>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  filter === f.key
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f.label}
                <span
                  className={`ml-1.5 text-xs ${
                    filter === f.key
                      ? "text-background/60"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-3 py-1.5 rounded-lg bg-muted/30 border border-border/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all w-48"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-muted" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <Users className="text-muted-foreground/40" size={24} />
            </div>
            <p className="text-foreground font-semibold">
              Nenhum seller encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum seller neste filtro.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
                    Cadastro
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((seller, i) => (
                  <tr
                    key={seller.user_id}
                    className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {(seller.full_name || "?")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground text-[13px]">
                          {seller.full_name || "Sem nome"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground/60 text-xs font-mono">
                      {seller.user_id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3.5">
                      {statusBadge(seller.kyc_status)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground/60 text-xs">
                      {seller.created_at
                        ? new Date(seller.created_at).toLocaleDateString(
                            "pt-BR"
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
