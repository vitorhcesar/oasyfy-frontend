import { ChevronDown, Search } from "lucide-react";
import {
  acquirerOptions,
  methodOptions,
  statusOptions,
} from "../constants/filter-options";

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const selectClass =
  "w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer";

interface IAdminTransactionsFiltersProps {
  filterId: string;
  filterPixCode: string;
  filterCustomer: string;
  filterMethod: string;
  filterAcquirer: string;
  filterStatus: string;
  pixSearchLoading: boolean;
  onFilterIdChange: (value: string) => void;
  onFilterPixCodeChange: (value: string) => void;
  onFilterCustomerChange: (value: string) => void;
  onFilterMethodChange: (value: string) => void;
  onFilterAcquirerChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onPixSearch: () => void;
  onClearPixSearch: () => void;
}

export default function AdminTransactionsFilters({
  filterId,
  filterPixCode,
  filterCustomer,
  filterMethod,
  filterAcquirer,
  filterStatus,
  pixSearchLoading,
  onFilterIdChange,
  onFilterPixCodeChange,
  onFilterCustomerChange,
  onFilterMethodChange,
  onFilterAcquirerChange,
  onFilterStatusChange,
  onPixSearch,
  onClearPixSearch,
}: IAdminTransactionsFiltersProps) {
  return (
    <div className="rounded-lg bg-card border border-border/40 p-3 mb-3">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 items-end">
        <div>
          <input
            type="text"
            value={filterId}
            onChange={(e) => onFilterIdChange(e.target.value)}
            placeholder="ID transação"
            className={inputClass}
          />
        </div>
        <div className="relative">
          <input
            type="text"
            value={filterPixCode}
            onChange={(e) => {
              onFilterPixCodeChange(e.target.value);
              if (!e.target.value.trim()) onClearPixSearch();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onPixSearch();
            }}
            placeholder="PIX / End2End"
            className={inputClass}
          />
          {filterPixCode.trim().length >= 3 && (
            <button
              onClick={onPixSearch}
              disabled={pixSearchLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium"
            >
              {pixSearchLoading ? "..." : "⏎"}
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={filterMethod}
            onChange={(e) => onFilterMethodChange(e.target.value)}
            className={selectClass}
          >
            {methodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={10}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
          />
        </div>
        <div className="relative">
          <select
            value={filterAcquirer}
            onChange={(e) => onFilterAcquirerChange(e.target.value)}
            className={selectClass}
          >
            {acquirerOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={10}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className={selectClass}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={10}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
          />
        </div>
        <div>
          <input
            type="text"
            value={filterCustomer}
            onChange={(e) => onFilterCustomerChange(e.target.value)}
            placeholder="Cliente"
            className={inputClass}
          />
        </div>
        <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all">
          <Search size={12} />
          Buscar
        </button>
      </div>
    </div>
  );
}
