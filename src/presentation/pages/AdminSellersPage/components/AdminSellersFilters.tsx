import { Search } from "lucide-react";
import { SELLER_FILTERS } from "../constants/seller-filters";
import { TFilterKey } from "../types/filter-key.type";

interface IAdminSellersFiltersProps {
  filter: TFilterKey;
  counts: Record<TFilterKey, number>;
  search: string;
  onFilterChange: (filter: TFilterKey) => void;
  onSearchChange: (search: string) => void;
}

export default function AdminSellersFilters({
  filter,
  counts,
  search,
  onFilterChange,
  onSearchChange,
}: IAdminSellersFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex gap-1.5 flex-wrap">
        {SELLER_FILTERS.map((item) => (
          <button
            key={item.key}
            onClick={() => onFilterChange(item.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              filter === item.key
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
            <span
              className={`ml-1.5 text-xs ${
                filter === item.key
                  ? "text-background/60"
                  : "text-muted-foreground/50"
              }`}
            >
              {counts[item.key]}
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
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar..."
          className="pl-9 pr-3 py-1.5 rounded-lg bg-muted/30 border border-border/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all w-48"
        />
      </div>
    </div>
  );
}
