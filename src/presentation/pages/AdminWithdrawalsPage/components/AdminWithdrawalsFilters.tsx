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
  "w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const SELECT_CLASS =
  "w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer";

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
    <div
      className="rounded-xl bg-card border border-border/40 p-5 mb-6 animate-fade-in"
      style={{ animationDelay: "50ms" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                dateRange?.from
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-background border-border/50 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              <CalendarIcon size={12} />
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd/MM/yy", {
                    locale: ptBR,
                  })} - ${format(dateRange.to, "dd/MM/yy", {
                    locale: ptBR,
                  })}`
                : "Calendário"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
            <div className="p-3 space-y-2">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                className="rounded-lg border border-border/40"
                locale={ptBR}
              />
              {dateRange && (
                <button
                  onClick={() => onDateRangeChange(undefined)}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar filtro de data
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
          />
        </div>
        <button
          onClick={onClearFilters}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
