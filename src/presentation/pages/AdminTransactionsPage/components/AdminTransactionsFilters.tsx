import { ChevronDown, Search } from "lucide-react";
import {
  acquirerOptions,
  methodOptions,
  statusOptions,
} from "../constants/filter-options";

const inputClass =
  "w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const selectClass =
  "w-full appearance-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer";

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
    <div className="admin-surface mb-6 p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
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
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary"
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
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
        <button
          onClick={onPixSearch}
          className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
        >
          <Search size={15} />
          Buscar
        </button>
      </div>
    </div>
  );
}
