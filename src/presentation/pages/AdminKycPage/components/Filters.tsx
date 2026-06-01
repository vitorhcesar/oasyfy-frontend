import { Search } from "lucide-react";
import { KYC_FILTERS } from "../constants/kyc-filters";
import { useAdminKycPageStore } from "../stores/admin-kyc-page.store";

export default function Filters() {
  const { filter, setFilter, search, setSearch } = useAdminKycPageStore();

  return (
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
  );
}
