import { cn } from "@/presentation/utils/cn";
import { Search } from "lucide-react";
import { KYC_FILTERS } from "../constants/kyc-filters";
import { useAdminKycPageStore } from "../stores/admin-kyc-page.store";

export default function Filters() {
  const { filter, setFilter, search, setSearch } = useAdminKycPageStore();

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="liquid-glass-control flex flex-wrap items-center gap-0.5 rounded-2xl p-1">
        {KYC_FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
              filter === item.key
                ? "bg-white text-[#0F0617] shadow-sm"
                : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-auto">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome, CPF, CNPJ ou ID..."
          className="w-full rounded-2xl border border-border/60 bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all sm:w-64"
        />
      </div>
    </div>
  );
}
