import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { STATUS_FILTER_OPTIONS } from "../constants/status-filter-options";

const INPUT_CLASS =
  "w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const SELECT_CLASS =
  "w-full appearance-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer";

interface AdminWithdrawalsFiltersProps {
  filterSeller: string;
  filterStatus: string;
  dateRange: DateRange | undefined;
  onFilterSellerChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClearFilters: () => void;
}

export default function AdminWithdrawalsFilters({
  filterSeller,
  filterStatus,
  dateRange,
  onFilterSellerChange,
  onFilterStatusChange,
  onDateRangeChange,
  onClearFilters,
}: AdminWithdrawalsFiltersProps) {
  return (
    <div className="admin-surface mb-6 p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "liquid-glass-control flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-white/10",
                dateRange?.from && "border-primary/50 text-primary",
              )}
            >
              <CalendarIcon size={14} />
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd/MM/yy", {
                    locale: ptBR,
                  })} - ${format(dateRange.to, "dd/MM/yy", {
                    locale: ptBR,
                  })}`
                : "Período"}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="liquid-glass-control w-auto border-white/15 p-3"
            align="end"
            sideOffset={8}
          >
            <p className="mb-2 text-sm font-medium text-foreground">
              Selecione o período
            </p>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={ptBR}
            />
            {dateRange && (
              <button
                onClick={() => onDateRangeChange(undefined)}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Limpar filtro de data
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
        <input
          type="text"
          value={filterSeller}
          onChange={(e) => onFilterSellerChange(e.target.value)}
          placeholder="Buscar por produtor ou ID do saque..."
          className={INPUT_CLASS}
        />
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className={SELECT_CLASS}
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
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
        <button
          onClick={onClearFilters}
          className="flex h-[42px] items-center justify-center gap-2 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
