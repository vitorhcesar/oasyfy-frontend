import { Button } from "@/presentation/components/ui/button";
import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import { useUserContext } from "@/presentation/context/UserContext";
import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRight, CalendarIcon, Eye, EyeOff } from "lucide-react";
import { useSellerDashboardStore } from "../stores/seller-dashboard.store";
import { SELLER_DASHBOARD_PRESET_RANGES } from "../types/time-range.type";

interface ISellerDashboardHeaderProps {
  onClickWithdrawal: () => void;
}

export default function SellerDashboardHeader({
  onClickWithdrawal,
}: ISellerDashboardHeaderProps) {
  const user = useUserContext();
  const name = user?.name || user?.email?.split("@")[0] || "Seller";

  const { hideBalance, toggleHideBalance } = useHideBalance();

  const { timeRange, setTimeRange, dateRange, setDateRange } =
    useSellerDashboardStore();

  return (
    <header className="mb-7 flex animate-fade-in flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Painel do seller
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
          Olá, {name.split(" ")[0]}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Painel de controle da sua empresa
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          ripple={false}
          onClick={toggleHideBalance}
          title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
          className="liquid-glass-control h-10 min-h-10 shrink-0 gap-2 rounded-2xl border-white/15 bg-transparent text-sm font-medium hover:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
        </Button>

        <Button
          size="sm"
          ripple={false}
          onClick={onClickWithdrawal}
          className="h-10 min-h-10 shrink-0 gap-2 rounded-2xl text-sm font-medium"
        >
          <ArrowUpRight size={15} />
          Solicitar saque
        </Button>

        <div className="liquid-glass-control flex items-center gap-0.5 rounded-2xl p-1">
          {SELLER_DASHBOARD_PRESET_RANGES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setTimeRange(value);
                setDateRange(undefined);
              }}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-semibold uppercase tracking-wide transition-all",
                timeRange === value
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              ripple={false}
              className={cn(
                "liquid-glass-control h-10 min-h-10 shrink-0 gap-2 rounded-2xl border-white/15 bg-transparent text-sm font-medium hover:bg-white/10",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                timeRange === "custom" && "border-primary/50 text-primary",
              )}
            >
              <CalendarIcon size={15} />
              {timeRange === "custom" && dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd/MM", {
                    locale: ptBR,
                  })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
                : "Período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="liquid-glass-control w-auto border-white/15 p-3"
            align="end"
          >
            <p className="mb-2 text-sm font-medium text-foreground">
              Selecione o período
            </p>
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) setTimeRange("custom");
              }}
              disabled={(date) => date > new Date()}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
              initialFocus
            />
            {dateRange && (
              <button
                onClick={() => {
                  setDateRange(undefined);
                  setTimeRange("7d");
                }}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Limpar filtro
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
